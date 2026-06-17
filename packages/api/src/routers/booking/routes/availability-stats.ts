import { doctorWeeklyAvailability } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  if (h === undefined || m === undefined) {
    return 0;
  }
  return h * 60 + m;
};

export const availabilityStatsRoute = protectedProcedure
  .input(z.void())
  .handler(async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);

    const entries = await context.db
      .select()
      .from(doctorWeeklyAvailability)
      .where(eq(doctorWeeklyAvailability.doctorId, doctorId));

    const activeEntries = entries.filter((e) => e.isAvailable);
    const activeDays = new Set(activeEntries.map((e) => e.dayOfWeek)).size;
    const totalHours = activeEntries.reduce((acc, entry) => {
      const startMin = timeToMinutes(entry.startTime);
      const endMin = timeToMinutes(entry.endTime);
      return acc + (endMin - startMin) / 60;
    }, 0);

    const hoursByDay = Array.from({ length: 7 }, (_, day) => {
      const dayEntries = activeEntries.filter((e) => e.dayOfWeek === day);
      const dayHours = dayEntries.reduce((acc, entry) => {
        const startMin = timeToMinutes(entry.startTime);
        const endMin = timeToMinutes(entry.endTime);
        return acc + (endMin - startMin) / 60;
      }, 0);
      return { day, hours: Math.round(dayHours * 10) / 10 };
    });

    return {
      activeDays,
      totalHours: Math.round(totalHours * 10) / 10,
      totalSlots: activeEntries.length,
      hoursByDay,
    };
  });
