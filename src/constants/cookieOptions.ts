import config from "../config/config";

export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.NODE_ENV !== "development",
  sameSite: "none" as const,
  maxAge: 15 * 60 , 
  path: "/",
}

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.NODE_ENV !== "development",
  sameSite: "none" as const,
  maxAge: 7 * 24 * 60 * 60 ,
  path: "/", 
}

export const CLEAR_TOKEN_COOKIE_OPTIONS={
  httpOnly: true,
  secure: config.NODE_ENV !== "development",
  sameSite: "none" as const,
  maxAge: 0,
}
