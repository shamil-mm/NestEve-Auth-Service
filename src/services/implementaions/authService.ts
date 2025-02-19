import bcrypt from "bcrypt";
import { IUser } from "../../model/interfaces/userInterface";
import { Decoded, IAuthService } from "../interfaces/IAuthService";
import { IUserRepository } from "../../repositories/interfaces/IUserRepository";
import {
  refreshTokenCreation,
  signToken,
  verifyToken,
} from "../../utils/jwtUtils";
import { Redis as RedisClient } from "ioredis";
import { inject, injectable } from "tsyringe";
import { Response, text } from "express";
import config from "../../config/config";
import EmailService from "./emailService";
import { Messages } from "../../constants/messages";
import RedisService from "./RedisService";


@injectable()
class AuthService implements IAuthService {
  private redisClient: RedisClient;
  private authRepository: IUserRepository;
 

  constructor(
    @inject("RedisClient") redisClient: RedisClient,
    @inject("AuthRepository") authRepository: IUserRepository,
   
  ) {
    this.redisClient = redisClient;
    this.authRepository = authRepository;
   
  }
  async registerUser(
    name: string,
    email: string,
    password: string
  ): Promise<void> {
    try {
      const existingUser = await this.authRepository.findByEmail(email) 
      if (existingUser) throw new Error("User already exists");

      const hashedPassword = await this.hashPassword(password);
      await RedisService.setData(`User:${email}`,JSON.stringify({name,email,hashedPassword}),3600)
      let tempUser= await RedisService.getData(`User:${email}`)
      console.log("redis stored data",tempUser)
      try {
        
        await EmailService.sentEmail(email,Messages.EMAIL_VERIFICATION_SUBJECT)
      } catch (error) {
        console.log("email sending error",error)
      }
    } catch (error: any) {
      console.log(error.message);
    }
  }

  async loginUser(email: string, password: string, res: Response) {
    try {

        
      const user = await this.authRepository.findByEmail(email);
      if (!user) throw new Error("user not fount");

      const isMatch = await this.comparePassword(password, user.password);
      if (!isMatch) throw new Error("password not matching");

      const accessToken = signToken(user);
      const refreshToken = refreshTokenCreation(user);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { accessToken, user };
    } catch (error: any) {
      console.log(error.message);
    }
  }
  async loginAdmin(
    email: string,
    password: string,
    res: Response
  ): Promise<any> {
    console.log("admin service is working")
    
    const user=await this.authRepository.findByEmail(email)
    console.log(user)
    if(!user){
        throw new Error('user not found')
    }
    if(user.role !== 'admin') throw new Error("unauthorized access")
    const isMatch= await this.comparePassword(password,user.password)
    if(!isMatch) throw new Error("password not matching")
    const accessToken=signToken(user);
    const refreshToken=refreshTokenCreation(user);

    res.cookie('refreshToken',refreshToken,{
        httpOnly:true,
        secure:config.NODE_ENV==="production",
        sameSite:'strict',
        maxAge: 7*24*60*60*1000
    })
    return {accessToken,user}
  }

  async logout(accessToken: string, res: Response): Promise<any> {
    try {
      res.cookie("refreshToken", "", {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
      });
      return { messages: "logged out successfully" };
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error("Logout failed: Invalid or expired token");
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const data = verifyToken(refreshToken) as Decoded;
     console.log(data)
      if (!data) {
        throw new Error("refresh token is not in redis data");
      }

      const newAccessToken = signToken(data) as string;

      return newAccessToken;
    } catch (error) {
      console.error("Refresh token error:", error);
      return null;
    }
  }

  // private utility methods

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  private async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}

export default AuthService;
