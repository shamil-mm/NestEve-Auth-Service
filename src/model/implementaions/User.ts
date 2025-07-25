import mongoose, { Schema } from "mongoose";
import { IUser } from "../interfaces/userInterface";
import { boolean } from "zod";

const UserSchema: Schema<IUser> = new Schema(
  {
    
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    avatarUrl: { type:String, default:null},
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
    role: {
      type: String,
      enum: ["user", "admin", "organizer"],
      default: "user",
    },
    organizationName: { type: String, default: null },
    is_block: { type: Boolean, default: false },
    location:{
      type:{
        type:String,
        enum:['Point'],
        default:'Point'
      },
      coordinates:{
        type:[Number],
        default:[0,0],
      }
    },
  },
  { timestamps: true }
);

UserSchema.index({location:"2dsphere"})
const User = mongoose.model<IUser>("User", UserSchema);
export default User;
