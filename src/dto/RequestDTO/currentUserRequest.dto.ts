import { z } from "zod";

export const CurrentUserRequestDTO = z.object({
  id: z.string().nonempty("Invalid user ID"),
});

export type CurrentUserRequestDTOType = z.infer<typeof CurrentUserRequestDTO>;