import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ClerkRequestContext } from "../../../context";

export function createCheckAvailabilityTool(context: ClerkRequestContext) {
  return tool(
    async ({ doctorId, date }: { doctorId: string; date: string }) => {
      const { doctorSessions } = await import("@suwa/db");
      const { and, gte, lt, eq } = await import("drizzle-orm");
      const dayStart = new Date(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const booked = await context.db
        .select()
        .from(doctorSessions)
        .where(
          and(
            eq(doctorSessions.doctorId, doctorId),
            gte(doctorSessions.startAt, dayStart.toISOString()),
            lt(doctorSessions.startAt, dayEnd.toISOString())
          )
        );
      return JSON.stringify({
        doctorId,
        date,
        bookedSlots: booked.map((s) => s.startAt),
        available: booked.length === 0,
      });
    },
    {
      name: "check_availability",
      description: "Check doctor availability for a date",
      schema: z.object({ doctorId: z.string(), date: z.string() }),
    }
  );
}
