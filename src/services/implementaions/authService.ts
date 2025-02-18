import bcrypt from "bcrypt"
import { IUser } from "../../model/interfaces/userInterface";
import { Decoded, IAuthService } from "../interfaces/IAuthService";
import { IUserRepository } from "../../repositories/interfaces/IUserRepository";
import { decodeToken, refreshTokenCreation, signToken, verifyToken } from "../../utils/jwtUtils";
import {Redis as RedisClient} from "ioredis";
import { inject,injectable } from "tsyringe";
import { Response } from "express";
import config from "../../config/config";




@injectable()
class AuthService implements IAuthService {

    private redisClient:RedisClient;
    private authRepository:IUserRepository;


    constructor(
        @inject('RedisClient')redisClient:RedisClient,
        @inject('AuthRepository')authRepository:IUserRepository
            ){
                this.redisClient=redisClient ;
                this.authRepository=authRepository
            }
    async registerUser (name:string,email:string,password:string):Promise<IUser> {

        const existingUser = await this.authRepository.findByEmail(email);

        if(existingUser) throw new Error('user already exists');

        const hashedPassword = await this.hashPassword(password)
        return await this.authRepository.create({name,email,password:hashedPassword})
    }
    
    async loginUser(email:string,password:string,res:Response){
        
        const user = await this.authRepository.findByEmail(email)
        if(!user) throw new Error ("user not fount");
        
        const isMatch =  await this.comparePassword(password,user.password)
        if(! isMatch) throw new Error ("password not matching")
          
        const accessToken = signToken(user)
        const refreshToken = refreshTokenCreation(user)

        res.cookie('refreshToken',refreshToken,{
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return {accessToken , user}
    }
    
    async logout(accessToken:string,res:Response): Promise<any> {
        try {

        res.cookie('refreshToken',"",{
            httpOnly:true,
            secure:config.NODE_ENV==="production",
            sameSite:'strict',
            maxAge:0
        })
        return {messages:"logged out successfully"}
        
        

        } catch (error) {
           console.error("Logout error:", error);
           throw new Error("Logout failed: Invalid or expired token");      
        }
   
    }

    async refreshAccessToken(refreshToken: string): Promise<string | null> {
        try {
            
            const data=verifyToken(refreshToken) as Decoded

            if(!data){

            throw new Error("refresh token is not in redis data");

            }
           
            const newAccessToken = signToken(data.id) as string

            return  newAccessToken
            
        } catch (error) {
            console.error("Refresh token error:", error); 
            return null
        }
        
    }
    

    

    // private utility methods

    private async hashPassword(password:string):Promise<string> {
        return await bcrypt.hash(password,10)
    }

    private async comparePassword(password:string,hashedPassword:string):Promise<boolean>{
        return await bcrypt.compare(password,hashedPassword)
    }

}

export default AuthService;
