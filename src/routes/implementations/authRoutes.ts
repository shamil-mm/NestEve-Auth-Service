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
    this.router.get(
      `${this.path}/currect-user/:id`,
      this.authController.currentUser.bind(this.authController)
    )
    this.router.post(
      `${this.path}/add-address`,
      this.authController.addAddress.bind(this.authController)
    )
    this.router.post(
      `${this.path}/update-address`,
      this.authController.updateAddress.bind(this.authController)
    )
    this.router.post(
      `${this.path}/update-name`,
      this.authController.updateName.bind(this.authController)
    )
    this.router.post(
      `${this.path}/update-password`,
      this.authController.updatePassword.bind(this.authController)
    )
    this.router.post(
      `${this.path}/delete-address`,
      this.authController.deleteAddress.bind(this.authController)
    )
    this.router.get(
      `${this.path}/user-address/:id`,
      this.authController.getAddress.bind(this.authController)
    )
    this.router.get(
      `${this.path}/generate-presigned-url`,
      this.authController.generatePresignedUrl.bind(this.authController)
    )
    this.router.post(
      `${this.path}/save-image-url`,
      this.authController.setImageUrl.bind(this.authController)
    )
    this.router.post(
      `${this.path}/delete-image-url`,
      this.authController.deleteImageUrl.bind(this.authController)
    )
  }
}


export default AuthRoutes;
