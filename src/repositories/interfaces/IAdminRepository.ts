import { IUser } from "../../model/interfaces/userInterface";
export interface IAdminRepository {
  findByEmail(email: string): Promise<IUser | null>;
  findAll(): Promise<IUser[]>;
  update(email: string, item: Partial<IUser>): Promise<IUser | null>;
}
