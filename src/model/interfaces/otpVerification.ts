import mongoose, { Document } from "mongoose";

export interface IOtpVerification extends Document{
    userId:mongoose.Schema.Types.ObjectId;
    otp:string;
    expiresAt:Date;
    createdAt:Date;
}