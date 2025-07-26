import {z} from 'zod'

export const VerifyForgotPasswordRequestDTO = z.object({
  token: z.string().nonempty("Refresh token is required"),
});

export type VerifyForgotPasswordRequestDTOType = z.infer<typeof VerifyForgotPasswordRequestDTO>;