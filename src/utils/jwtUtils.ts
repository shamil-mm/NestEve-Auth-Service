import jwt from 'jsonwebtoken'
import config from '../config/config';
import { Decoded } from '../services/interfaces/IAuthService';


export const signToken = (user:any)=>{
  try {
    return jwt.sign({id:user.id,email:user.email,role:user.role},config.jwtSecret,{expiresIn:"1m"})
  } catch (error) {
    console.log("signToken failed")
  }
}

export const verifyToken = (token:string)=>{
  try {
    
    return jwt.verify(token,config.jwtSecret)
  } catch (error) {
    return null
  }
}

export const refreshTokenCreation=(user:any)=>{
  try {
    
    return jwt.sign({id:user._id,email:user.email,role:user.role},config.jwtSecret,{expiresIn:"7d"})
  } catch (error) {
    console.log("refresh token failed")
  }
}


