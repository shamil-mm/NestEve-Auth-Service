import mongoose, { Schema } from "mongoose";
import { IOtpVerification } from "../interfaces/otpVerification";

const otpVerificationSchema:Schema<IOtpVerification>=new Schema({
    userId:{type:mongoose.Schema.Types.ObjectId , ref:"User" , required:true},
    otp:{type:String,required:true},
    expiresAt:{type:Date, required:true},
    isVerified:{type:Boolean, default:false},
    createdAt: {type:Date,default:Date.now},
},{timestamps:true})
const otpVerificatio= mongoose.model<IOtpVerification>("OtpVerification",otpVerificationSchema)

export default otpVerificatio