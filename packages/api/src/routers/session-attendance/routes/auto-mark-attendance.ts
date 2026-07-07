import { doctorSessions, sessionAttendanceEvents } from "@suwa/db";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const ATTENDANCE_THRESHOLD_RATIO = 0.5;

export const autoMarkAttendanceRoute = protectedProcedure
  .input(z.object({ sessionId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const { userId, auth } = requireAuth(context);
    const role = auth.sessionClaims?.metadata?.role;

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    const isDoctor = session.doctorId === userId;
    const isAdmin = role === "admin" || role === "doctor";
    if (!(isDoctor || isAdmin)) {
      throw new Error("Not authorized");
    }

    if (session.status === "attended") {
      return { ok: true, message: "Already marked as attended" };
    }

    if (session.status !== "approved") {
      throw new Error("Session must be in approved status");
    }

    const doctorEvents = await context.db
      .select()
      .from(sessionAttendanceEvents)
      .where(
        and(
          eq(sessionAttendanceEvents.sessionId, input.sessionId),
          eq(sessionAttendanceEvents.participantType, "doctor")
        )
      )
      .orderBy(asc(sessionAttendanceEvents.timestamp));

    if (doctorEvents.length === 0) {
      return {
        ok: false,
        message: "No doctor presence events recorded",
        attended: false,
      };
    }

    const totalPresentMs = computeDoctorPresenceDuration(doctorEvents);
    const sessionStartMs = new Date(session.startAt).getTime();
    const sessionEndMs = new Date(session.endAt).getTime();
    const sessionDurationMs = sessionEndMs - sessionStartMs;

    if (sessionDurationMs <= 0) {
      throw new Error("Invalid session duration");
    }

    const presenceRatio = totalPresentMs / sessionDurationMs;
    const attended = presenceRatio >= ATTENDANCE_THRESHOLD_RATIO;

    if (attended) {
      const now = new Date().toISOString();
      await context.db
        .update(doctorSessions)
        .set({ status: "attended", updatedAt: now })
        .where(eq(doctorSessions.id, input.sessionId));
    }

    return {
      ok: true,
      attended,
      totalPresentMs,
      sessionDurationMs,
      presenceRatio: Math.round(presenceRatio * 100) / 100,
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
