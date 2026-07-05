import { doctorSessions } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { splitSessionRevenue } from "../revenue-split";
import { refundOrder } from "../polar-utils";

export const respondSessionRoute = protectedProcedure
  .input(
    z.object({
      sessionId: z.string().min(1),
      action: z.enum(["approve", "propose", "reject"]),
      proposedStartAt: z.string().optional(),
      proposedEndAt: z.string().optional(),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId, auth } = requireAuth(context);
    const role = auth.user?.role;

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    const isDoctor = session.doctorId === userId;
    const isAdmin = role === "admin";
    if (!(isDoctor || isAdmin)) {
      throw new Error("Only the doctor can respond to this session");
    }

    if (session.status !== "requested") {
      throw new Error(
        "Can only respond to sessions that are awaiting your response"
      );
    }

    const now = new Date().toISOString();

    if (input.action === "approve") {
      const { doctorEarnedCents } = splitSessionRevenue(
        session.amountCents ?? 0
      );

      await context.db
        .update(doctorSessions)
        .set({
          status: "approved",
          doctorEarnedCents,
          updatedAt: now,
        })
        .where(eq(doctorSessions.id, input.sessionId));
    } else if (input.action === "propose") {
      if (!(input.proposedStartAt && input.proposedEndAt)) {
        throw new Error(
          "Proposed start and end times are required when proposing a change"
        );
      }

      await context.db
        .update(doctorSessions)
        .set({
          startAt: input.proposedStartAt,
          endAt: input.proposedEndAt,
          status: "rescheduled",
          updatedAt: now,
        })
        .where(eq(doctorSessions.id, input.sessionId));
    } else {
      if (session.polarOrderId && session.amountCents) {
        await refundOrder(session.polarOrderId, session.amountCents);
      }

      await context.db
        .update(doctorSessions)
        .set({
          status: "timing_balance_failure",
          updatedAt: now,
        })
        .where(eq(doctorSessions.id, input.sessionId));
    }

    return { ok: true };
  });
