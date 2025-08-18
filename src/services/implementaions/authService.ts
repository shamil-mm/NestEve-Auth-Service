import bcrypt from "bcrypt";
import { IUser, IUserDocument } from "../../model/interfaces/userInterface";
import { Decoded, IAuthService } from "../interfaces/IAuthService";
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
import {
  AppError,
  NotFoundError,
  unauthorizedError,
  ValidationError,
} from "../../error/AppError";
import { firebaseApp } from "../../utils/googleAuthVerification";
import sharp from "sharp";
import { Is3Service } from "../../utils/interfaces/Is3Service";
import { UserCreateProducer } from "../Kafka/kafkaIndex";
import kafkaWrapper from "../Kafka/kafkaWrapper";
import { Producer } from "kafkajs";
import { StatusCodes } from "../../constants/statusCode";
import { RegisterUserType } from "../../dto/RequestDTO/registerUser.dto";
import { LoginRequestDTOType } from "../../dto/RequestDTO/loginRequest.dto";
import {
  LoginDataDTO,
  LoginResponse,
} from "../../dto/ResponseDTO/loginResponse.dto";
import { GoogleAuthRequestDTOType } from "../../dto/RequestDTO/googleAuthRequest.dto";
import { RegisterResponse } from "../../dto/ResponseDTO/registerUserResponse.dto";
import { refreshAccessTokenResponse } from "../../dto/ResponseDTO/refreshAccessTokenResponse.dto";

@injectable()
class AuthService implements IAuthService {
  private _redisClient: RedisClient;
  private _authRepository: IUserRepository;
  private _s3Service: Is3Service;

  constructor(
    @inject("RedisClient") redisClient: RedisClient,
    @inject("AuthRepository") authRepository: IUserRepository,
    @inject("S3Service") s3Service: Is3Service
  ) {
    this._redisClient = redisClient;
    this._authRepository = authRepository;
    this._s3Service = s3Service;
  }

  async registerUser(data: RegisterUserType): Promise<RegisterResponse> {

    const { name, email, password, role, organizationName } = data;

    const existingUser = await this._authRepository.findByEmail(email);
    if (existingUser) throw new AppError(Messages.USER_ALREADY_EXISTS, 409);

    const hashedPassword = await this._hashPassword(password);

    await RedisService.setData(
      `User:${email}`,
      JSON.stringify({ name, email, hashedPassword, role, organizationName }),
      3600
    );

    await RedisService.getData(`User:${email}`);

    try {
      await EmailService.sentEmail(email, Messages.EMAIL_VERIFICATION_SUBJECT);
    } catch (error) {
      throw new AppError(
        Messages.EMAIL_VERIFICATION_FAILURE,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    return { status: true, message: Messages.EMAIL_SENDING };
  }



  async loginUser(data: LoginRequestDTOType): Promise<LoginResponse> {

    const { email, role, password } = data;

    const user = await this._authRepository.findByEmail(email);
    if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);

    const isMatch = await this._comparePassword(password, user.password);
    if (!isMatch) throw new unauthorizedError(Messages.PASSWORD_MISMATCH);

    if (user.role !== role) throw new unauthorizedError(Messages.ROLE_MISMATCH);
    if (user.is_block === true) throw new unauthorizedError(Messages.BlOCKED);

    const accessToken = signToken(user);
    const refreshToken = refreshTokenCreation(user);

    const response: LoginDataDTO = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl ?? undefined,
      is_block: user.is_block,
    };

    return {
      status: true,
      message: Messages.LOGIN_SUCCESSFULL,
      data: response,
      tokens: {
        accessToken: accessToken as string,
        refreshToken: refreshToken as string,
      },
    };
  }



  async loginAdmin(data: LoginRequestDTOType): Promise<LoginResponse> {
    const { email, role, password } = data;

    const user = await this._authRepository.findByEmail(email);
    if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);

    const isMatch = await this._comparePassword(password, user.password);
    if (!isMatch) throw new unauthorizedError(Messages.PASSWORD_MISMATCH);

    if (user.role !== role) throw new unauthorizedError(Messages.ROLE_MISMATCH);

    const accessToken = signToken(user);
    const refreshToken = refreshTokenCreation(user);
    const response:LoginDataDTO={
      id:user._id.toString(),
      email:user.email,
      name:user.name,
      role:user.role,
      avatarUrl:user.avatarUrl ?? undefined,
      is_block:user.is_block,
    }

