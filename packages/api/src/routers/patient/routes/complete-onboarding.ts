import { guardianProfiles, patientProfiles } from "@zen-doc/db";
import { completeOnboardingSchema } from "@zen-doc/db/schemas-types";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const completeOnboardingRoute = protectedProcedure
  .input(completeOnboardingSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const { mode, alias, phone, email, guardianEmail, guardianPhone } = input;

    if (mode === "self") {
      await context.db.insert(patientProfiles).values({
        userId,
        alias,
        phone: phone ?? null,
        email: email ?? null,
        isOnboardingComplete: true,
      });

      return { success: true, mode: "self" };
    }

    if (mode === "has_guardian") {
      if (!(guardianEmail && guardianPhone)) {
        throw new Error("Guardian email and phone are required");
      }

      await context.db.insert(patientProfiles).values({
        userId,
        alias,
        guardianEmail,
        guardianPhone,
        guardianRequestStatus: "pending",
        isOnboardingComplete: true,
      });

      return { success: true, mode: "has_guardian" };
    }

    if (mode === "guardian") {
      if (!guardianEmail) {
        throw new Error("Guardian email is required");
      }

      const existingGuardian =
        await context.db.query.guardianProfiles.findFirst({
          where: eq(guardianProfiles.email, guardianEmail),
        });

      if (existingGuardian) {
        await context.db
          .update(guardianProfiles)
          .set({
            clerkUserId: userId,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(guardianProfiles.userId, existingGuardian.userId));
      } else {
        const newGuardianId = `guardian_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await context.db.insert(guardianProfiles).values({
          userId: newGuardianId,
          clerkUserId: userId,
          email: guardianEmail,
          phone: "",
        });
      }

      await context.db.insert(patientProfiles).values({
        userId,
        alias,
        isOnboardingComplete: true,
      });

      return { success: true, mode: "guardian" };
    }

    throw new Error("Invalid mode");
  });
