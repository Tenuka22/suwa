import { z } from "zod";
import { publicProcedure } from "../../../index";

export const checkGuardianMatchRoute = publicProcedure
  .input(
    z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
  )
  .handler(({ input }) => {
    const { email, phone } = input;

    if (!(email || phone)) {
      return { match: false, guardianUserId: null };
    }

    return { match: false, guardianUserId: null };
  });
