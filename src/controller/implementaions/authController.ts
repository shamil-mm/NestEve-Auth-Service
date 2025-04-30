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
import { StatusCodes } from "../../constants/statusCode";

@injectable()
class AuthController implements IAuthController {
  constructor(@inject("AuthService") private _authService: IAuthService) {}

  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedBody = RegisterUserSchema.parse(req.body);
      const result = await this._authService.registerUser(
        validatedBody.name,
        validatedBody.email,
        validatedBody.password,
        validatedBody.role,
        validatedBody.organizationName
      );

      res
        .status(StatusCodes.CREATED)
        .json({ status: true, message: result.message, data: result.data });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation failed:", error.errors);
        next(new ValidationError("validation failed"));
      } else if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("internal Server Error", StatusCodes.INTERNAL_SERVER_ERROR));
      }
    }
  }
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedBody = LoginUserSchema.parse(req.body);
      const result = await this._authService.loginUser(
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
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      const err = error as Error;
      if (err instanceof z.ZodError) {
        console.error("Validation failed:", err.errors);
        next(new ValidationError("validation failed"));
      } else if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("internal Server Error", StatusCodes.INTERNAL_SERVER_ERROR));
      }
    }
  }
  async adminLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedBody = LoginUserSchema.parse(req.body);
      const result = await this._authService.loginUser(
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
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      const err = error as Error;
      if (err instanceof z.ZodError) {
        console.error("Validation failed:", err.errors);
        next(new ValidationError("validation failed"));
      } else if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("internal Server Error", StatusCodes.INTERNAL_SERVER_ERROR));
      }
    }
  }
  async logout(req: Request, res: Response): Promise<void> {
    try {
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
      res.status(StatusCodes.OK).json({ success: "User Logout Success" });
    } catch (error) {
      const err = error as Error;
      res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
    }
  }
  async adminLogout(req: Request, res: Response): Promise<void> {
    try {
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
      res.status(StatusCodes.OK).json({ success: "User Logout Success" });
    } catch (error) {
      const err = error as Error;
      res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
    }
  }
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const validatedBody = RefreshTokenSchema.parse(req.body);
      const newToken = await this._authService.refreshAccessToken(
        validatedBody.refreshToken
      );
      if (newToken) {
        res.status(StatusCodes.OK).json({ token: newToken });
      } else {
        res.status(StatusCodes.FORBIDDEN).json({ token: newToken });
      }
    } catch (error) {
      const err = error as Error;
      if (
        err.message === "Invalid refresh token" ||
        err.message === "Refresh token expired"
      ) {
        res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
      } else if (err instanceof z.ZodError) {
        console.error("Validation failed:", err.errors);
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error.", err });
      }
    }
  }
  async verifyAccount(req: Request, res: Response): Promise<void> {
    try {
      const validatedBody = VerifyAccountSchema.parse(req.body);
      const result = await this._authService.verifyAccount(
        validatedBody.token as string
      );
      res.status(StatusCodes.CREATED).json(result);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const validatedBody = forgotPasswordSchema.parse(req.body);
      const success = await this._authService.forgotPassword(validatedBody);
      res.status(StatusCodes.CREATED).json(success);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async verifyForgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const validatedBody = VerifyAccountSchema.parse(req.body);
      const result = await this._authService.verifyForgotPassword(
        validatedBody.token as string
      );
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }

  async googleAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedBody = googleAuthSchema.parse(req.body);
      const result = await this._authService.googleAuth(validatedBody);

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
        res.status(StatusCodes.OK).json(result);
      }
    } catch (error) {
      const err = error as Error;
      if (err instanceof z.ZodError) {
        console.error("Validation failed:", err.errors);
        next(new ValidationError("validation failed"));
      } else if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("internal Server Error", StatusCodes.INTERNAL_SERVER_ERROR));
      }
    }
  }

  async currentUser(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const result = await this._authService.currectUser(id);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async addAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, address } = req.body;
      const result = await this._authService.addAddress(email, address);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async getAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;
      const result = await this._authService.getAddress(id);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async deleteAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, addressId } = req.body;
      const result = await this._authService.deleteAddress(userId, addressId);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async updateAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, address, addressId } = req.body;

      const result = await this._authService.updateAddress(
        email,
        addressId,
        address
      );
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async updateName(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, name } = req.body;
      const result = await this._authService.updateName(userId, name);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async updatePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        email,
        passwords: { oldpassword, newpassword },
      } = req.body;
      const result = await this._authService.updatePassword(
        email,
        oldpassword,
        newpassword
      );
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async generatePresignedUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fileName, fileType } = req.query;

      if (!fileName || !fileType) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing fileName or fileType" });
        return
      }

      const url = await this._authService.generatePresignedUrl(
        fileName as string,
        fileType as string
      );

      res.status(StatusCodes.OK).json({ url });
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async setImageUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { params, id } = req.body;

      const result = await this._authService.setImageUrl(params, id);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async deleteImageUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { imageUrl } = req.body;

      const result = await this._authService.deleteImageUrl(imageUrl);
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async uploadImageToServer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError("No file uploaded", StatusCodes.UNAUTHORIZED);
      }
      const { userId, oldImageUrl } = req.body;

      const response = await this._authService.uploadImageToServer(
        req.file,
        userId,
        oldImageUrl
      );
      res.status(StatusCodes.OK).json(response);
    } catch (error: any) {
      console.log(error);
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async getProfileImage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
     
      const { avatarUrl } = req.query;
      if (avatarUrl) {
        const response = await this._authService.getProfileImage(
          avatarUrl as string
        );
      
        res.status(StatusCodes.OK).json(response);
      }
      res.status(StatusCodes.OK).json({message:'profile not added'})
    } catch (error: any) {
      console.log(error);
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
  async deleteProfileImage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id, avatarUrl } = req.body;
      const response = await this._authService.deleteProfileImage(id, avatarUrl);
      res.status(StatusCodes.OK).json(response);
    } catch (error: any) {
      console.log(error);
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
}

export default AuthController;
