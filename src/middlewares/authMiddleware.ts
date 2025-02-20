import { Request,Response,NextFunction } from "express";
import { inject,injectable } from "tsyringe";
import { verifyToken } from "../utils/jwtUtils";
import { Decoded } from "../services/interfaces/IAuthService";
import {Redis as RedisClient}  from "ioredis";
import AuthService from "../services/implementaions/authService";
import config from "../config/config";


@injectable()
export default class AuthMiddleware{
    private redisClient:RedisClient;
    private authService:AuthService
    constructor(
        @inject('RedisClient') redisClient:RedisClient,
        @inject('AuthService') authService:AuthService
    ){
        this.redisClient = redisClient
        this.authService=authService
    }


    public async handle(req:Request,res:Response,next:NextFunction):Promise<void>{
        try {
            const authHeader = req.headers.authorization;
            if(!authHeader){
                 res.status(401).json({message:"no token provided"})
                 return;
            }
            const token=  authHeader.split(' ')[1]
            const decoded :Decoded | null =verifyToken(token,config.jwtSecret) as Decoded | null
            console.log(decoded)
            if(!decoded){
                await this.tryRefreshToken(req,res,next)
                return;
            }
            const isExpired = Date.now() >= decoded.exp *1000 
            if(isExpired){
                await this.tryRefreshToken(req,res,next,decoded.id)
                   }
            
            next()
            
        } catch (error) {
            console.error("Error encountered in auth middleware", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    private async tryRefreshToken(req:Request,res:Response,next:NextFunction,userId ?:string):Promise<void>{
        console.log("attempting to refresh access token")
        const refreshToken= req.headers['x-refresh-token'] as string
        if(!refreshToken){
            res.status(401).json({ message: "No refresh token provided" });
            return;
        }

        if(!userId){
            const refreshDecoded =verifyToken(refreshToken,config.jwtSecret) as Decoded | null
            
            if(!refreshDecoded){
                res.status(401).json({ message: "Invalid refresh token" });
                return;
            }
            userId=refreshDecoded.id
        }
        
          
        const storeRefreshToken = await this.redisClient.get(`refreshToken:${userId}`)
         

        
        if(storeRefreshToken !== refreshToken){
            res.status(401).json({ message: "Failed to refresh access token" });
            return;
        }
        const newAccessToken= await this.authService.refreshAccessToken(refreshToken)
       
        if (!newAccessToken) {
            res.status(401).json({ message: "Failed to refresh access token" });
            return;
        }
        res.setHeader("Authorization",`Bearer ${newAccessToken}`)
        console.log(newAccessToken)
        next()
    }

  
}