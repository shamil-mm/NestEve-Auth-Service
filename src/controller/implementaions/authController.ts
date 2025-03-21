import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IAuthService } from "../../services/interfaces/IAuthService";
import { IAuthController } from "../interfaces/IAuthController";
import {
  RegisterUserSchema,
  LoginUserSchema,
  RefreshTokenSchema,
  VerifyAccountSchema,
  forgotPasswordSchema,
  googleAuthSchema,
} from "../../validator/userValidator";
import { z } from "zod";
import { AppError, ValidationError } from "../../error/AppError";
import config from "../../config/config";

@injectable()
class AuthController implements IAuthController {
  constructor(@inject("AuthService") private authService: IAuthService) {}

  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("register is working");
      const validatedBody = RegisterUserSchema.parse(req.body);
      const result = await this.authService.registerUser(
        validatedBody.name,
        validatedBody.email,
        validatedBody.password,
        validatedBody.role,
        validatedBody.organizationName
      );

      res
        .status(201)
        .json({ status: true, message: result.message, data: result.data });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation failed:", error.errors);
        next(new ValidationError("validation failed"));
      } else if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("internal Server Error", 500));
      }
    }
  }
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log("login controller is working");

      const validatedBody = LoginUserSchema.parse(req.body);
      const result = await this.authService.loginUser(
        validatedBody.email,
        validatedBody.password,
        validatedBody.role
      );

      res.cookie("accessToken", result.tokens.accessToken, {
        httpOnly: true,
        secure: config.NODE_ENV !== "development",
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", result.tokens.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV !== "development",
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json(result);
    } catch (error) {
      const err = error as Error;
      if (err instanceof z.ZodError) {
        console.error("Validation failed:", err.errors);
        next(new ValidationError("validation failed"));
      } else if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("internal Server Error", 500));
      }
    }
  }
  async adminLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("adminlogin controller is working");

      const validatedBody = LoginUserSchema.parse(req.body);
      const result = await this.authService.loginUser(
        validatedBody.email,
        validatedBody.password,
        validatedBody.role
      );

      res.cookie("admin_accessToken", result.tokens.accessToken, {
        httpOnly: true,
        secure: config.NODE_ENV !== "development",
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("admin_refreshToken", result.tokens.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV !== "development",
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json(result);
    } catch (error) {
      const err = error as Error;
      if (err instanceof z.ZodError) {
        console.error("Validation failed:", err.errors);
        next(new ValidationError("validation failed"));
      } else if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("internal Server Error", 500));
      }
    }
  }
  async logout(req: Request, res: Response): Promise<void> {
    try {
      console.log("logout controller is working");
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: config.NODE_ENV !== "development",
        sameSite: "none",
        maxAge: 0,
      });
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: config.NODE_ENV !== "development",
        sameSite: "none",
        maxAge: 0,
      });
      res.status(200).json({ success: "User Logout Success" });
    } catch (error) {
      const err = error as Error;
      res.status(401).json({ error: err.message });
    }
  }
  async adminLogout(req: Request, res: Response): Promise<void> {
    try {
      console.log("admin logout controller is working");
      res.clearCookie("admin_accessToken", {
        httpOnly: true,
        secure: config.NODE_ENV !== "development",
        sameSite: "none",
        maxAge: 0,
      });
      res.clearCookie("admin_refreshToken", {
        httpOnly: true,
        secure: config.NODE_ENV !== "development",
        sameSite: "none",
        maxAge: 0,
      });
      res.status(200).json({ success: "User Logout Success" });
    } catch (error) {
      const err = error as Error;
      res.status(401).json({ error: err.message });
    }
  }
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const validatedBody = RefreshTokenSchema.parse(req.body);
      const newToken = await this.authService.refreshAccessToken(
        validatedBody.refreshToken
      );
      if (newToken) {
        res.status(200).json({ token: newToken });
      } else {
        res.status(403).json({ token: newToken });
      }
    } catch (error) {
      const err = error as Error;
      if (
        err.message === "Invalid refresh token" ||
        err.message === "Refresh token expired"
      ) {
        res.status(401).json({ error: err.message });
      } else if (err instanceof z.ZodError) {
        console.error("Validation failed:", err.errors);
      } else {
        res.status(500).json({ error: "Internal server error.", err });
      }
    }
  }
  async verifyAccount(req: Request, res: Response): Promise<void> {
    try {
      // console.log('verificaion controller')
      // console.log(req.body)
      const validatedBody = VerifyAccountSchema.parse(req.body);
      const result = await this.authService.verifyAccount(
        validatedBody.token as string
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const validatedBody = forgotPasswordSchema.parse(req.body);
      const success = await this.authService.forgotPassword(validatedBody);
      res.status(201).json(success);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  async verifyForgotPassword(req: Request, res: Response): Promise<void> {
    try {
      console.log("verify forgot  password is working");
      const validatedBody = VerifyAccountSchema.parse(req.body);
      const result = await this.authService.verifyForgotPassword(
        validatedBody.token as string
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async googleAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedBody = googleAuthSchema.parse(req.body);
      const result = await this.authService.googleAuth(validatedBody);

      if (result.status === true) {
        res.cookie("accessToken", result.tokens.accessToken, {
          httpOnly: true,
          secure: config.NODE_ENV !== "development",
          sameSite: "none",
          maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", result.tokens.refreshToken, {
          httpOnly: true,
          secure: config.NODE_ENV !== "development",
          sameSite: "none",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json(result);
      }
      console.log(result);
    } catch (error) {
      const err = error as Error;
      if (err instanceof z.ZodError) {
        console.error("Validation failed:", err.errors);
        next(new ValidationError("validation failed"));
      } else if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("internal Server Error", 500));
      }
    }
  }

  async currentUser(req: Request, res: Response): Promise<void> {
    try {
      console.log("current user controller is working");
      const id=req.params.id
      const result =await this.authService.currectUser(id)
      res.status(200).json(result)
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  async addAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {email,address}=req.body
      const result= await this.authService.addAddress(email, address)
      res.status(200).json(result)
    } catch (error:any) {
      res.status(400).json({ message: error.message });
    }
  }
  async getAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log("getAddress controller is working");
      const id=req.params.id
      const result =await this.authService.getAddress(id)
      res.status(200).json(result)
    } catch (error:any) {
      res.status(400).json({ message: error.message });
    }
  }
  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
    const{userId,addressId}=req.body
    const result=await this.authService.deleteAddress(userId,addressId)
    res.status(200).json(result)
    } catch (error:any) {
      res.status(400).json({ message: error.message });
    }
  }
  async updateAddress(req: Request, res: Response, next: NextFunction):Promise<void> {
    try {
      const {email,address,addressId}=req.body
      console.log('updateaddress is working ',email,address,addressId)
     
      const result= await this.authService.updateAddress(email,addressId,address)
      res.status(200).json(result)
    } catch (error:any) {
      res.status(400).json({ message: error.message });
    }
  }
  async updateName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('update name is working')
      const {userId,name}=req.body
      const result=await this.authService.updateName(userId,name)
      res.status(200).json(result)
    } catch (error:any) {
      res.status(400).json({ message: error.message });
    }
  }
  async updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log("update password is working")
    const {email,passwords:{oldpassword,newpassword}}=req.body
    const result=await this.authService.updatePassword(email,oldpassword,newpassword)
    res.status(200).json(result)  
    } catch (error:any) {
      res.status(400).json({ message: error.message });
    }
  }
  async generatePresignedUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('generate presigned url controller is working')
      const {fileName,fileType}=req.query
      
  if (!fileName || !fileType) {
     res.status(400).json({ error: "Missing fileName or fileType" });
  }
      console.log(fileName,'generate presigned url controller is working',fileType)
      const url=await this.authService.generatePresignedUrl(fileName as string,fileType  as string)
      console.log("generatepresigned url is controller is working")
      res.status(200).json({url})
      
    } catch (error:any) {
      res.status(400).json({ message: error.message }); 
    }
  }
  async setImageUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const{imageUrl,id}=req.body
      console.log('set image url controller is working ' ,imageUrl)
      const result=await this.authService.setImageUrl(imageUrl,id)
      res.status(200).json(result)
    } catch (error:any) {
      res.status(400).json({ message: error.message }); 
    }
  }
  async deleteImageUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const{imageUrl}=req.body
      console.log('delete image url controller is working ' ,imageUrl)
      const result=await this.authService.deleteImageUrl(imageUrl)
      res.status(200).json(result)
      
    } catch (error:any) {
      res.status(400).json({ message: error.message });
    }
  }
}

export default AuthController;
