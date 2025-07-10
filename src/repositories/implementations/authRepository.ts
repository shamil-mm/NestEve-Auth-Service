import mongoose, { FilterQuery } from "mongoose";
import User from "../../model/implementaions/User";
import { IUser } from "../../model/interfaces/userInterface";
import { IUserRepository } from "../interfaces/IUserRepository";

class AuthRepository implements IUserRepository {
  async create(user: Partial<IUser>): Promise<IUser> {
    try {
      const newUser = new User(user);
      const res= await newUser.save();
      console.log(res)
      return res
      
    } catch (error) {
       console.error("Error saving user:", error);
       throw error;
    }
    
  }
  async update(email: string, item: Partial<IUser>) {
    return await User.findOneAndUpdate({ email }, item, { new: true });
  }
  async updateById(id: string, item: Partial<IUser>) {
    return await User.findByIdAndUpdate ({ _id:id }, item, { new: true });
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
  async updateName(userId: string, name: string): Promise<void> {
    await User.findByIdAndUpdate(
      {_id:userId},
      {name}
    )
  }
}

export default AuthRepository;
