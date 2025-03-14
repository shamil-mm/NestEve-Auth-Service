import { Router } from "express";
import { inject, injectable } from "tsyringe";
import { IAuthController } from "../../controller/interfaces/IAuthController";
import { IAuthRoutes } from "../interfaces/IAuthRoutes";
import AuthMiddleware from "../../middlewares/authMiddleware";

@injectable()
class AuthRoutes implements IAuthRoutes {
  public path = "/api";
  public router = Router();

  constructor(
    @inject("AuthController") private authController: IAuthController,
    @inject("AuthMiddleware") private authMiddleware: AuthMiddleware
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/register`,
      this.authController.register.bind(this.authController)
    );
    this.router.post(
      `${this.path}/login`,
      this.authController.login.bind(this.authController)
    );
    this.router.post(
      `${this.path}/admin-login`,
      this.authController.adminLogin.bind(this.authController)
    );
    this.router.post(
      `${this.path}/logout`,
      this.authController.logout.bind(this.authController)
    );
    this.router.post(
      `${this.path}/admin-logout`,
      this.authController.adminLogout.bind(this.authController)
    );
    this.router.post(
      `${this.path}/refresh-token`,
      this.authController.refreshToken.bind(this.authController)
    );
    this.router.post(
      `${this.path}/verify-email`,
      this.authController.verifyAccount.bind(this.authController)
    );
    this.router.post(
      `${this.path}/forgot-password`,
      this.authController.forgotPassword.bind(this.authController)
    );
    this.router.post(
      `${this.path}/google-auth`,
      this.authController.googleAuth.bind(this.authController)
    );
    this.router.post(
      `${this.path}/verify-forgot-password`,
      this.authController.verifyForgotPassword.bind(this.authController)
    );
  }
}

export default AuthRoutes;
