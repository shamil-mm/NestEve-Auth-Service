import { Response } from "express";
import config from "../../config/config";

export const setAuthCookies=(res:Response,tokens:any,isAdmin:boolean=false)=>{
 const prefix =isAdmin ? "admin_":""
 res.cookie(`${prefix}accessToken`,tokens.accessToken,{
    httpOnly:true,
    secure:config.NODE_ENV !=='development',
    sameSite:'none',
    maxAge:15 * 60* 1000,
 })
 res.cookie(`${prefix}refreshToken`,tokens.refreshToken,{
    httpOnly:true,
    secure:config.NODE_ENV !=="development",
    sameSite:'none',
    maxAge:7 * 24 * 60 *  60 * 1000
 })
}