import { guardianProfiles } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getGuardianProfileRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const guardian = await context.db.query.guardianProfiles.findFirst({
      where: eq(guardianProfiles.clerkUserId, userId),
    });

    return guardian ?? null;
  }
);
