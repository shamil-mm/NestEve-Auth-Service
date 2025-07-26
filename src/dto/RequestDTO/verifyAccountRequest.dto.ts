import {z} from 'zod'
export const VerifyAccountRequestDTO=z.object({
    token: z.string().nonempty("Refresh token is required"),
})
export type VerifyAccountRequestDTOType =z.infer<typeof VerifyAccountRequestDTO>