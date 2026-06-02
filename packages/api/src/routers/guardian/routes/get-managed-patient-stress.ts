import { patientProfiles } from "@zen-doc/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { env } from "@zen-doc/env/server";

export const getManagedPatientStressMetricsRoute = protectedProcedure
  .input(z.object({ patientUserId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const { userId: guardianId } = requireAuth(context);

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

    const kvKey = `model-features:${input.patientUserId}`;
    const records = await context.modelFeaturesKv.get<Array<{ sample: number[], timestamp: number }>>(kvKey, "json");

    if (!records || records.length === 0) {
      return [];
    }

    const response = await fetch(`${env.STRESS_PREDICTOR_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ window_samples: records.slice(-120).flatMap(r => r.sample) }), // Using last 120 samples
    });

    if (!response.ok) {
        return [];
    }

    const responseData = (await response.json()) as { results: number[] };
    return responseData.results;
  });
