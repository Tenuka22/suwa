import { patientProfiles } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const putPrivacyDataRoute = protectedProcedure
  .input(
    z.object({
      _securedData: z.string().min(1),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    await context.db
      .update(patientProfiles)
      .set({
        _securedData: input._securedData,
        secured: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(patientProfiles.userId, userId));

    return { success: true };
  });
