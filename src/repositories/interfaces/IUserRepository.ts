import { IUser } from "../../model/interfaces/userInterface";
export interface IUserRepository {
  create(user: Partial<IUser>): Promise<IUser>;
  findByEmail(email: string): Promise<IUser | null>;
  update(email: string, item: Partial<IUser>): Promise<IUser | null>;
  updateById(id: string, item: Partial<IUser>): Promise<IUser | null>;
  findById(id: string): Promise<IUser | null>;
  delete(id: string): Promise<void>;
  addAddress(email:string,address:object):Promise<IUser|null>
  updateAddress(email: string, addressId: string, updatedAddress: object):Promise<IUser|null>
  getAddresses(id:string):Promise<any[]>
  deleteAddress(userId:string,addressId:string):Promise<void>
  updateName(userId:string,name:string):Promise<void>
}
