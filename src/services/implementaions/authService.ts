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

  async registerUser(
    name: string,
    email: string,
    password: string,
    role: "organizer" | "user" | "admin",
    organizationName?: string
  ): Promise<IapiResponse> {
    try {
      const existingUser = await this._authRepository.findByEmail(email);
      if (existingUser) throw new AppError(Messages.USER_ALREADY_EXISTS, 409);

      const hashedPassword = await this._hashPassword(password);

      await RedisService.setData(
        `User:${email}`,
        JSON.stringify({ name, email, hashedPassword, role, organizationName }),
        3600
      );

      let tempUser = await RedisService.getData(`User:${email}`);
      try {
        await EmailService.sentEmail(
          email,
          Messages.EMAIL_VERIFICATION_SUBJECT
        );
        return { status: false, message: Messages.EMAIL_SENDING };
      } catch (error) {
        throw new AppError(Messages.EMAIL_VERIFICATION_FAILURE, StatusCodes.INTERNAL_SERVER_ERROR);
      }
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(Messages.EMAIL_VERIFICATION_ERROR, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async loginUser(
    email: string,
    password: string,
    role: "user" | "organizer" | "admin"
  ) {
    try {
      const user = await this._authRepository.findByEmail(email);
      if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);

      const isMatch = await this._comparePassword(password, user.password);
      if (!isMatch) throw new unauthorizedError(Messages.PASSWORD_MISMATCH);

      if (user.role !== role) throw new unauthorizedError(Messages.ROLE_MISMATCH);
      if (user.is_block === true)
        throw new unauthorizedError(Messages.BlOCKED);

      const accessToken = signToken(user);
      const refreshToken = refreshTokenCreation(user);

      return {
        status: true,
        message: Messages.LOGIN_SUCCESSFULL,
        data: {
          email: user.email,
          role: user.role,
          is_block: user.is_block,
          id: user._id,
          avatarUrl: user.avatarUrl,
          name: user.name,
        },
        tokens: { accessToken, refreshToken },
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(Messages.LOGIN_FAILURE, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  async loginAdmin(
    email: string,
    password: string,
    role: "user" | "organizer" | "admin"
  ): Promise<any> {
    try {
      const user = await this._authRepository.findByEmail(email);
      if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);

      const isMatch = await this._comparePassword(password, user.password);
      if (!isMatch) throw new unauthorizedError(Messages.PASSWORD_MISMATCH);

      if (user.role !== role) throw new unauthorizedError(Messages.ROLE_MISMATCH);

      const accessToken = signToken(user);
      const refreshToken = refreshTokenCreation(user);

      return {
        status: true,
        message: Messages.LOGIN_SUCCESSFULL,
        data: { email: user.email, role: user.role, is_block: user.is_block },
        tokens: { accessToken, refreshToken },
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(Messages.LOGIN_FAILURE, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async logout(req: Request, res: Response): Promise<any> {
    try {
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
      const decoded = verifyToken(token, config.EMAIL_SECRET as string) as {
        to: string;
      };

      if (!decoded) {
        throw new Error(Messages.TOKEN_FAILURE);
      }
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

      if (!userData) throw new Error(Messages.TOKEN_FAILURE);

      try {
        const user: Partial<IUser> = await this._authRepository.create({
          name: userData.name,
          email: userData.email,
          password: userData.hashedPassword,
          role: userData.role,
          organizationName: userData.organizationName,
        });

        if (user && user.role === "organizer") {
          try {
            await new UserCreateProducer(
              kafkaWrapper.producer as Producer
            ).produce({
              _id: user._id as string,
              name: user.name as string,
              email: user.email as string,
              avatarUrl: user.avatarUrl as string,
              organizationName: user.organizationName as string,
              is_block: user.is_block as boolean,
              role: user.role as "user" | "admin" | "organizer",
            });
          } catch (error) {
            console.log("error from kafka service in service", error);
          }
        }
      } catch (error) {
        await RedisService.deleteData(`User:${userData.email}`);
        return { message: Messages.ALREADY_VARIFIED_SUCCESS };
      }

      await RedisService.deleteData(`User:${userData.email}`);
      return { message: Messages.VARIFIED_SUCCESS };
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
      return { message: Messages.NEW_PASSWORD_SUCCESS};
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
  async googleAuth(data: {
    userID: string;
    role: "organizer" | "user" | "admin";
  }): Promise<any> {
    try {
      const { name, email } = await firebaseApp
        .auth()
        .verifyIdToken(data.userID);

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
        message:Messages.GOOGLE_SIGN_SUCCESS ,
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
      throw new AppError(Messages.GOOGLE_SIGN_FAILURE, StatusCodes.INTERNAL_SERVER_ERROR);
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
      },
    };
  }
  async addAddress(
    email: string,
    address: {
      phone: string;
      street: string;
      city: string;
      state: string;
      country: string;
      zip: string;
    }
  ): Promise<{ status: boolean; message: string; address?: object }> {
    try {
      const user = await this._authRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundError(Messages.USER_NOT_FOUND);
      }
      if (Array.isArray(user.address)) {
        if (user.address.length >= 4) {
          throw new ValidationError(Messages.ADDRESS_COUNT_LIMIT);
        }
      }
      const isDuplicate = Array.isArray(user.address)
        ? user.address.some(
            (addr: any) =>
              JSON.stringify(addr.street) === JSON.stringify(address.street)
          )
        : false;
      if (isDuplicate) {
        throw new ValidationError(Messages.SAME_ADDRESS_ERROR);
      }
      const addedAddress = await this._authRepository.addAddress(
        email,
        address
      );

      return {
        status: true,
        message: Messages.ADDRESS_SUCCESS,
        address,
      };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }
  async getAddress(
    id: string
  ): Promise<{ message: string; address: object[] }> {
    const addresses = await this._authRepository.getAddresses(id);
    return { message: Messages.GET_ADDRESS_SUCCESS, address: addresses };
  }
  async deleteAddress(
    userId: string,
    addressId: string
  ): Promise<{ message: string }> {
    await this._authRepository.deleteAddress(userId, addressId);
    return { message: Messages.DELECT_ADDRESS_SUCCESS };
  }

  async updateAddress(
    email: string,
    addressId: string,
    address: {
      phone?: string;
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zip?: string;
    }
  ): Promise<{ status: boolean; message: string }> {
    try {
      const user = await this._authRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundError(Messages.USER_NOT_FOUND);
      }
      const isDuplicate = Array.isArray(user.address)
        ? user.address.some(
            (addr: any) =>
              JSON.stringify(addr.street) === JSON.stringify(address.street)
          )
        : false;
      if (isDuplicate) {
        throw new ValidationError(Messages.SAME_ADDRESS_ERROR);
      }
      const updateAddress = await this._authRepository.updateAddress(
        email,
        addressId,
        address
      );
      return { status: true, message: Messages.ADDRESS_SUCCESS };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }
  async updateName(
    userId: string,
    name: string
  ): Promise<{ status: boolean; message: string }> {
    try {
      const res = await this._authRepository.updateName(userId, name);
      return { status: true, message:Messages.NAME_UPDATE_SUCCESS  };
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
      console.error("Error generating pre-signed URL:", error);
      return error.message;
    }
  }

  async setImageUrl(
    params: { fileName: string; fileType: string },
    id: string
  ): Promise<{ status: boolean; message: string }> {
    try {
      // const user=await this.authRepository.updateById(id,{avatarUrl:params})
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
      // await s3Client.send(new DeleteObjectCommand(params))

      return { status: true, message:Messages.IMAGE_URL_SUCCESS };
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
        message:Messages.IMAGE_STORE_SUCCESS ,
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
}

export default AuthService;
