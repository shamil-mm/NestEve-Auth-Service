import { Router } from "express";
import { IAdminRoutes } from "../interfaces/IAuthRoutes";
import { inject, injectable } from "tsyringe";
import { IAdminController } from "../../controller/interfaces/IAdminController";

@injectable()
class AdminRoutes implements IAdminRoutes {
  public path = "/api";
  public router = Router();
  constructor(
    @inject("AdminController") private _adminController: IAdminController
  ) {
    this._initializeRoutes();
  }
  private _initializeRoutes() {
    this.router.get(
      `${this.path}/admin-get-users`,
      this._adminController.getUser.bind(this._adminController)
    );
    this.router.get(
      `${this.path}/admin-get-organizers`,
      this._adminController.getOrganizers.bind(this._adminController)
    );
    this.router.post(
      `${this.path}/admin-block-user`,
      this._adminController.blockUser.bind(this._adminController)
    );
    this.router.get(
      `${this.path}/admin-dashboard-stats`,
      this._adminController.getAdminDashboardStats.bind(this._adminController)
    )
    
  }
}

export default AdminRoutes;
