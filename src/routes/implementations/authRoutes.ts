import { Router } from "express";
import { inject, injectable } from "tsyringe";
import upload from "../../utils/multerConfig";
import { IAuthController } from "../../controller/interfaces/IAuthController";
import { IAuthRoutes } from "../interfaces/IAuthRoutes";
import AuthMiddleware from "../../middlewares/authMiddleware";


@injectable()
class AuthRoutes implements IAuthRoutes {
  public path = "/api";
  public router = Router();


  constructor(
    @inject("AuthController") private _authController: IAuthController,
    @inject("AuthMiddleware") private authMiddleware: AuthMiddleware
  ) {
    this._initializeRoutes();
  }

  private _initializeRoutes() {
    this.router.post(
      `${this.path}/register`,
      this._authController.register.bind(this._authController)
    );
    this.router.post(
      `${this.path}/login`,
      this._authController.login.bind(this._authController)
    );
    this.router.post(
      `${this.path}/admin-login`,
      this._authController.adminLogin.bind(this._authController)
    );
    this.router.post(
      `${this.path}/logout`,
      this._authController.logout.bind(this._authController)
    );
    this.router.post(
      `${this.path}/admin-logout`,
      this._authController.adminLogout.bind(this._authController)
    );
    this.router.post(
      `${this.path}/refresh-token`,
      this._authController.refreshToken.bind(this._authController)
    );
    this.router.post(
      `${this.path}/verify-email`,
      this._authController.verifyAccount.bind(this._authController)
    );
    this.router.post(
      `${this.path}/forgot-password`,
      this._authController.forgotPassword.bind(this._authController)
    );
    this.router.post(
      `${this.path}/google-auth`,
      this._authController.googleAuth.bind(this._authController)
    );
    this.router.post(
      `${this.path}/verify-forgot-password`,
      this._authController.verifyForgotPassword.bind(this._authController)
    );
    this.router.get(
      `${this.path}/currect-user/:id`,
      this._authController.currentUser.bind(this._authController)
    )
    this.router.post(
      `${this.path}/update-name`,
      this._authController.updateName.bind(this._authController)
    )
    this.router.post(
      `${this.path}/update-password`,
      this._authController.updatePassword.bind(this._authController)
    )
    this.router.get(
      `${this.path}/generate-presigned-url`,
      this._authController.generatePresignedUrl.bind(this._authController)
    )
    this.router.post(
      `${this.path}/save-image-url`,
      this._authController.setImageUrl.bind(this._authController)
    )
    this.router.post(
      `${this.path}/delete-image-url`,
      this._authController.deleteImageUrl.bind(this._authController)
    )
    this.router.post(
      `${this.path}/upload-image-to-server`,
      upload.single("image"),
      this._authController.uploadImageToServer.bind(this._authController)
    );
    this.router.get(
      `${this.path}/get-profileImage`,
      this._authController.getProfileImage.bind(this._authController)
    );
    this.router.post(
      `${this.path}/delete-profileImage`,
      this._authController.deleteProfileImage.bind(this._authController)
    );
    this.router.post(
      `${this.path}/location`,
      this._authController.saveLocation.bind(this._authController)
    );
  }
}


export default AuthRoutes;
