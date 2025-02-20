import { z } from 'zod'

const emailSchema=z.string().email("Please enter a valid email address.")
const passwordSchema=z.string()
                       .min(6,'"Password must be at least 6 characters long"')
                       .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
const nameSchema=z.string()
                  .min(3,"Name must be at least 3 characters long")
                  .regex(/^[A-Za-z\s]+$/, "Password must contain at least one special character")
export const RegisterUserSchema=z.object({
    name:nameSchema,
    email:emailSchema,
    password:passwordSchema
})
export const  LoginUserSchema=z.object({
    email:emailSchema,
    password:passwordSchema
})
export const RefreshTokenSchema=z.object({
    refreshToken:z.string().nonempty("Refresh token is required")
})
export const VerifyAccountSchema=z.object({
    token:z.string().nonempty("Refresh token is required")
})

