import { IUser } from "../../model/interfaces/userInterface";
import { IUserQueryParams } from "../../controller/implementaions/adminController";

export interface IAdminService {
  getUsers(data:IUserQueryParams): Promise<{users:IUser[],totalPages:number}>;
  getOrganizers(data:IUserQueryParams): Promise<{organizers:IUser[],totalPages:number}>;
  blockUser(email: string, is_block: boolean): Promise<any>;
  getAdminDashboardStats():Promise<{totalUsers:number}>
}
