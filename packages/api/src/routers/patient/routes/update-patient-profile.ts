import { patientProfiles } from "@doca/db";
import { updatePatientProfileSchema } from "@doca/db/schemas-types";
import { eq } from "drizzle-orm";
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

    

    return { success: true, profile: updated };
  });
