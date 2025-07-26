import { Request, Response, NextFunction } from "express";
import { IAdminController } from "../interfaces/IAdminController";
import { inject, injectable } from "tsyringe";
import { IAdminService } from "../../services/interfaces/IAdminService";
import { GetuserResponseDTO } from "../../dto/ResponseDTO/getUserResponse.dto";
import { BlockUserRequestDTO } from "../../dto/RequestDTO/blockUserRequest.dto";

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
     
      const mappedUsers:GetuserResponseDTO[]=users.users.map((user:any)=>({
        _id:user._id.toString(),
        name:user.name,
        email:user.email,
        createdAt:user.createdAt.toISOString(),
        status:user.status,
        is_block:user.is_block
      }))
      res.status(200).json({users:{ users:mappedUsers,totalPages:users.totalPages}});
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
      const result=BlockUserRequestDTO.safeParse(req.body)
      if (!result.success) {
         res.status(400).json({ error: result.error.errors });
         return
      }

      const {email,is_block}=result.data
      const response = await this._adminService.blockUser(
       email,
       is_block
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
      console.log('total user count',totalUserCount)
      res.status(200).json( totalUserCount )
    } catch (error) {
      console.log(error);
    }
  }
}

export default AdminController;
