import { IUser } from "../../model/interfaces/userInterface";
import { IAdminService } from "../interfaces/IAdminService";
import { inject, injectable } from "tsyringe";
import { IAdminRepository } from "../../repositories/interfaces/IAdminRepository";
import { IUserQueryParams } from "../../controller/implementaions/adminController";

@injectable()
class AdminService implements IAdminService {
  constructor(
    @inject("AdminRepository") private _adminRepository: IAdminRepository
  ) {}

  async getUsers(data:IUserQueryParams): Promise<{users:IUser[],totalPages:number}> {

    const {
    search = '',
    sortField = 'name',
    sortDirection = 'asc',
    filterBy = '',
    page = 1,
    limit = 10,
  } = data;
    const allUser = await this._adminRepository.findAll();
    let filteredUsers=allUser.filter((user) => user.role == "user");
    if (search) {
    filteredUsers = filteredUsers.filter(user =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );
  }
   if (filterBy) {
    filteredUsers = filteredUsers.filter(user => user.status === filterBy);
  }
  if (sortField) {
    filteredUsers.sort((a, b) => {
      const fieldA = (a as any)[sortField];
      const fieldB = (b as any)[sortField];

      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / Number(limit));
  const start = (Number(page) - 1) * Number(limit);
  const paginatedUsers = filteredUsers.slice(start, start + Number(limit));

  return {
    users: paginatedUsers,
    totalPages,
  };
  }
  async getOrganizers(data:IUserQueryParams): Promise<{organizers:IUser[],totalPages:number}> {
    const {
    search = '',
    sortField = 'name',
    sortDirection = 'asc',
    filterBy = '',
    page = 1,
    limit = 10,
  } = data;
    const allUser = await this._adminRepository.findAll();
    let organizers=allUser.filter((user) => user.role == "organizer");

    if (search) {
    const lowered = search.toLowerCase();
    organizers = organizers.filter(user =>
      user.name.toLowerCase().includes(lowered) ||
      user.email.toLowerCase().includes(lowered)
    );
  }
   if (filterBy) {
    organizers = organizers.filter(user => user.status === filterBy);
  }
  if (sortField) {
    organizers.sort((a, b) => {
      const aField = (a as any)[sortField];
      const bField = (b as any)[sortField];

      if (aField < bField) return sortDirection === 'asc' ? -1 : 1;
      if (aField > bField) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

    const totalOrganizers = organizers.length;
  const totalPages = Math.ceil(totalOrganizers / Number(limit));
  const startIndex = (page as number - 1) * Number(limit);
  const paginatedOrganizers = organizers.slice(startIndex, startIndex + Number(limit));

  
  return {
    organizers: paginatedOrganizers,
    totalPages,
  };
  }
  async blockUser(email: string, is_block: boolean): Promise<any> {
    const checkUser = await this._adminRepository.findByEmail(email);
    if (!checkUser) throw new Error("user not found");
    is_block = is_block === true ? false : true;
    const updatedUser = await this._adminRepository.update(email, { is_block });
    return { updatedUser };
  }
  async getAdminDashboardStats(): Promise<{totalUsers:number}> {
   
    const usersCount=await this._adminRepository.findAllUserCount()
    return {totalUsers:usersCount}
    
  }
}

export default AdminService;
