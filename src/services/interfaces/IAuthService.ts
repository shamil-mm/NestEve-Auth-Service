import { Request, Response } from "express";
import { IUser } from "../../model/interfaces/userInterface";
import { RegisterUserType } from "../../dto/RequestDTO/registerUser.dto";
import { LoginRequestDTOType } from "../../dto/RequestDTO/loginRequest.dto";
import { GoogleAuthRequestDTOType } from "../../dto/RequestDTO/googleAuthRequest.dto";
import { LoginResponse } from "../../dto/ResponseDTO/loginResponse.dto";
import { RegisterResponse } from "../../dto/ResponseDTO/registerUserResponse.dto";
import { refreshAccessTokenResponse } from "../../dto/ResponseDTO/refreshAccessTokenResponse.dto";



export interface IAuthService {
  registerUser(data: RegisterUserType): Promise<RegisterResponse>;
  loginUser(data: LoginRequestDTOType): Promise<LoginResponse>;
  loginAdmin(data: LoginRequestDTOType): Promise<LoginResponse>;
  refreshAccessToken(refreshToken: string): Promise<refreshAccessTokenResponse|null>;
  
  verifyAccount(token: string): Promise<{ message: string }>;
  forgotPassword(body: {
    email: string;
    password: string;
  }): Promise<{ message: string }>;
  verifyForgotPassword(token: string): Promise<{ message: string }>;
  googleAuth(data: GoogleAuthRequestDTOType): Promise<any>;

  currectUser(id: string): Promise<{ message: string; user: Partial<IUser> }>;
  updateName(
    userId: string,
    name: string
  ): Promise<{ status: boolean; message: string }>;
  updatePassword(
    email: string,
    oldpassword: string,
    newpassword: string
  ): Promise<{ status: boolean; message: string }>;
  generatePresignedUrl(fileName: string, fileType: string): Promise<string>;
  setImageUrl(
    params: { fileName: string; fileType: string },
    id: string
  ): Promise<{ status: boolean; message: string }>;
  deleteImageUrl(
    imageUrl: string
  ): Promise<{ status: boolean; message: string }>;
  uploadImageToServer(
    file: Express.Multer.File,
    userId: string,
    oldImageUrl: string
  ): Promise<{ status: boolean; message: string; url?: string }>;
  getProfileImage(
    avatarUrl: string
  ): Promise<{ status: boolean; message: string; url?: string }>;
  deleteProfileImage(
    id: string,
    avatarUrl: string
  ): Promise<{ status: boolean; message: string }>;
  saveLocation(
    lat: number,
    lng: number,
    userId: string
  ): Promise<{ message: string }>;
  getUserLocation(
    userId: string
  ): Promise<{ lat?: number; lng?: number; message: string }>;
  checkUserBlock(email:string):Promise<{is_block:boolean}|undefined>
}

export interface Decoded {
  id: string;
  email: string;
  iat: number;
  exp: number;
}
