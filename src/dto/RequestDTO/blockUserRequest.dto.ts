import { z } from "zod";

export const BlockUserRequestDTO = z.object({
  email: z.string().email("Please enter a valid email address."),
  is_block: z.boolean(),
});

export type BlockUserRequestDTOType = z.infer<typeof BlockUserRequestDTO>;