import { z } from "zod";

export const UpdatePasswordDTO = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email format" }),

  passwords: z.object({
    oldpassword: z
      .string()
      .trim()
      .min(6, { message: "Old password must be at least 6 characters" }),

    newpassword: z
      .string()
      .trim()
      .min(6, { message: "New password must be at least 6 characters" }),
  }),
});

export type UpdatePasswordDTOType = z.infer<typeof UpdatePasswordDTO>;
