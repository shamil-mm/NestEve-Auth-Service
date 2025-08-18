import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IAuthService } from "../../services/interfaces/IAuthService";
import { IAuthController } from "../interfaces/IAuthController";
import { z, ZodError } from "zod";
import { AppError,unauthorizedError,ValidationError} from "../../error/AppError";

import { StatusCodes } from "../../constants/statusCode";
import { RegisterUserDTO } from "../../dto/RequestDTO/registerUser.dto";
import { LoginRequestDTO } from "../../dto/RequestDTO/loginRequest.dto";
import { RefreshTokenRequestDTO } from "../../dto/RequestDTO/refreshTokenRequest.dto";
import { VerifyAccountRequestDTO } from "../../dto/RequestDTO/verifyAccountRequest.dto";
import { ForgotPasswordRequestDTO } from "../../dto/RequestDTO/forgotPasswordRequest.dto";
import { VerifyForgotPasswordRequestDTO } from "../../dto/RequestDTO/verifyForgotPasswordRequest.dto";
import { GoogleAuthRequestDTO } from "../../dto/RequestDTO/googleAuthRequest.dto";
import { Types } from "mongoose";
import { Messages } from "../../constants/messages";
import { UpdateNameDTO } from "../../dto/RequestDTO/updateNameRequest.dto";
import { UpdatePasswordDTO } from "../../dto/RequestDTO/updatePasswordRequest.dto";
import { validateObjectId } from "../../utils/controller helper functions/validateObjectId";
import { ACCESS_TOKEN_COOKIE_OPTIONS, CLEAR_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS,} from "../../constants/cookieOptions";

@injectable()
class AuthController implements IAuthController {
  constructor(@inject("AuthService") private _authService: IAuthService) {}

