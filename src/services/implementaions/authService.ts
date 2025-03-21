import bcrypt from "bcrypt";
import { IUser } from "../../model/interfaces/userInterface";
import {
  Decoded,
  IAuthService,
  IapiResponse,
} from "../interfaces/IAuthService";
import { IUserRepository } from "../../repositories/interfaces/IUserRepository";
import {
  refreshTokenCreation,
  signToken,
  verifyToken,
} from "../../utils/jwtUtils";
import { Redis as RedisClient } from "ioredis";
import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";

import EmailService from "./emailService";
import { Messages } from "../../constants/messages";
import RedisService from "./RedisService";
import config from "../../config/config";
import AuthRepository from "../../repositories/implementations/authRepository";
import {
  AppError,
  NotFoundError,
  unauthorizedError,
  ValidationError,
} from "../../error/AppError";
import { firebaseApp } from "../../utils/googleAuthVerification";

import { PutObjectCommand,DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../../utils/s3bucket";

@injectable()
class AuthService implements IAuthService {
  private redisClient: RedisClient;
  private authRepository: IUserRepository;

  constructor(
    @inject("RedisClient") redisClient: RedisClient,
    @inject("AuthRepository") authRepository: IUserRepository
  ) {
    this.redisClient = redisClient;
    this.authRepository = authRepository;
  }

  async registerUser(
    name: string,
    email: string,
    password: string,
    role: "organizer" | "user" | "admin",
    organizationName?: string
  ): Promise<IapiResponse> {
    try {
      const existingUser = await this.authRepository.findByEmail(email);
      if (existingUser) throw new AppError("User already exists", 409);

      const hashedPassword = await this.hashPassword(password);

      await RedisService.setData(
        `User:${email}`,
        JSON.stringify({ name, email, hashedPassword, role, organizationName }),
        3600
      );

      let tempUser = await RedisService.getData(`User:${email}`);
      console.log("redis stored data", tempUser);
      try {
        await EmailService.sentEmail(
          email,
          Messages.EMAIL_VERIFICATION_SUBJECT
        );
        return { status: false, message: "email sent to the user" };
      } catch (error) {
        console.log("email sending error", error);
        throw new AppError("Failed to send verification email", 500);
      }
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to send verification email", 500);
    }
  }

  async loginUser(
    email: string,
    password: string,
    role: "user" | "organizer" | "admin"
  ) {
    try {
      console.log("login service is working");
      const user = await this.authRepository.findByEmail(email);
      if (!user) throw new NotFoundError("User not Found");

      const isMatch = await this.comparePassword(password, user.password);
      if (!isMatch) throw new unauthorizedError("Password not Matching");
      console.log("password not matching existed code is working");

      if (user.role !== role) throw new unauthorizedError("Role mismatching");
      if (user.is_block === true)
        throw new unauthorizedError("You are Blocked by Admin");

      const accessToken = signToken(user);
      const refreshToken = refreshTokenCreation(user);

      return {
        status: true,
        message: "Login successful. Welcome back!",
        data: {
          email: user.email,
          role: user.role,
          is_block: user.is_block,
          id: user._id,
          avatarUrl:user.avatarUrl,
          name:user.name
        },
        tokens: { accessToken, refreshToken },
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to login your account", 500);
    }
  }
  async loginAdmin(
    email: string,
    password: string,
    role: "user" | "organizer" | "admin"
  ): Promise<any> {
    console.log("admin service is working");

    try {
      console.log("login service is working");
      const user = await this.authRepository.findByEmail(email);
      if (!user) throw new NotFoundError("User not Found");

      const isMatch = await this.comparePassword(password, user.password);
      if (!isMatch) throw new unauthorizedError("Password not Matching");
      console.log("password not matching existed code is working");

      if (user.role !== role) throw new unauthorizedError("Role mismatching");

      const accessToken = signToken(user);
      const refreshToken = refreshTokenCreation(user);

      return {
        status: true,
        message: "Login successful. Welcome back!",
        data: { email: user.email, role: user.role, is_block: user.is_block },
        tokens: { accessToken, refreshToken },
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to login your account", 500);
    }
  }

  async logout(req: Request, res: Response): Promise<any> {
    try {
      console.log(req?.cookies);
      // res.cookie("refreshToken", "", {
      //   httpOnly: true,
      //   secure: config.NODE_ENV === "production",
      //   sameSite: "strict",
      //   maxAge: 0,
      // });
      // return { messages: "logged out successfully" };
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error("Logout failed: Invalid or expired token");
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<object | null> {
    try {
      const data = verifyToken(refreshToken, config.jwtSecret) as Decoded;

      if (!data) {
        return null;
        throw new Error("refresh token is not in redis data");
      }

      const newAccessToken = signToken(data) as string;
      const newRefreshToken = refreshTokenCreation(data) as string;

      return { newAccessToken, newRefreshToken };
    } catch (error) {
      console.error("Refresh token error:", error);
      return null;
    }
  }

  async verifyAccount(token: string): Promise<{ message: string }> {
    try {
      console.log("verify email is working");
      const decoded = verifyToken(token, config.EMAIL_SECRET as string) as {
        to: string;
      };

      if (!decoded) {
        throw new Error("Invalid or expired token");
      }
      const email = decoded.to;

      const userData = (await RedisService.getData(`User:${email}`)) as {
        role: "user" | "admin" | "organizer" | undefined;
        organizationName?: string | null;
        email: string;
        name: string;
        hashedPassword: string;
      };
      const existingUser = await this.authRepository.findByEmail(
        userData.email
      );
      if (existingUser) {
        await RedisService.deleteData(`User:${userData.email}`);
        return { message: "Account already verified. You can now login." };
      }

      if (!userData) throw new Error("Invalid or expired token");

      try {
        await this.authRepository.create({
          name: userData.name,
          email: userData.email,
          password: userData.hashedPassword,
          role: userData.role,
          organizationName: userData.organizationName,
        });
      } catch (error) {
        await RedisService.deleteData(`User:${userData.email}`);
        return { message: "Account already verified. You can now login." };
      }

      await RedisService.deleteData(`User:${userData.email}`);
      return { message: "Account verified successfully. You can login now." };
    } catch (error: any) {
      console.error("Error in verifyEmail:", error);
      throw new Error("Email verification failed");
    }
  }

  async forgotPassword(body: {
    email: string;
    password: string;
  }): Promise<{ message: string }> {
    try {
      const user = await this.authRepository.findByEmail(body.email);
      if (!user) throw new Error("user not exists");
      // await RedisService.setData(`User:${email}`,JSON.stringify({name,email,hashedPassword,role,organizationName}),3600)
      // let tempUser= await RedisService.getData(`User:${email}`)
      await RedisService.setData(
        `Forgot:${body.email}`,
        JSON.stringify({ email: body.email, password: body.password }),
        3600
      );
      let tempData = await RedisService.getData(`Forgot:${body.email}`);
      EmailService.sentEmail(body.email, Messages.FORGOT_PASSWORD_SUBJECT);
      return {
        message: "forgot password verificaion on process verify to proceed",
      };
    } catch (error: any) {
      console.error("Error in forgot password:", error.message);
      throw new Error("forgot password verification failed");
    }
  }
  async verifyForgotPassword(token: string): Promise<{ message: string }> {
    try {
      const decoded = verifyToken(token, config.EMAIL_SECRET as string) as {
        to: string;
      };
      console.log(decoded, "from verify forgot password");
      if (!decoded) throw new Error("Invalid or expired token");
      const email = decoded.to;
      const check = await this.authRepository.findByEmail(email);
      if (!check) {
        return { message: "User not fount" };
      }
      let tempData: { email: string; password: string } | null =
        await RedisService.getData(`Forgot:${email}`);
      console.log("from redis storage", tempData);
      const hashedPassword = await this.hashPassword(tempData!.password);
      await this.authRepository.update(email, { password: hashedPassword });
      return { message: "new password successfully updated" };
    } catch (error: any) {
      console.error("Error in forgot password:", error.message);
      return { message: "An error occurred while verifying the token" };
    }
  }

  // private utility methods

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  private async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
  async googleAuth(data: {
    userID: string;
    role: "organizer" | "user" | "admin";
  }): Promise<any> {
    try {
      console.log("google auth service is working");

      const { name, email } = await firebaseApp
        .auth()
        .verifyIdToken(data.userID);
      console.log(name, email);

      let userExists = await this.authRepository.findByEmail(email as string);
      if (!userExists) {
        console.log("google auth service is creating a user");
        userExists = await this.authRepository.create({
          email,
          name,
          role: data.role,
        });
      }

      if (userExists.role !== data.role)
        throw new unauthorizedError("Role mismatching");

      const accessToken = signToken(userExists);
      const refreshToken = refreshTokenCreation(userExists);

      console.log("user loggedin with the cridentionals");

      return {
        status: true,
        message: "You have successfully signed in with Google !",
        data: {
          email: userExists.email,
          role: userExists.role,
          is_block: userExists.is_block,
        },
        tokens: { accessToken, refreshToken },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to login your account", 500);
    }
  }

  async currectUser(
    id: string
  ): Promise<{ message: string; user: Partial<IUser> }> {
    const currentUserData = await this.authRepository.findById(id);
    return {
      message: "userData successfully collected",
      user: {
        name: currentUserData?.name,
        email: currentUserData?.email,
        avatarUrl: currentUserData?.avatarUrl,
        role: currentUserData?.role,
      },
    };
  }
  async addAddress(
    email: string,
    address: {
      phone:string;
    street: string;
    city: string;
    state: string;
    country:string;
    zip: string;
  
    }
  ): Promise<{status:boolean, message: string }> {

    try {
      const user = await this.authRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundError("User Not fount");
      }
      if (Array.isArray(user.address)) {
        if (user.address.length >= 4) {
          throw new ValidationError("You can only add up to 4 addresss");
        }
      }
      const isDuplicate = Array.isArray(user.address)
        ? user.address.some(
            (addr: any) => JSON.stringify(addr.street)===JSON.stringify(address.street) 
          )
        : false;
      if (isDuplicate) {
        throw new ValidationError("You are trying to add the same address");
      }
      const updateAddress = await this.authRepository.addAddress(
        email,
        address
      );
      return {status:true, message: "Address has been successfully set up" }; 
    } catch (error:any) {
      return {status:false, message:error.message };
      
    }
   
  }
  async getAddress(
    id: string
  ): Promise<{ message: string; address: object[] }> {
    const addresses = await this.authRepository.getAddresses(id);
    return { message: "success", address: addresses };
  }
  async deleteAddress(userId: string, addressId: string): Promise<{ message: string; }> {
    await this.authRepository.deleteAddress(userId,addressId)
    return {message:"deleted successfully"}
  }

  async updateAddress(email: string,addressId:string,
    address: {
      phone?:string;
    street?: string;
    city?: string;
    state?: string;
    country?:string;
    zip?: string;
  
    }): Promise<({ status: boolean; message: string; })> {
    try {
      const user = await this.authRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundError("User Not fount");
      }
      const isDuplicate = Array.isArray(user.address)
        ? user.address.some(
            (addr: any) => JSON.stringify(addr.street)===JSON.stringify(address.street) 
          )
        : false;
      if (isDuplicate) {
        throw new ValidationError("You are trying to add the same address");
      }
      const updateAddress = await this.authRepository.updateAddress(
        email,
        addressId,
       address
      );
      return {status:true, message: "Address has been successfully set up" }; 
    } catch (error:any) {
      console.log(error.message)
      return {status:false, message:error.message };  
    }
    
  }
  async updateName(userId: string, name: string): Promise<{ status:boolean,message: string; }> {
    try {

      const res=await this.authRepository.updateName(userId,name)
      return {status:true,message:"name has beed successfully updated"}
      
    } catch (error) {
      return {status:false,message:"name updation failed"}
    }
  }
  async updatePassword(email: string,oldpassword: string, newpassword: string): Promise<{ status: boolean; message: string; }> {
    try {
      const user=await this.authRepository.findByEmail(email)
      let isMatch
      if(user)isMatch = await this.comparePassword(oldpassword, user?.password);

        if (!isMatch) throw new unauthorizedError("Password not Matching");
        const hashedPassword=await this.hashPassword(newpassword)
        await this.authRepository.update(email,{password:hashedPassword})
    return {status:true,message:"password has beed successfully updated"}
      
      
    } catch (error:any) {
      return {status:false,message:error.message}
    }
  }
  async generatePresignedUrl(fileName: string, fileType: string): Promise<string> {
    try {
      console.log(fileName,'from generatepresigned url service',fileType)
      const params={
        Bucket:config.BUCKET_NAME!,
        Key:fileName as string,
        ContentType:fileType as string
      }
      const command= new PutObjectCommand(params);
      const url =await getSignedUrl(s3Client,command,{expiresIn:300})
      return url as string
      
    } catch (error:any) {
      console.error("Error generating pre-signed URL:", error);
      return error.message
    }
  }

  async setImageUrl(imageUrl: string,id:string): Promise<{ status: boolean; message: string; }> {

    try {
      console.log("imageurl",imageUrl,"userid",id)
      const user=await this.authRepository.updateById(id,{avatarUrl:imageUrl})
        return {status:true,message:"imageUrl stored successfully"}
    } catch (error:any) {
      return {status:false,message:error.message}
    }
  }
  async deleteImageUrl(imageUrl: string): Promise<{ status: boolean; message: string; }> {
    try {
      const key=imageUrl.split('.com/')[1]
      console.log(key)
      if(!key){
        throw new Error('Invalid image Url')
      }
      const params={
        Bucket:config.BUCKET_NAME!,
        Key:key
      }
      await s3Client.send(new DeleteObjectCommand(params))
      console.log("Old image deleted successfully");
      return {status:true,message:"imageUrl stored successfully"}
    } catch (error:any) {
      return {status:false,message:error.message}
    }
  }
}

export default AuthService;
