import { patientMoods } from "@suwa/db";
import { eq } from "drizzle-orm";

import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getPatientMoodRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    return context.db.query.patientMoods.findFirst({
      where: eq(patientMoods.userId, userId),
    });
  }
);
