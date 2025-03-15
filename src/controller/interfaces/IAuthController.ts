import { NextFunction, Request, response, Response } from "express";
import { boolean } from "zod";
export interface IAuthController {
  register(req: Request, res: Response, next: NextFunction): Promise<void>;
  login(req: Request, res: Response, next: NextFunction): Promise<void>;
  adminLogin(req: Request, res: Response, next: NextFunction): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  adminLogout(req: Request, res: Response): Promise<void>;
  refreshToken(req: Request, res: Response): Promise<void>;
  verifyAccount(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request, res: Response): Promise<void>;
  verifyForgotPassword(req: Request, res: Response): Promise<void>;
  googleAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
}
