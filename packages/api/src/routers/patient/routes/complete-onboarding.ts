import { patientProfiles } from "@doca/db";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const simpleOnboardingSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  _securedData: z.string().optional(),
});

export const completeOnboardingRoute = protectedProcedure
  .input(simpleOnboardingSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const { alias, _securedData } = input;

    const upsertData = {
      userId,
      alias,
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
