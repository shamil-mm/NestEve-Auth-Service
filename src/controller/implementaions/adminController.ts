import { Request, Response, NextFunction } from "express";
import { IAdminController } from "../interfaces/IAdminController";
import { inject, injectable } from "tsyringe";
import { IAdminService } from "../../services/interfaces/IAdminService";
import { blockUserSchema } from "../../validator/userValidator";


export interface IUserQueryParams {
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  filterBy?: string;
  page?: string|number;
  limit?: string | number;
}

@injectable()
class AdminController implements IAdminController {
  constructor(@inject("AdminService") private _adminService: IAdminService) {}
  async getUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
      search = '',
      sortField = 'createdAt',
      sortDirection = 'desc',
      filterBy = '',
      page = '1',
      limit = '10',
    } = req.query as IUserQueryParams

  
    const currentPage = parseInt(page as string, 10) || 1;
    const itemsPerPage = parseInt(limit as string, 10) || 10;


      const users = await this._adminService.getUsers({search,sortField ,sortDirection,filterBy,page:currentPage,limit:itemsPerPage} ) 
      res.status(200).json({ users });
    } catch (error) {
      console.log(error);
    }
  }
  async getOrganizers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {

       const {
      search = '',
      sortField = 'createdAt',
      sortDirection = 'desc',
      filterBy = '',
      page = '1',
      limit = '10',
    } = req.query as IUserQueryParams

    const currentPage = parseInt(page as string, 10) || 1;
    const itemsPerPage = parseInt(limit as string, 10) || 10;
    
      const organizers = await this._adminService.getOrganizers({search,sortField ,sortDirection,filterBy,page:currentPage,limit:itemsPerPage});
      res.status(200).json({ organizers });
    } catch (error) {
      console.log(error);
    }
  }

  async blockUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedbody = blockUserSchema.parse(req.body);
      const response = await this._adminService.blockUser(
        validatedbody.email,
        validatedbody.is_block
      );
      res.status(200).json({ status: true, response });
    } catch (error) {
      console.log(error);
    }
  }

  async getAdminDashboardStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const totalUserCount = await this._adminService.getAdminDashboardStats();
      res.status(200).json( totalUserCount );
    } catch (error) {
      console.log(error);
    }
  }
}

export default AdminController;
