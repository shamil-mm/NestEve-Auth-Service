import config from "../config/config";
import { CookieOptions } from "express";

const isProduction = config.NODE_ENV === "production";
export const ACCESS_TOKEN_COOKIE_OPTIONS:CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax" as const,
  maxAge: 15 * 60 *1000 , 
  path:'/'
}

export const REFRESH_TOKEN_COOKIE_OPTIONS :CookieOptions= {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax" as const,
  maxAge: 7 * 24 * 60 * 60 *1000,
  path:'/'
}

export const CLEAR_TOKEN_COOKIE_OPTIONS:CookieOptions={
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax" as const,
  maxAge: 0,
  path:'/'
}
