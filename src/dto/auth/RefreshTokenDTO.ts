import { z } from "zod";
import { RefreshTokenSchema } from "../../validator/userValidator";

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;