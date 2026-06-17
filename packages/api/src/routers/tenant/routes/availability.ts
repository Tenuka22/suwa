import {
  doctorHospitalAffiliations,
  doctorScheduleEntries,
  doctorWeeklyAvailability,
  hospitalAvailabilityOverrides,
} from "@suwa/db";
import {
  createAvailabilityOverrideSchema,
  deleteAvailabilityOverrideSchema,
} from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

// Create a one-off availability override (doctor reserves hospital time)
export const createAvailabilityOverrideRoute = protectedProcedure
  .input(createAvailabilityOverrideSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const now = new Date().toISOString();
    const overrideId = crypto.randomUUID();

    await context.db.insert(hospitalAvailabilityOverrides).values({
      id: overrideId,
      doctorId: userId,
      tenantId: input.tenantId,
      startAt: input.startAt,
      endAt: input.endAt,
      reason: input.reason ?? null,
      createdAt: now,
      updatedAt: now,
    });

    // Create a doctor schedule "block" entry so calendar knows about it
    await context.db.insert(doctorScheduleEntries).values({
      id: crypto.randomUUID(),
      doctorId: userId,
      kind: "block",
      noteKind: "other",
      startAt: input.startAt,
      endAt: input.endAt,
      sessionId: null,
      createdAt: now,
      updatedAt: now,
    });

    return { overrideId };
  });

// Delete an availability override
export const deleteAvailabilityOverrideRoute = protectedProcedure
  .input(deleteAvailabilityOverrideSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const [override] = await context.db
      .select()
      .from(hospitalAvailabilityOverrides)
      .where(eq(hospitalAvailabilityOverrides.id, input.overrideId))
      .limit(1);

    if (!override) {
      throw new Error("Override not found");
    }
    if (override.doctorId !== userId) {
      throw new Error("Not authorized");
    }

    await context.db
      .delete(hospitalAvailabilityOverrides)
      .where(eq(hospitalAvailabilityOverrides.id, input.overrideId));

    return { success: true };
  });

// List doctor's availability overrides
export const listAvailabilityOverridesRoute = protectedProcedure
  .input(
    z.object({
      tenantId: z.string().min(1).optional(),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const overrides = await context.db
      .select()
      .from(hospitalAvailabilityOverrides)
      .where(eq(hospitalAvailabilityOverrides.doctorId, userId));

    const filtered = input.tenantId
      ? overrides.filter((o) => o.tenantId === input.tenantId)
      : overrides;

    return { overrides: filtered };
  });

/**
 * Get a doctor's fully-blocked time windows:
 * - Regular affiliation weekly windows (recurring)
 * - One-off overrides
 * Used by the booking slot generation to filter out hospital-blocked times.
 */
export const getDoctorHospitalBlocksRoute = protectedProcedure
  .input(
    z.object({
      doctorId: z.string().min(1),
      from: z.iso.datetime(),
      to: z.iso.datetime(),
    })
  )
  .handler(async ({ context, input }) => {
    requireAuth(context);

    // Fetch active affiliations
    const affiliations = await context.db
      .select()
      .from(doctorHospitalAffiliations)
      .where(
        and(
          eq(doctorHospitalAffiliations.doctorId, input.doctorId),
          eq(doctorHospitalAffiliations.status, "ACTIVE")
        )
      );

    const recurringWindows = affiliations.flatMap((aff) => {
      if (!aff.availabilityWindows) {
        return [];
      }
      const windows = JSON.parse(aff.availabilityWindows) as Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
      }>;
      return windows.map((w) => ({
        ...w,
        tenantId: aff.tenantId,
        type: "recurring" as const,
      }));
    });

    // Fetch one-off overrides in range
    const allOverrides = await context.db
      .select()
      .from(hospitalAvailabilityOverrides)
      .where(eq(hospitalAvailabilityOverrides.doctorId, input.doctorId));

    const rangeOverrides = allOverrides.filter(
      (o) => o.startAt >= input.from && o.endAt <= input.to
    );

    return {
      recurringWindows,
      overrides: rangeOverrides.map((o) => ({
        startAt: o.startAt,
        endAt: o.endAt,
        tenantId: o.tenantId,
        reason: o.reason,
        type: "override" as const,
      })),
    };
  });

// Check for conflicts between proposed hospital windows and existing bookings
export const checkAffiliationConflictsRoute = protectedProcedure
  .input(
    z.object({
      windows: z.array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          startTime: z.string().regex(/^\d{2}:\d{2}$/),
          endTime: z.string().regex(/^\d{2}:\d{2}$/),
        })
      ),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    // Get doctor's weekly availability
    const weeklySlots = await context.db
      .select()
      .from(doctorWeeklyAvailability)
      .where(
        and(
          eq(doctorWeeklyAvailability.doctorId, userId),
          eq(doctorWeeklyAvailability.isAvailable, true)
        )
      );

    const conflicts: Array<{
      window: (typeof input.windows)[number];
      conflictingSlot: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
      };
    }> = [];

    for (const window of input.windows) {
      for (const slot of weeklySlots) {
        if (slot.dayOfWeek !== window.dayOfWeek) {
          continue;
        }
        // Check time overlap
        const wStart = window.startTime;
        const wEnd = window.endTime;
        const sStart = slot.startTime;
        const sEnd = slot.endTime;
        if (wStart < sEnd && wEnd > sStart) {
          conflicts.push({
            window,
            conflictingSlot: {
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            },
          });
        }
      }
    }

    return { hasConflicts: conflicts.length > 0, conflicts };
  });
