import { wellnessActions, patientProfiles } from "@zen-doc/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getManagedPatientWellnessRoute = protectedProcedure
  .input(z.object({ patientUserId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const { userId: guardianId } = requireAuth(context);

    // Verify guardian manages this patient
    const [patient] = await context.db
      .select()
      .from(patientProfiles)
      .where(
        and(
          eq(patientProfiles.userId, input.patientUserId),
          eq(patientProfiles.guardianUserId, guardianId)
        )
      )
      .limit(1);

    if (!patient) {
      throw new Error("Patient not found or not managed by you");
    }

    const history = await context.db
      .select()
      .from(wellnessActions)
      .where(eq(wellnessActions.userId, input.patientUserId))
      .orderBy(wellnessActions.completedAt);

    return history;
  });
