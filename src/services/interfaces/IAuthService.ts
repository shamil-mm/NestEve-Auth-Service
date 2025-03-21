import { Request, Response } from "express";
import { IUser } from "../../model/interfaces/userInterface";

export interface IapiResponse {
  status: boolean;
  message: string;
  data?: any;
}

export interface IAuthService {
  registerUser(
    name: string,
    email: string,
    password: string,
    role: "organizer" | "user" | "admin",
    organizationName?: string | null
  ): Promise<IapiResponse>;
  loginUser(
    email: string,
    password: string,
    role: "organizer" | "user" | "admin"
  ): Promise<any>;
  loginAdmin(
    email: string,
    password: string,
    role: "organizer" | "user" | "admin"
  ): Promise<any>;
  logout(req: Request, res?: Response): Promise<void>;
  refreshAccessToken(refreshToken: string): Promise<any>;
  verifyAccount(token: string): Promise<{ message: string }>;
  forgotPassword(body: {
    email: string;
    password: string;
  }): Promise<{ message: string }>;
  verifyForgotPassword(token: string): Promise<{ message: string }>;
  googleAuth(data: {
    userID: string;
    role: "organizer" | "user" | "admin";
  }): Promise<any>;

  currectUser(id:string):Promise<{message:string,user:Partial<IUser>}>
  addAddress(email:string,address:object):Promise<({status:boolean,message:string})>
  updateAddress(email: string, addressId: string, updatedAddress: object):Promise<({status:boolean,message:string})>
  getAddress(id:string):Promise<{message:string,address:object[]}>
  deleteAddress(userId:string,addressId:string):Promise<{ message: string }>
  updateName(userId:string,name:string):Promise<{status:boolean,message:string}>
  updatePassword(email:string,oldpassword:string,newpassword:string):Promise<{status:boolean,message:string}>
  generatePresignedUrl(fileName:string,fileType:string):Promise<string>
  setImageUrl(imageUrl:string,id:string):Promise<{status:boolean,message:string}>
  deleteImageUrl(imageUrl:string):Promise<{status:boolean,message:string}>

}

export interface Decoded {
  id: string;
  email: string;
  iat: number;
  exp: number;
}
