import mongoose, { Schema } from "mongoose";
import { IOtpVerification } from "../interfaces/otpVerification";

const otpVerificationSchema:Schema<IOtpVerification>=new Schema({
    userId:{type:mongoose.Schema.Types.ObjectId , ref:"User" , required:true},
    otp:{type:String,required:true},
    expiresAt:{type:Date, required:true,expires:300},
    createdAt: {type:Date,default:Date.now},
},{timestamps:true})

// otpVerificationSchema.index({expiresAt:1},{expireAfterSeconds:})

const otpVerification= mongoose.model<IOtpVerification>("OtpVerification",otpVerificationSchema)

export default otpVerification
