import { z } from "zod";
import { googleAuthSchema } from "../../validator/userValidator";

export type GoogleAuthDto = z.infer<typeof googleAuthSchema>;