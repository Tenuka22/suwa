import { patientProfiles } from "@suwa/db";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const simpleOnboardingSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  ageCategory: z.enum(["child", "teen", "adult", "senior"]),
  profession: z.enum([
    "student",
    "teacher",
    "employed",
    "self_employed",
    "unemployed",
    "retired",
    "healthcare_worker",
    "other",
  ]),
  _securedData: z.string().optional(),
});

export const completeOnboardingRoute = protectedProcedure
  .input(simpleOnboardingSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const { alias, ageCategory, profession, _securedData } = input;

    const upsertData = {
      userId,
      alias,
      ageCategory,
      profession,
      _securedData: _securedData ?? null,
      secured: !!_securedData,
      isOnboardingComplete: true,
    };

    await context.db
      .insert(patientProfiles)
      .values(upsertData)
      .onConflictDoUpdate({ target: patientProfiles.userId, set: upsertData });

    return { success: true };
  });
