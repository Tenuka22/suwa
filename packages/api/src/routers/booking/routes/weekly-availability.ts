import { doctorWeeklyAvailability } from "@zen-doc/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const weeklySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isAvailable: z.boolean().default(true),
});

export const getWeeklyAvailabilityRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);

    const slots = await context.db
      .select()
      .from(doctorWeeklyAvailability)
      .where(eq(doctorWeeklyAvailability.doctorId, doctorId))
      .orderBy(
        doctorWeeklyAvailability.dayOfWeek,
        doctorWeeklyAvailability.startTime
      );

    return { slots };
  }
);

export const saveWeeklyAvailabilityRoute = protectedProcedure
  .input(
    z.object({
      slots: z.array(weeklySlotSchema),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = requireAuth(context);
    const now = new Date().toISOString();

    await context.db
      .delete(doctorWeeklyAvailability)
      .where(eq(doctorWeeklyAvailability.doctorId, doctorId));

    if (input.slots.length > 0) {
      await context.db.insert(doctorWeeklyAvailability).values(
        input.slots.map((slot) => ({
          id: crypto.randomUUID(),
          doctorId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }

    const slots = await context.db
      .select()
      .from(doctorWeeklyAvailability)
      .where(eq(doctorWeeklyAvailability.doctorId, doctorId))
      .orderBy(
        doctorWeeklyAvailability.dayOfWeek,
        doctorWeeklyAvailability.startTime
      );

    return { slots };
  });

export const getDoctorWeeklyAvailabilityRoute = protectedProcedure
  .input(z.object({ doctorId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    const slots = await context.db
      .select()
      .from(doctorWeeklyAvailability)
      .where(
        and(
          eq(doctorWeeklyAvailability.doctorId, input.doctorId),
          eq(doctorWeeklyAvailability.isAvailable, true)
        )
      )
      .orderBy(
        doctorWeeklyAvailability.dayOfWeek,
        doctorWeeklyAvailability.startTime
      );

    const filteredSlots = slots.filter((slot) => {
      if (slot.dayOfWeek > currentDay) {
        return true;
      }

      if (slot.dayOfWeek < currentDay) {
        return false;
      }

      return slot.startTime >= currentTime;
    });

    return { slots: filteredSlots };
  });
