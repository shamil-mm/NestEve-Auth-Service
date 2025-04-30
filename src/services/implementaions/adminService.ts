import { IUser } from "../../model/interfaces/userInterface";
import { IAdminService } from "../interfaces/IAdminService";
import { inject, injectable } from "tsyringe";
import { IAdminRepository } from "../../repositories/interfaces/IAdminRepository";

@injectable()
class AdminService implements IAdminService {
  constructor(
    @inject("AdminRepository") private _adminRepository: IAdminRepository
  ) {}

  async getUsers(): Promise<IUser[]> {
    console.log("admin service is working");
    const allUser = await this._adminRepository.findAll();
    return allUser.filter((user) => user.role == "user");
  }
  async getOrganizers(): Promise<IUser[]> {
    console.log("admin service is working");
    const allUser = await this._adminRepository.findAll();
    return allUser.filter((user) => user.role == "organizer");
  }
  async blockUser(email: string, is_block: boolean): Promise<any> {
    const checkUser = await this._adminRepository.findByEmail(email);
    if (!checkUser) throw new Error("user not found");
    is_block = is_block === true ? false : true;
    const updatedUser = await this._adminRepository.update(email, { is_block });
    return { updatedUser };
  }
}

export default AdminService;
