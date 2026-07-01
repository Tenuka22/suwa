import { doctorPlans, doctorProfiles, users } from "@suwa/db";
import {
  BASIC_PLAN_DURATION_MINUTES,
  BASIC_PLAN_FEATURES,
  BASIC_PLAN_NAME,
} from "@suwa/pricing";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const adminApproveDoctorRoute = protectedProcedure
  .input(z.object({ userId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    requireAdmin(context);

    const [profile] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, input.userId))
      .limit(1);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const now = new Date().toISOString();

    await context.db
      .update(doctorProfiles)
      .set({
        permanent: true,
        updatedAt: now,
      })
      .where(eq(doctorProfiles.userId, input.userId));

    await context.db
      .update(users)
      .set({ role: "doctor" })
      .where(eq(users.id, input.userId));

    const [existing] = await context.db
      .select()
      .from(doctorPlans)
      .where(
        and(
          eq(doctorPlans.doctorId, input.userId),
          eq(doctorPlans.isActive, true)
        )
      )
      .limit(1);

    if (!existing) {
      await context.db.insert(doctorPlans).values({
        id: crypto.randomUUID(),
        doctorId: input.userId,
        name: BASIC_PLAN_NAME,
        description: "Standard consultation session",
        creditCost: 0,
        priceCents: 1500,
        durationMinutes: BASIC_PLAN_DURATION_MINUTES,
        features: JSON.stringify(BASIC_PLAN_FEATURES),
        isActive: true,
        isDefault: true,
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { ok: true };
  });
