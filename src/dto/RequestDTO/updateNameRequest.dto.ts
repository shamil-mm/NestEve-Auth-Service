import { z } from "zod";

export const UpdateNameDTO = z.object({
  userId: z.string().trim().min(1, { message: "userId is required" }),
  name: z
    .string()
    .trim()
    .min(2, { message: "Name is required" })
});

export type UpdateNameDTOType = z.infer<typeof UpdateNameDTO>;
