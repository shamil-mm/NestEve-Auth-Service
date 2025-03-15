import { Request, Response, NextFunction } from "express";
import { IAdminController } from "../interfaces/IAdminController";
import { inject, injectable } from "tsyringe";
import { IAdminService } from "../../services/interfaces/IAdminService";
import { blockUserSchema } from "../../validator/userValidator";

@injectable()
class AdminController implements IAdminController {
  constructor(@inject("AdminService") private adminService: IAdminService) {}
  async getUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const users = await this.adminService.getUsers();
    res.status(200).json({ users });
  }
  async getOrganizers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const organizers = await this.adminService.getOrganizers();
    res.status(200).json({ organizers });
  }

  async blockUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const validatedbody = blockUserSchema.parse(req.body);
    const response = await this.adminService.blockUser(
      validatedbody.email,
      validatedbody.is_block
    );
    res.status(200).json({ status: true, response });
  }
}

export default AdminController;
