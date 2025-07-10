import { z } from "zod";
import { RegisterUserSchema } from "../../validator/userValidator";

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;