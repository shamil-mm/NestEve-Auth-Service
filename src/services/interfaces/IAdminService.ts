import { IUser } from "../../model/interfaces/userInterface";

export interface IAdminService {
  getUsers(): Promise<IUser[]>;
  getOrganizers(): Promise<IUser[]>;
  blockUser(email: string, is_block: boolean): Promise<any>;
}
