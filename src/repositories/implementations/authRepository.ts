import User from "../../model/implementaions/User";
import { IUser } from "../../model/interfaces/userInterface";
import { IUserRepository } from "../interfaces/IUserRepository"

class AuthRepository implements IUserRepository  {
    async create(user:Partial<IUser>): Promise<IUser> {
        const newUser = new User(user);
        return await newUser.save();
      }
    
      async findByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({ email });
      }
    
      async findById(id: string): Promise<IUser | null> {
        return await User.findById(id);
      }
    
      async delete(id: string): Promise<void> {
        await User.findByIdAndDelete(id);
      }
}

export default AuthRepository