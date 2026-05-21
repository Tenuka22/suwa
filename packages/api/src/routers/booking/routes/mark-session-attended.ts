import { doctorProfiles, doctorSessions } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getStripe, SESSION_PAYOUT_AMOUNT } from "../stripe-utils";

export const markSessionAttendedRoute = protectedProcedure
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
    const isAdmin = role === "admin";
    if (!(isDoctor || isAdmin)) {
      throw new Error(
        "Forbidden: You are not authorized to mark this session attended"
      );
    }

    if (session.status === "attended") {
      return {
        ok: true,
        payoutStatus: session.payoutStatus,
        message: "Session already attended",
      };
    }

    await context.db
      .update(doctorSessions)
      .set({
        status: "attended",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(doctorSessions.id, input.sessionId));

    const [doctorProfile] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, session.doctorId))
      .limit(1);

    const stripeAccountId = doctorProfile?.stripeAccountId;
    const stripeEnabled = doctorProfile?.stripeAccountEnabled;

    if (!(stripeAccountId && stripeEnabled)) {
      await context.db
        .update(doctorSessions)
        .set({
          payoutStatus: "failed",
          payoutAmount: SESSION_PAYOUT_AMOUNT,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(doctorSessions.id, input.sessionId));

      return {
        ok: true,
        payoutStatus: "failed",
        error:
          "Doctor does not have a fully enabled Stripe Connected account. Payout suspended.",
      };
    }

    await context.db
      .update(doctorSessions)
      .set({
        payoutStatus: "pending",
        payoutAmount: SESSION_PAYOUT_AMOUNT,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(doctorSessions.id, input.sessionId));

    const stripe = getStripe();
    try {
      const transfer = await stripe.transfers.create({
        amount: SESSION_PAYOUT_AMOUNT,
        currency: "usd",
        destination: stripeAccountId,
        description: `Payout for Session #${session.id} (Patient: ${session.patientId})`,
        metadata: {
          sessionId: session.id,
          doctorId: session.doctorId,
          patientId: session.patientId,
        },
      });

      await context.db
        .update(doctorSessions)
        .set({
          payoutStatus: "paid",
          payoutTransferId: transfer.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(doctorSessions.id, input.sessionId));

      return { ok: true, payoutStatus: "paid", transferId: transfer.id };
    } catch (err: unknown) {
      console.error("Stripe connect transfer failed:", err);

      await context.db
        .update(doctorSessions)
        .set({
          payoutStatus: "failed",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(doctorSessions.id, input.sessionId));

      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: true,
        payoutStatus: "failed",
        error: `Stripe transfer failed: ${msg}`,
      };
    }
  });
