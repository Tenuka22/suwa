import { guardianProfiles, patientProfiles } from "@zen-doc/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";

const onboardingModeSchema = z.enum(["self", "has_guardian", "guardian"]);
const completeOnboardingSchema = z.object({
  mode: onboardingModeSchema,
  alias: z.string().min(1).max(100),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  guardianEmail: z.string().email().optional(),
  guardianPhone: z.string().optional(),
});

export const patientRouter = {
  getPatientProfile: protectedProcedure.handler(async ({ context }) => {
    const userId = context.auth?.userId;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const patient = await context.db.query.patientProfiles.findFirst({
      where: eq(patientProfiles.userId, userId),
    });

    return patient;
  }),

  checkGuardianMatch: publicProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
      })
    )
    .handler(({ input }) => {
      const { email, phone } = input;

      if (!(email || phone)) {
        return { match: false, guardianUserId: null };
      }

      return { match: false, guardianUserId: null };
    }),

  getPendingGuardianRequests: protectedProcedure.handler(
    async ({ context }) => {
      const userId = context.auth?.userId;
      if (!userId) {
        throw new Error("Not authenticated");
      }

      const guardian = await context.db.query.guardianProfiles.findFirst({
        where: eq(guardianProfiles.clerkUserId, userId),
      });

      if (!guardian) {
        return { requests: [] };
      }

      const pendingPatients = await context.db
        .select()
        .from(patientProfiles)
        .where(
          and(
            eq(patientProfiles.guardianEmail, guardian.email),
            guardian.phone ? eq(patientProfiles.guardianPhone, guardian.phone) : undefined,
            eq(patientProfiles.guardianRequestStatus, "pending")
          )
        );

      return {
        requests: pendingPatients.map((p) => ({
          userId: p.userId,
          alias: p.alias,
          guardianEmail: p.guardianEmail,
          guardianPhone: p.guardianPhone,
        })),
      };
    }
  ),

  approveGuardianRequest: protectedProcedure
    .input(z.object({ patientUserId: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.auth?.userId;
      if (!userId) {
        throw new Error("Not authenticated");
      }

      const guardian = await context.db.query.guardianProfiles.findFirst({
        where: eq(guardianProfiles.clerkUserId, userId),
      });

      if (!guardian) {
        throw new Error("You are not a guardian");
      }

      await context.db
        .update(patientProfiles)
        .set({
          guardianUserId: guardian.userId,
          guardianRequestStatus: "approved",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(patientProfiles.userId, input.patientUserId));

      return { success: true };
    }),

  completeOnboarding: protectedProcedure
    .input(completeOnboardingSchema)
    .handler(async ({ context, input }) => {
      const userId = context.auth?.userId;
      if (!userId) {
        throw new Error("Not authenticated");
      }

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
            phone: "", // Phone from Clerk if available
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
    }),
};
