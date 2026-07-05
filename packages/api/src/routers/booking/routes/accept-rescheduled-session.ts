import { doctorSessions } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { splitSessionRevenue } from "../revenue-split";

export const acceptRescheduledSessionRoute = protectedProcedure
  .input(z.object({ sessionId: z.string().min(1) }))
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
      throw new Error("Only the patient can accept a rescheduled session");
    }

    if (session.status !== "rescheduled") {
      throw new Error("Session is not awaiting your acceptance");
    }

    const now = new Date().toISOString();
    const { doctorEarnedCents } = splitSessionRevenue(session.amountCents ?? 0);

    await context.db
      .update(doctorSessions)
      .set({
        status: "approved",
        doctorEarnedCents,
        updatedAt: now,
      })
      .where(eq(doctorSessions.id, input.sessionId));

    return { ok: true };
  });
