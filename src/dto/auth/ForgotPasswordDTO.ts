import { z } from "zod";
import { forgotPasswordSchema } from "../../validator/userValidator";

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;