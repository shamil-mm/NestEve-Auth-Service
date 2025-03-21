import mongoose, { FilterQuery } from "mongoose";
import User from "../../model/implementaions/User";
import { IUser } from "../../model/interfaces/userInterface";
import { IUserRepository } from "../interfaces/IUserRepository";

class AuthRepository implements IUserRepository {
  async create(user: Partial<IUser>): Promise<IUser> {
    const newUser = new User(user);
    return await newUser.save();
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
  async addAddress(email:string,address:object){
    return await User.findOneAndUpdate(
      {email},
      {$push:{address}},
      {new:true}
    )
  }
  async updateAddress(email: string, addressId: string, updatedAddress: object): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      {email,"address._id":new mongoose.Types.ObjectId(addressId)},
      {$set:{"address.$":updatedAddress}},
      {new:true}
    )
  }
  async getAddresses(id: string): Promise<object[]> {
    const user= await User.findById(id,{address:1}).lean()
    return Array.isArray(user?.address) ? user.address : []
    
  }
  async deleteAddress(userId:string,addressId: string): Promise<void> {
    await User.findOneAndUpdate(
      {_id:userId},
      {$pull:{address:{_id:addressId}}},
      {new:true}
    ) 
  }
  async updateName(userId: string, name: string): Promise<void> {
    await User.findByIdAndUpdate(
      {_id:userId},
      {name}
    )
  }
}

export default AuthRepository;
