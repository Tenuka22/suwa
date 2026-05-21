import { guardianProfiles, patientProfiles } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const approveGuardianRequestRoute = protectedProcedure
  .input(z.object({ patientUserId: z.string() }))
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const guardian = await context.db.query.guardianProfiles.findFirst({
      where: eq(guardianProfiles.clerkUserId, userId),
    });

    if (!guardian) {
      throw new Error("You are not a guardian");
    }

    await context.db
      .update(patientProfiles)
      .set({
        guardianUserId: guardian.userId,
        guardianRequestStatus: "approved",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(patientProfiles.userId, input.patientUserId));

    return { success: true };
  });
