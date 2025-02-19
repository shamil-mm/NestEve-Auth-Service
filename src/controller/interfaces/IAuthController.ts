import { Request,response,Response } from "express";
export interface IAuthController {
    register(req:Request,res:Response):Promise<void>;
    login(req:Request,res:Response):Promise<void>;
    adminLogin(req:Request,res:Response):Promise<void>;
    logout(req:Request,res:Response):Promise<void>;
    refreshToken(req:Request,res:Response):Promise<void>
}