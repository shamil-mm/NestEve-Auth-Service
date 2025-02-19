
import {Document} from "mongoose";

export interface IUser extends Document{
    name: string;
    email: string;
    password: string;
    avatarUrl ?: string;
    is_verified?:boolean;
    role ?:'user' | 'admin' |'organizer';
    status?:'active' | 'suspended' | 'deleted';
}