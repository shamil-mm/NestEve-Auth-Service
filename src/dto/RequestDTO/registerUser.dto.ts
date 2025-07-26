import { z } from "zod";

export const RegisterUserDTO = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, '"Password must be at least 6 characters long"'),
  role: z.enum(["organizer", "user", "admin"]),
  organizationName:z.string().optional()
});

export type RegisterUserType=z.infer<typeof RegisterUserDTO>
