import { doctorSessions } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const counterProposeSessionRoute = protectedProcedure
  .input(
    z.object({
      sessionId: z.string().min(1),
      startAt: z.string().min(1),
      endAt: z.string().min(1),
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

    if (session.patientId !== userId) {
      throw new Error("Only the patient can counter-propose");
    }

    if (session.status !== "rescheduled") {
      throw new Error("Session is not in a rescheduled state");
    }

    const now = new Date().toISOString();

    await context.db
      .update(doctorSessions)
      .set({
        startAt: input.startAt,
        endAt: input.endAt,
        status: "requested",
        updatedAt: now,
      })
      .where(eq(doctorSessions.id, input.sessionId));

    return { ok: true };
  });
