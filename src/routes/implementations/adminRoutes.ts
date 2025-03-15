import { Router } from "express";
import { IAdminRoutes } from "../interfaces/IAuthRoutes";
import { inject, injectable } from "tsyringe";
import { IAdminController } from "../../controller/interfaces/IAdminController";

@injectable()
class AdminRoutes implements IAdminRoutes {
  public path = "/api";
  public router = Router();
  constructor(
    @inject("AdminController") private adminController: IAdminController
  ) {
    this.initializeRoutes();
  }
  private initializeRoutes() {
    this.router.get(
      `${this.path}/admin-get-users`,
      this.adminController.getUser.bind(this.adminController)
    );
    this.router.get(
      `${this.path}/admin-get-organizers`,
      this.adminController.getOrganizers.bind(this.adminController)
    );
    this.router.post(
      `${this.path}/admin-block-user`,
      this.adminController.blockUser.bind(this.adminController)
    );
  }
}

export default AdminRoutes;
