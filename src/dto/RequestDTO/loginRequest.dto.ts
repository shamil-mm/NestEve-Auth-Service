import { z } from "zod";
export const LoginRequestDTO = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["user", "organizer", "admin"]),
});
export type LoginRequestDTOType = z.infer<typeof LoginRequestDTO>;
