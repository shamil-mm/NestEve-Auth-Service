import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IAuthService } from "../../services/interfaces/IAuthService";
import { IAuthController } from "../interfaces/IAuthController";
import {
  RegisterUserSchema,
  LoginUserSchema,
  RefreshTokenSchema,
  VerifyAccountSchema,
} from "../../validator/userValidator";
import { z } from "zod";


@injectable()
class AuthController implements IAuthController {
  constructor(@inject("AuthService") private authService: IAuthService) {}
  async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedBody = RegisterUserSchema.parse(req.body);
      await this.authService.registerUser(validatedBody.name, validatedBody.email, validatedBody.password);
      res
        .status(201)
        .json({ message: "verify your email to complete the user creation" });
    } catch (error) {
      const err = error as Error;
      if (error instanceof z.ZodError) {
        console.error("Validation failed:", error.errors);
      } else {
        res.status(401).json({ error: err.message });
      }
    } 
  }
  async login(req: Request, res: Response): Promise<void> {
    try {
        const validatedBody=LoginUserSchema.parse(req.body)
      const result = await this.authService.loginUser(validatedBody.email, validatedBody.password, res);
      res.status(200).json(result);
    } catch (error) {
        const err = error as Error;
      if (err instanceof z.ZodError) {
        console.error("Validation failed:", err.errors);
        res.status(401).json({ error: err.errors });
      } else {
        res.status(401).json({ error: err.message });
      }
    }
  }
  async adminLogin(req: Request, res: Response): Promise<void> {
    try {
      console.log("admin controller is working");

      const { email, password } = req.body;
      const result = await this.authService.loginAdmin(email, password, res);
      res.status(201).json(result);
    } catch (error) {
        const err = error as Error;
      if (err instanceof z.ZodError) {
        console.error("Validation failed:", err.errors);
        res.status(401).json({ error: err.errors });
      } else {
        res.status(401).json({ error: err.message });
      }
     
    }
  }
  async logout(req: Request, res: Response): Promise<void> {
    try {
      console.log("logout controller is working");

      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        res.status(400).json({ message: "no token provided" });
        return;
      }
      const result = await this.authService.logout(token, res);
      res.status(200).json(result);
    } catch (error) {
      const err = error as Error;
      res.status(401).json({ error: err.message });
    }
  }
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const validatedBody=RefreshTokenSchema.parse(req.body)
      const newToken = await this.authService.refreshAccessToken(validatedBody.refreshToken);
      res.status(200).json({ token: newToken });
    } catch (error) {
      const err = error as Error;
      if (
        err.message === "Invalid refresh token" ||
        err.message === "Refresh token expired"
      ) {
        res.status(401).json({ error: err.message });
      }else if(err instanceof z.ZodError) {
        console.error("Validation failed:", err.errors);
      } else {
        res.status(500).json({ error: "Internal server error.",err });
      }
     
    }
  }
  async verifyAccount(req: Request, res: Response): Promise<void> {
    const { token } = req.query;
    const validatedBody=VerifyAccountSchema.parse(req.body)
    try {
      const result = await this.authService.verifyAccount(validatedBody.token as string);
      res.status(201).json(result);
    } catch (error :any) {
        res.status(400).json({ message: error.message });
    }
  }
}

export default AuthController;
