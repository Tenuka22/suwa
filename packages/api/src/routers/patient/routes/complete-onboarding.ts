import { patientProfiles } from "@zen-doc/db";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { z } from "zod";


// Create a simplified schema for patient onboarding
const simpleOnboardingSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianPhone: z.string().optional().or(z.literal("")),
  _securedData: z.string().optional(),
});

export const completeOnboardingRoute = protectedProcedure
  .input(simpleOnboardingSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const { alias, guardianEmail, guardianPhone, _securedData } = input;

    const upsertData = {
      userId,
      alias,
      _securedData: _securedData ?? null,
      secured: !!_securedData,
      isOnboardingComplete: true,
      guardianEmail: guardianEmail || null,
      guardianPhone: guardianPhone || null,
      guardianRequestStatus: (guardianEmail || guardianPhone) ? "pending" : null,
    };

    await context.db
      .insert(patientProfiles)
      .values(upsertData)
      .onConflictDoUpdate({ target: patientProfiles.userId, set: upsertData });

    return { success: true };
  });
