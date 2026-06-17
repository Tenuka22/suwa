import { sessionAttendanceEvents } from "@suwa/db";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getSessionAttendanceRoute = protectedProcedure
  .input(z.object({ sessionId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    requireAuth(context);

    const events = await context.db
      .select()
      .from(sessionAttendanceEvents)
      .where(
        and(
          eq(sessionAttendanceEvents.sessionId, input.sessionId),
          eq(sessionAttendanceEvents.participantType, "doctor")
        )
      )
      .orderBy(asc(sessionAttendanceEvents.timestamp));

    const totalPresentMs = computeDoctorPresenceDuration(events);

    return {
      events,
      totalPresentMs,
      totalPresentMinutes: Math.round(totalPresentMs / 60_000),
    };
  });

function computeDoctorPresenceDuration(
  events: Array<{
    event: string;
    timestamp: string;
  }>
): number {
  let totalMs = 0;
  let lastJoin: number | null = null;

  for (const event of events) {
    const ts = new Date(event.timestamp).getTime();
    if (event.event === "join") {
      lastJoin = ts;
    } else if (event.event === "leave" && lastJoin !== null) {
      totalMs += ts - lastJoin;
      lastJoin = null;
    }
  }

  if (lastJoin !== null) {
    totalMs += Date.now() - lastJoin;
  }

  return totalMs;
}
