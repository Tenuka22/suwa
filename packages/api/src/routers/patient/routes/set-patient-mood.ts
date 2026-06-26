import { patientMoods } from "@suwa/db";
import { setPatientMoodSchema } from "@suwa/db/schemas-types";
import { eq } from "drizzle-orm";

import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const setPatientMoodRoute = protectedProcedure
  .input(setPatientMoodSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const now = new Date().toISOString();

    await context.db
      .insert(patientMoods)
      .values({
        createdAt: now,
        intensity: input.intensity,
        mood: input.mood,
        updatedAt: now,
        userId,
      })
      .onConflictDoUpdate({
        target: patientMoods.userId,
        set: {
          intensity: input.intensity,
          mood: input.mood,
          updatedAt: now,
        },
      });

    return context.db.query.patientMoods.findFirst({
      where: eq(patientMoods.userId, userId),
    });
  });
