import mongoose,{Schema} from "mongoose"
import { IUser } from "../interfaces/userInterface"

const UserSchema: Schema<IUser> = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatarUrl: {type:String,default:""},
    role:{type:String,enum:["user","admin","organizer"], default:"user"},
    status:{type:String,enum:["active","suspended","deleted"], default:"active"}
},{timestamps:true});

const User= mongoose.model<IUser>("User",UserSchema)
export default User