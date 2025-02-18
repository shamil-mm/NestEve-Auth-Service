import { IUser } from "../../model/interfaces/userInterface";
export interface IUserRepository {
    create(user:Partial<IUser>):Promise<IUser>;
    findByEmail(email:string):Promise<IUser | null>;
    findById(id:string):Promise<IUser | null>;
    delete(id:string):Promise<void>;
}