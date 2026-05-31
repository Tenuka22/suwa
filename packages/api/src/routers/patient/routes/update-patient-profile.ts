import { guardianProfiles, patientProfiles } from "@zen-doc/db";
import { updatePatientProfileSchema } from "@zen-doc/db/schemas-types";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const updatePatientProfileRoute = protectedProcedure
  .input(updatePatientProfileSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

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

    if (input.guardianEmail !== undefined || input.guardianPhone !== undefined) {
      const guardianEmail = input.guardianEmail ?? null;
      const guardianPhone = input.guardianPhone ?? null;

      updateData.guardianEmail = guardianEmail;
      updateData.guardianPhone = guardianPhone;
      updateData.guardianRequestStatus = "pending";

      const existingGuardian = await context.db.query.guardianProfiles.findFirst({
        where: guardianEmail
          ? eq(guardianProfiles.email, guardianEmail)
          : eq(guardianProfiles.phone, guardianPhone ?? ""),
      });

      if (!existingGuardian) {
        throw new Error("Guardian profile not found");
      }
    }

    if (input.guardianPhone !== undefined && input.guardianEmail === undefined) {
      updateData.guardianPhone = input.guardianPhone;
    }

    await context.db
      .update(patientProfiles)
      .set(updateData)
      .where(eq(patientProfiles.userId, userId));

    const updated = await context.db.query.patientProfiles.findFirst({
      where: eq(patientProfiles.userId, userId),
    });

    return { success: true, profile: updated };
  });