  private _handleError(error: unknown, next: NextFunction): void {
    if (error instanceof ZodError) {
      const message = error.errors.map((e) => e.message).join(", ");
      return next(new ValidationError(message));
    }
    if (error instanceof AppError) {
      return next(error);
    }
    return next(
      new AppError(Messages.INTERNAL_ERROR, StatusCodes.INTERNAL_SERVER_ERROR)
    );
  }

  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = RegisterUserDTO.parse(req.body);
      const result = await this._authService.registerUser(data);
      res
        .status(StatusCodes.CREATED)
        .json({ status: true, message: result.message, data: result.data });
    } catch (error) {
      this._handleError(error, next);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = LoginRequestDTO.parse(req.body);

      const result = await this._authService.loginUser(data);

      res.cookie(
        "accessToken",
        result.tokens.accessToken,
        ACCESS_TOKEN_COOKIE_OPTIONS
      );
      res.cookie(
        "refreshToken",
        result.tokens.refreshToken,
        REFRESH_TOKEN_COOKIE_OPTIONS
      );
      console.log("login response data", result);

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      this._handleError(error, next);
    }
  }

  async adminLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = LoginRequestDTO.parse(req.body);
      const result = await this._authService.loginUser(data);

      res.cookie(
        "admin_accessToken",
        result.tokens.accessToken,
        ACCESS_TOKEN_COOKIE_OPTIONS
      );
      res.cookie(
        "admin_refreshToken",
        result.tokens.refreshToken,
        REFRESH_TOKEN_COOKIE_OPTIONS
      );

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      this._handleError(error, next);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie("accessToken", CLEAR_TOKEN_COOKIE_OPTIONS);
      res.clearCookie("refreshToken", CLEAR_TOKEN_COOKIE_OPTIONS);
      res.status(StatusCodes.OK).json({ success: Messages.LOGOUT_SUCCESS });
    } catch (error) {
      this._handleError(error, next);
    }
  }

  async adminLogout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      res.clearCookie("admin_accessToken", CLEAR_TOKEN_COOKIE_OPTIONS);
      res.clearCookie("admin_refreshToken", CLEAR_TOKEN_COOKIE_OPTIONS);
      res.status(StatusCodes.OK).json({ success: Messages.LOGOUT_SUCCESS });
    } catch (error) {
      this._handleError(error, next);
    }
  }

  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken } = RefreshTokenRequestDTO.parse(req.body);

      const newToken = await this._authService.refreshAccessToken(refreshToken);
      if (!newToken) {
        throw new unauthorizedError(Messages.TOKEN_FAILURE);
      }

      if (newToken) {
        res.status(StatusCodes.OK).json({ token: newToken });
      } else {
        res.status(StatusCodes.FORBIDDEN).json({ token: newToken });
      }
    } catch (error) {
      this._handleError(error, next);
    }
  }

  async verifyAccount(req: Request, res: Response): Promise<void> {
    try {
      const { token } = VerifyAccountRequestDTO.parse(req.body);
      const result = await this._authService.verifyAccount(token as string);

      res.status(StatusCodes.CREATED).json(result);
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const validatedBody = ForgotPasswordRequestDTO.parse(req.body);
      const success = await this._authService.forgotPassword(validatedBody);
      res.status(StatusCodes.CREATED).json(success);
    } catch (error) {
      const err = error as Error;
      res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
    }
  }
  async verifyForgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const validatedBody = VerifyForgotPasswordRequestDTO.parse(req.body);
      const result = await this._authService.verifyForgotPassword(
        validatedBody.token as string
      );
      res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      const err = error as Error;
      res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
    }
  }

  async googleAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedBody = GoogleAuthRequestDTO.parse(req.body);
      const result = await this._authService.googleAuth(validatedBody);

      if (result.status === true) {
        res.cookie(
          "accessToken",
          result.tokens.accessToken,
          ACCESS_TOKEN_COOKIE_OPTIONS
        );

        res.cookie(
          "refreshToken",
          result.tokens.refreshToken,
          REFRESH_TOKEN_COOKIE_OPTIONS
        );
        res.status(StatusCodes.OK).json(result);
      }
    } catch (error) {
      this._handleError(error, next);
    }
  }

  async currentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;
      if (!Types.ObjectId.isValid(id)) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: Messages.INVALID_ID });
      }

      const result = await this._authService.currectUser(id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      this._handleError(error, next);
    }
  }

  async updateName(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedBody = UpdateNameDTO.parse(req.body);
      const { userId, name } = validatedBody;
      const result = await this._authService.updateName(userId, name);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      this._handleError(error, next);
    }
  }

  async updatePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedBody = UpdatePasswordDTO.parse(req.body);
      const {
        email,
        passwords: { oldpassword, newpassword },
      } = validatedBody;
      const result = await this._authService.updatePassword(
        email,
        oldpassword,
        newpassword
      );
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      this._handleError(error, next);
    }
  }

  async generatePresignedUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fileName, fileType } = req.query;

      if (!fileName || !fileType)
        throw new AppError(Messages.FILE_MISSING, StatusCodes.BAD_REQUEST);

      const url = await this._authService.generatePresignedUrl(
        fileName as string,
        fileType as string
      );

      res.status(StatusCodes.OK).json({ url });
    } catch (error) {
      this._handleError(error, next);
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
    } catch (error) {
      this._handleError(error, next);
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
    } catch (error) {
      this._handleError(error, next);
    }
  }
  async uploadImageToServer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError(
          Messages.FILE_UPLOAD_FAILED,
          StatusCodes.UNAUTHORIZED
        );
      }
      const { userId, oldImageUrl } = req.body;
      validateObjectId(userId);

      const response = await this._authService.uploadImageToServer(
        req.file,
        userId,
        oldImageUrl
      );
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      this._handleError(error, next);
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
      }else{
        res.status(StatusCodes.OK).json({ message: Messages.FILE_UPLOAD_FAILED });
      }
    } catch (error) {
      console.log(error)
      this._handleError(error, next);
    }
  }
  async deleteProfileImage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id, avatarUrl } = req.body;
      validateObjectId(id)
     
      const response = await this._authService.deleteProfileImage(
        id,
        avatarUrl
      );
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      this._handleError(error, next);
    }
  }

  async saveLocation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        location: { lat, lng },
        userId,
      } = req.body;
     validateObjectId(userId)
      const response = await this._authService.saveLocation(lat, lng, userId);
      res.status(StatusCodes.OK).json(Messages.LOCATION_UPLOADED);
    } catch (error) {
      this._handleError(error, next);
    }
  }
  async getUserLocation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      validateObjectId(userId)
      const response = await this._authService.getUserLocation(userId);
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      this._handleError(error, next);
    }
  }
  async checkUserBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('check user block constoller is working')
      const { email } = req.params;

      console.log('params',req.params.email)
      console.log('query',req.query.email)
      const response = await this._authService.checkUserBlock(email);
      console.log('check user block response',response)
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      this._handleError(error, next);
    }
  }
}

export default AuthController;