    return {
      status: true,
      message: Messages.LOGIN_SUCCESSFULL,
      data: response,
      tokens: { accessToken:accessToken as string, refreshToken:refreshToken as string },
    };
  }

 
  async refreshAccessToken(refreshToken: string): Promise<refreshAccessTokenResponse | null> {
   
      const data = verifyToken(refreshToken, config.jwtSecret) as Decoded;

      if (!data) return null;

      const newAccessToken = signToken(data) as string;
      const newRefreshToken = refreshTokenCreation(data) as string;

      return { newAccessToken, newRefreshToken };
    
  }

  async verifyAccount(token: string): Promise<{ message: string }> {
    
      const decoded = verifyToken(token, config.EMAIL_SECRET as string) as {to:string};

      if (!decoded)  throw new unauthorizedError(Messages.TOKEN_FAILURE);

      const email = decoded.to;

      const userData = (await RedisService.getData(`User:${email}`)) as {
        role: "user" | "admin" | "organizer" | undefined;
        organizationName?: string | null;
        email: string;
        name: string;
        hashedPassword: string;
      };

      const existingUser = await this._authRepository.findByEmail(
        userData.email
      );
      if (existingUser) {
        await RedisService.deleteData(`User:${userData.email}`);
        return { message: Messages.ALREADY_VARIFIED_SUCCESS };
      }

      if (!userData) throw new unauthorizedError(Messages.TOKEN_FAILURE);

      try {
        const user: IUserDocument = await this._authRepository.create({
          name: userData.name,
          email: userData.email,
          password: userData.hashedPassword,
          role: userData.role,
          organizationName: userData.organizationName,
        });

        if (user) {
          try {
            await new UserCreateProducer(
              kafkaWrapper.producer as Producer
            ).produce({
              _id: user._id.toString(),
              name: user.name as string,
              email: user.email as string,
              avatarUrl: user.avatarUrl as string,
              organizationName: user.organizationName as string,
              is_block: user.is_block as boolean,
              role: user.role as "user" | "admin" | "organizer",
            });
          } catch (error) {
            const err = error as Error
            throw new AppError(err.message,400)
          }
        }
      } catch (error) {
        console.log(error)
        await RedisService.deleteData(`User:${userData.email}`);
        return { message: Messages.ALREADY_VARIFIED_SUCCESS };
      }

      await RedisService.deleteData(`User:${userData.email}`);
      return { message: Messages.VARIFIED_SUCCESS };
  }

  async forgotPassword(body: {
    email: string;
    password: string;
  }): Promise<{ message: string }> {
    try {
      const user = await this._authRepository.findByEmail(body.email);
      if (!user) throw new Error(Messages.USER_NOT_FOUND);
      await RedisService.setData(
        `Forgot:${body.email}`,
        JSON.stringify({ email: body.email, password: body.password }),
        3600
      );
      let tempData = await RedisService.getData(`Forgot:${body.email}`);
      EmailService.sentEmail(body.email, Messages.FORGOT_PASSWORD_SUBJECT);
      return {
        message: Messages.FORGOT_PASSWORD_SUCCESS,
      };
    } catch (error: any) {
      console.error("Error in forgot password:", error.message);
      throw new Error(Messages.FORGOT_PASSWORD_FAILURE);
    }
  }
  async verifyForgotPassword(token: string): Promise<{ message: string }> {
    try {
      const decoded = verifyToken(token, config.EMAIL_SECRET as string) as {
        to: string;
      };

      if (!decoded) throw new Error(Messages.TOKEN_FAILURE);
      const email = decoded.to;
      const check = await this._authRepository.findByEmail(email);
      if (!check) {
        return { message: Messages.USER_NOT_FOUND };
      }
      let tempData: { email: string; password: string } | null =
        await RedisService.getData(`Forgot:${email}`);
      console.log("from redis storage", tempData);
      const hashedPassword = await this._hashPassword(tempData!.password);
      await this._authRepository.update(email, { password: hashedPassword });
      return { message: Messages.NEW_PASSWORD_SUCCESS };
    } catch (error: any) {
      console.error("Error in forgot password:", error.message);
      return { message: Messages.TOKEN_ERROR };
    }
  }

  // private utility methods

  private async _hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  private async _comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }


  async googleAuth(data: GoogleAuthRequestDTOType): Promise<any> {
    try {
      const { name, email } = await firebaseApp
        .auth()
        .verifyIdToken(data.userID);
      if (!email || !name) {
        throw new AppError(
          Messages.INVALID_GOOGLE_TOKEN,
          StatusCodes.BAD_REQUEST
        );
      }

      let userExists = await this._authRepository.findByEmail(email as string);

      if (!userExists) {
        userExists = await this._authRepository.create({
          email,
          name,
          role: data.role,
        });
      }

      if (userExists.role !== data.role)
        throw new unauthorizedError(Messages.ROLE_MISMATCH);

      const accessToken = signToken(userExists);
      const refreshToken = refreshTokenCreation(userExists);

      return {
        status: true,
        message: Messages.GOOGLE_SIGN_SUCCESS,
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
      throw new AppError(
        Messages.GOOGLE_SIGN_FAILURE,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async currectUser(
    id: string
  ): Promise<{ message: string; user: Partial<IUser> }> {
    const currentUserData = await this._authRepository.findById(id);
    return {
      message: Messages.User_DATA_COLLECTION_SUCCESS,
      user: {
        name: currentUserData?.name,
        email: currentUserData?.email,
        avatarUrl: currentUserData?.avatarUrl,
        role: currentUserData?.role,
        location: currentUserData?.location,
      },
    };
  }

  async updateName(
    userId: string,
    name: string
  ): Promise<{ status: boolean; message: string }> {
    try {
      const res = await this._authRepository.updateName(userId, name);
      return { status: true, message: Messages.NAME_UPDATE_SUCCESS };
    } catch (error) {
      return { status: false, message: Messages.NAME_UPDATE_FAILURE };
    }
  }
  async updatePassword(
    email: string,
    oldpassword: string,
    newpassword: string
  ): Promise<{ status: boolean; message: string }> {
    try {
      const user = await this._authRepository.findByEmail(email);
      let isMatch;
      if (user)
        isMatch = await this._comparePassword(oldpassword, user?.password);

      if (!isMatch) throw new unauthorizedError(Messages.PASSWORD_MISMATCH);
      const hashedPassword = await this._hashPassword(newpassword);
      await this._authRepository.update(email, { password: hashedPassword });
      return {
        status: true,
        message: Messages.PASSWORD_UPDATE_SUCCESS,
      };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }
  async generatePresignedUrl(fileName: string, fileType: string): Promise<any> {
    try {
      const params = {
        Bucket: config.BUCKET_NAME!,
        Key: `uploads/${fileName}` as string,
        ContentType: fileType as string,
      };
    } catch (error: any) {
      return error.message;
    }
  }

  async setImageUrl(
    params: { fileName: string; fileType: string },
    id: string
  ): Promise<{ status: boolean; message: string }> {
    try {
      return { status: true, message: Messages.IMAGE_URL_SUCCESS };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }
  async deleteImageUrl(
    imageUrl: string
  ): Promise<{ status: boolean; message: string }> {
    try {
      const key = imageUrl.split(".com/")[1];

      if (!key) {
        throw new Error(Messages.IMAGE_URL_FAILURE);
      }
      const params = {
        Bucket: config.BUCKET_NAME!,
        Key: key,
      };

      return { status: true, message: Messages.IMAGE_URL_SUCCESS };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }

  async uploadImageToServer(
    file: Express.Multer.File,
    userId: string,
    oldImageUrl: string
  ): Promise<{ status: boolean; message: string; url?: string }> {
    try {
      if (oldImageUrl) {
        await this._s3Service.deleteImageFromBucket(
          `ProfileUploads/${oldImageUrl}`
        );
      }
      const fileKey = `ProfileUploads/${Date.now()}_${Math.random()}`;

      const buffer = await sharp(file.buffer)
        .resize({ height: 300, width: 300, fit: "cover" })
        .toBuffer();
      const response = await this._s3Service.uploadImageToBucket(
        buffer,
        file.mimetype,
        fileKey
      );
      if (response.$metadata.httpStatusCode === 200) {
        const user = await this._authRepository.updateById(userId, {
          avatarUrl: fileKey,
        });
      }
      const imageUrl = await this._s3Service.getImageFromBucket(fileKey);

      return {
        status: true,
        message: Messages.IMAGE_STORE_SUCCESS,
        url: imageUrl as string,
      };
    } catch (error: any) {
      console.log(error);
      return { status: false, message: error.message };
    }
  }
  async getProfileImage(
    avatarUrl: string
  ): Promise<{ status: boolean; message: string; url?: string }> {
    try {
      const imageUrl = await this._s3Service.getImageFromBucket(avatarUrl);
      return {
        status: true,
        message: Messages.IMAGE_STORE_SUCCESS,
        url: imageUrl as string,
      };
    } catch (error: any) {
      console.log(error);
      return { status: false, message: error.message };
    }
  }
  async deleteProfileImage(
    id: string,
    avatarUrl: string
  ): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this._s3Service.deleteImageFromBucket(avatarUrl);
      let user;

      if (result.$metadata.httpStatusCode == 204) {
        user = await this._authRepository.updateById(id, { avatarUrl: null });
      }
      return { status: true, message: Messages.IMAGE_DELETE_SUCESS };
    } catch (error: any) {
      console.log(error);
      return { status: false, message: error.message };
    }
  }

  async saveLocation(
    lat: number,
    lng: number,
    userId: string
  ): Promise<{ message: string }> {
    try {
      console.log(lat, lng, userId);
      await this._authRepository.updateById(userId, {
        location: { type: "Point", coordinates: [lng, lat] },
      });
      return { message: "Location updated successfully" };
    } catch (error: any) {
      console.log(error);
      return { message: error.message };
    }
  }
  async getUserLocation(
    userId: string
  ): Promise<{ lat?: number; lng?: number; message: string }> {
    try {
      const res = await this._authRepository.getUserLocation(userId);
      return {
        message: "successfully get the user location",
        lat: res.lat,
        lng: res.lng,
      };
    } catch (error: any) {
      console.log(error);
      return { message: error.message };
    }
  }
  async checkUserBlock(email: string): Promise<{is_block:boolean} | undefined> {
    try {
      const res = await this._authRepository.findByEmail(email)
      return {
        is_block:res?.is_block as boolean
      };
    } catch (error: any) {
      console.log(error);
      throw new AppError(error,StatusCodes.NOT_FOUND)
    }
  }
}

export default AuthService;
