import { Response } from "express";

export interface IAuthService {
    registerUser(name: string,email:string,password:string):Promise<void>;
    loginUser(email:string,password:string,res?:Response):Promise<any>
    loginAdmin(email:string,password:string,res:Response):Promise<any>
    logout(accessToken:string,res?:Response):Promise<void>
    refreshAccessToken(refreshToken:string):Promise<any>
    verifyAccount(token:string):Promise<{message:string}>
}
export interface Decoded {
        id:string;
        email:string;
        iat:number;
        exp:number;
    }