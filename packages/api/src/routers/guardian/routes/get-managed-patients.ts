import { patientProfiles } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getManagedPatientsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const managedPatients = await context.db.query.patientProfiles.findMany({
      where: eq(patientProfiles.guardianUserId, userId),
    });

    return managedPatients;
  }
);
