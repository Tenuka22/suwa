import { guardianProfiles, patientProfiles } from "@zen-doc/db";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getPendingGuardianRequestsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const guardian = await context.db.query.guardianProfiles.findFirst({
      where: eq(guardianProfiles.clerkUserId, userId),
    });

    if (!guardian) {
      return { requests: [] };
    }

    const pendingPatients = await context.db
      .select()
      .from(patientProfiles)
      .where(
        and(
          eq(patientProfiles.guardianEmail, guardian.email),
          guardian.phone
            ? eq(patientProfiles.guardianPhone, guardian.phone)
            : undefined,
          eq(patientProfiles.guardianRequestStatus, "pending")
        )
      );

    return {
      requests: pendingPatients.map((p) => ({
        userId: p.userId,
        alias: p.alias,
        guardianEmail: p.guardianEmail,
        guardianPhone: p.guardianPhone,
      })),
    };
  }
);
