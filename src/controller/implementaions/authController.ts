import { Request,Response } from "express";
import { inject,injectable } from "tsyringe";
// import AuthService from "../../services/implementaions/authService"
import { IAuthService } from "../../services/interfaces/IAuthService";
import { IAuthController } from "../interfaces/IAuthController";


@injectable()
class AuthController implements IAuthController {
    constructor(
        @inject('AuthService') private authService:IAuthService
    ){}
    async register(req:Request,res:Response): Promise<void>  {
        console.log("register is working")
        try {
            const { name,email,password } = req.body
             await this.authService.registerUser(name,email,password);
            res.status(201).json({message:"verify your email to complete the user creation"})

        } catch (error) {
           const err= error as Error 
           res.status(401).json({error:err.message}) 
        }
    }
    

    async login(req:Request, res:Response):Promise<void>{
        try {
           
            const {email ,password } = req.body
            const result = await this.authService.loginUser(email,password,res)
            res.status(200).json(result)
        } catch (error) {
            const err=error as Error
            res.status(401).json({ error: err.message })
        }
    }
    async adminLogin(req:Request,res:Response):Promise<void>{
        try {
            console.log('admin controller is working')
            
            const{email,password}=req.body;
            const result=await this.authService.loginAdmin(email,password,res)
            res.status(201).json(result)
        } catch (error) {
            const err = error as Error;
            res.status(401).json({ error: err.message });
        }

    }
    async logout(req:Request,res:Response):Promise<void>{
        try {
            console.log("logout controller is working")
            
            const token = req.header("Authorization")?.replace("Bearer ","");
            if(!token){
              res.status(400).json({message:"no token provided"})
              return;
            }
            const result =await this.authService.logout(token,res)
            res.status(200).json(result)
        } catch (error) {
            const err=error as Error
            res.status(401).json({ error: err.message })
          
        }
    }
    async refreshToken(req:Request,res:Response):Promise<void>{
        try {
            
            const {refreshToken}=req.body
            if (!refreshToken) {
             res.status(400).json({ error: "Refresh token is required." });
             return
            }
            const newToken=await this.authService.refreshAccessToken(refreshToken)
            res.status(200).json({token:newToken})
            
        } catch (error) {
            const err = error as Error;
            if (err.message === "Invalid refresh token" || err.message === "Refresh token expired") {
                res.status(401).json({ error: err.message });
            } else {
                res.status(500).json({ error: "Internal server error." });
            }
        }
    }
}

export default AuthController