import User from "../../model/implementaions/User";
import { IUser } from "../../model/interfaces/userInterface";
import { IAdminRepository } from "../interfaces/IAdminRepository";

class AdminRepository implements IAdminRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }
  async findAll(): Promise<IUser[]> {
    return await User.find({});
  }
  async update(email: string, item: Partial<IUser>) {
    return await User.findOneAndUpdate({ email }, item, { new: true });
  }
  async findAllUserCount(): Promise<number> {
    return await User.find({}).countDocuments();
  }
}

export default AdminRepository;
