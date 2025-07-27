import { Document, Types } from "mongoose";

export interface IUser  {
  name: string;
  email: string;
  password: string;
  avatarUrl?:string|null;
  role?: "user" | "admin" | "organizer";
  status?: "active" | "suspended" | "deleted";
  organizationName?: string | null;
  is_block: boolean;
  location?:{
    type:"Point";
    coordinates:[number,number]
  }
}

export interface IUserDocument extends IUser,Document {
_id:Types.ObjectId
}
