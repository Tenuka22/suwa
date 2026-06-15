import { doctorPlans } from "@doca/db";
import {
  createDoctorPlanSchema,
  deleteDoctorPlanSchema,
  updateDoctorPlanSchema,
} from "@doca/db/schemas-types";
import { and, eq, max } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const listDoctorPlansRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);

    const plans = await context.db
      .select()
      .from(doctorPlans)
      .where(
        and(eq(doctorPlans.doctorId, doctorId), eq(doctorPlans.isActive, true))
      )
      .orderBy(doctorPlans.sortOrder);

    return { plans };
  }
);

export const getDoctorPlansRoute = protectedProcedure
  .input(z.object({ doctorId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const plans = await context.db
      .select()
      .from(doctorPlans)
      .where(
        and(
          eq(doctorPlans.doctorId, input.doctorId),
          eq(doctorPlans.isActive, true)
        )
      )
      .orderBy(doctorPlans.sortOrder);

    return { plans };
  });

export const createDoctorPlanRoute = protectedProcedure
  .input(createDoctorPlanSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = requireAuth(context);

    const now = new Date().toISOString();
    const planId = crypto.randomUUID();

    const [maxSort] = await context.db
      .select({ maxOrder: max(doctorPlans.sortOrder) })
      .from(doctorPlans)
      .where(eq(doctorPlans.doctorId, doctorId));

    const nextSortOrder = (maxSort?.maxOrder ?? 0) + 1;

    await context.db.insert(doctorPlans).values({
      id: planId,
      doctorId,
      name: input.name,
      description: input.description ?? null,
      creditCost: 0,
      priceCents: input.priceCents,
      durationMinutes: input.durationMinutes,
      features: input.features ? JSON.stringify(input.features) : null,
      isActive: true,
      sortOrder: nextSortOrder,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true, id: planId };
  });

export const updateDoctorPlanRoute = protectedProcedure
  .input(updateDoctorPlanSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = requireAuth(context);

    const [existing] = await context.db
      .select()
      .from(doctorPlans)
      .where(
        and(eq(doctorPlans.id, input.id), eq(doctorPlans.doctorId, doctorId))
      )
      .limit(1);

    if (!existing) {
      throw new Error("Plan not found");
    }

    const now = new Date().toISOString();

    const updateData: Partial<typeof doctorPlans.$inferInsert> = {
      updatedAt: now,
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.priceCents !== undefined) {
      updateData.priceCents = input.priceCents;
    }
    if (input.durationMinutes !== undefined) {
      updateData.durationMinutes = input.durationMinutes;
    }
    if (input.isActive !== undefined) {
      updateData.isActive = input.isActive;
    }
    if (input.features !== undefined) {
      updateData.features = input.features
        ? JSON.stringify(input.features)
        : null;
    }

    await context.db
      .update(doctorPlans)
      .set(updateData)
      .where(eq(doctorPlans.id, input.id));

    return { ok: true };
  });

export const deleteDoctorPlanRoute = protectedProcedure
  .input(deleteDoctorPlanSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = requireAuth(context);

    const [existing] = await context.db
      .select()
      .from(doctorPlans)
      .where(
        and(eq(doctorPlans.id, input.id), eq(doctorPlans.doctorId, doctorId))
      )
      .limit(1);

    if (!existing) {
      throw new Error("Plan not found");
    }

    if (existing.isDefault) {
      throw new Error("Cannot delete the default plan");
    }

    await context.db
      .update(doctorPlans)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(doctorPlans.id, input.id));

    return { ok: true };
  });
