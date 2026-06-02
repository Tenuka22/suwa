import { guardianProfiles, patientProfiles } from "@zen-doc/db";
import { updatePatientProfileSchema } from "@zen-doc/db/schemas-types";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const updatePatientProfileRoute = protectedProcedure
  .input(updatePatientProfileSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    console.log("[update-patient-profile] input:", JSON.stringify(input));

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (input.alias !== undefined) {
      updateData.alias = input.alias;
    }

    if (input._securedData !== undefined) {
      updateData._securedData = input._securedData;
      updateData.secured = true;
    }

    if (
      input.guardianEmail !== undefined ||
      input.guardianPhone !== undefined
    ) {
      const guardianEmail = input.guardianEmail ?? null;
      const guardianPhone = input.guardianPhone ?? null;

      console.log(
        "[update-patient-profile] guardianEmail:",
        guardianEmail,
        "guardianPhone:",
        guardianPhone
      );

      if (guardianEmail === null && guardianPhone === null) {
        console.log("[update-patient-profile] clearing guardian");
        updateData.guardianEmail = sql`NULL`;
        updateData.guardianPhone = sql`NULL`;
        updateData.guardianUserId = sql`NULL`;
        updateData.guardianRequestStatus = sql`NULL`;
      } else {
        console.log("[update-patient-profile] setting guardian");
        updateData.guardianEmail = guardianEmail;
        updateData.guardianPhone = guardianPhone;
        updateData.guardianRequestStatus = "pending";

        // We don't require the guardian to exist in our DB yet.
        // They will be matched when they log in and check pending requests.
      }
    }

    const db = context.db;
    const query = db
      .update(patientProfiles)
      .set(updateData)
      .where(eq(patientProfiles.userId, userId));
    console.log("[update-patient-profile] SQL:", query.toSQL());
    await query;

    const updated = await context.db.query.patientProfiles.findFirst({
      where: eq(patientProfiles.userId, userId),
    });

    console.log(
      "[update-patient-profile] updated profile guardianEmail:",
      updated?.guardianEmail
    );

    return { success: true, profile: updated };
  });
