
import {z} from 'zod'
export const RefreshTokenRequestDTO=z.object({
    refreshToken: z.string().nonempty("Refresh token is required")
})
export type RefreshTokenRequestDTOType=z.infer<typeof RefreshTokenRequestDTO>