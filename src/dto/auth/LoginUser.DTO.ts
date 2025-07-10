import { z } from "zod";
import { LoginUserSchema } from "../../validator/userValidator";

export type LoginUserDto = z.infer<typeof LoginUserSchema>;