import { IUser, IUserDocument } from "../../model/interfaces/userInterface";
export interface IUserRepository  {
  create(user: Partial<IUser>): Promise<IUserDocument>;
  findByEmail(email: string): Promise<IUserDocument | null>;
  update(email: string, item: Partial<IUser>): Promise<IUser | null>;
  updateById(id: string, item: Partial<IUser>): Promise<IUser | null>;
  findById(id: string): Promise<IUser | null>;
  delete(id: string): Promise<void>;
  updateName(userId:string,name:string):Promise<void>
  getUserLocation(userId:string):Promise<{lat?:number,lng?:number}>;
}
