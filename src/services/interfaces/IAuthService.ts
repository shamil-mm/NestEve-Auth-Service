import { Request, Response } from "express";

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
}

export interface Decoded {
  id: string;
  email: string;
  iat: number;
  exp: number;
}
