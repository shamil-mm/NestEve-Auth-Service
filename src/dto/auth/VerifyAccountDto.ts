import { z } from "zod";
import { VerifyAccountSchema } from "../../validator/userValidator";

export type VerifyAccountDto = z.infer<typeof VerifyAccountSchema>;