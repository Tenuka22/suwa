import {
  creditTransactions,
  doctorCredits,
  doctorSessions,
  userCredits,
} from "@zen-doc/db";
import { CREDIT_PRICE_CENTS } from "@zen-doc/pricing";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

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
      const earnedCents = session.creditCost * CREDIT_PRICE_CENTS;

      const [patientCredit] = await context.db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, session.patientId))
        .limit(1);

      if (!patientCredit || patientCredit.balance < session.creditCost) {
        throw new Error("Patient has insufficient credits");
      }

      await context.db
        .update(userCredits)
        .set({
          balance: patientCredit.balance - session.creditCost,
          updatedAt: now,
        })
        .where(eq(userCredits.userId, session.patientId));

      await context.db.insert(creditTransactions).values({
        id: crypto.randomUUID(),
        userId: session.patientId,
        amount: -session.creditCost,
        type: "booking",
        sessionId: session.id,
        createdAt: now,
      });

      await context.db
        .update(doctorSessions)
        .set({
          status: "approved",
          doctorEarnedCents: earnedCents,
          updatedAt: now,
        })
        .where(eq(doctorSessions.id, input.sessionId));

      const [existingCredits] = await context.db
        .select()
        .from(doctorCredits)
        .where(eq(doctorCredits.doctorId, userId))
        .limit(1);

      if (existingCredits) {
        await context.db
          .update(doctorCredits)
          .set({
            balanceCents: existingCredits.balanceCents + earnedCents,
            totalEarnedCents: existingCredits.totalEarnedCents + earnedCents,
            updatedAt: now,
          })
          .where(eq(doctorCredits.doctorId, userId));
      } else {
        await context.db.insert(doctorCredits).values({
          doctorId: userId,
          balanceCents: earnedCents,
          totalEarnedCents: earnedCents,
          totalCashedOutCents: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
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
