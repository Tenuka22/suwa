import { doctorSessions, sessionAttendanceEvents } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const recordAttendanceEventRoute = protectedProcedure
  .input(
    z.object({
      sessionId: z.string().min(1),
      event: z.enum(["join", "leave"]),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    const isPatient = session.patientId === userId;
    const isDoctor = session.doctorId === userId;

    if (!(isPatient || isDoctor)) {
      throw new Error("Not authorized for this session");
    }

    const participantType = isDoctor ? "doctor" : "patient";

    await context.db.insert(sessionAttendanceEvents).values({
      id: crypto.randomUUID(),
      sessionId: input.sessionId,
      participantId: userId,
      participantType,
      event: input.event,
      timestamp: new Date().toISOString(),
    });

    return { ok: true };
  });
