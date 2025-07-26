import {z} from 'zod'
export const GoogleAuthRequestDTO = z.object({
  userID: z.string().nonempty("token id required"),
  role:  z.enum(["organizer", "user", "admin"]),
});

export type GoogleAuthRequestDTOType = z.infer<typeof GoogleAuthRequestDTO>;