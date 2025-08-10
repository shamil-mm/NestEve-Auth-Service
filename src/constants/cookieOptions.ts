import config from "../config/config";

  // secure: config.NODE_ENV !== "development",

export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 15 * 60 *1000 , 
  path:'/'
}

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const CLEAR_TOKEN_COOKIE_OPTIONS={
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 0,
}
