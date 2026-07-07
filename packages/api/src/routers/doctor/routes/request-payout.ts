import { ORPCError } from "@orpc/server";
import { doctorCredits, doctorCashoutRequests, doctorProfiles } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { createConnectTransfer } from "../../booking/stripe-utils";

export const requestPayoutRoute = protectedProcedure
  .input(z.object({ amountCents: z.number().int().positive() }))
  .handler(async ({ context, input }) => {
    const { userId } = await requireDoctor(context);

    const [profile] = await context.db
      .select({ stripeAccountId: doctorProfiles.stripeAccountId })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, userId))
      .limit(1);

    if (!profile?.stripeAccountId) {
      throw new ORPCError("PRECONDITION_FAILED", {
        message: "Connect your Stripe account first to request payouts.",
      });
    }

    const [credits] = await context.db
      .select()
      .from(doctorCredits)
      .where(eq(doctorCredits.doctorId, userId))
      .limit(1);

    const balance = credits?.balanceCents ?? 0;
    if (input.amountCents > balance) {
      throw new ORPCError("PRECONDITION_FAILED", {
        message: `Insufficient balance. You have $${(balance / 100).toFixed(2)} available.`,
      });
    }

    const [pending] = await context.db
      .select()
      .from(doctorCashoutRequests)
      .where(eq(doctorCashoutRequests.doctorId, userId))
      .where(eq(doctorCashoutRequests.status, "pending"))
      .limit(1);

    if (pending) {
      throw new ORPCError("CONFLICT", {
        message: "You already have a pending payout request.",
      });
    }

    const cashoutId = crypto.randomUUID();
    await context.db.insert(doctorCashoutRequests).values({
      id: cashoutId,
      doctorId: userId,
      amountCents: input.amountCents,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      const transfer = await createConnectTransfer({
        amount: input.amountCents,
        destination: profile.stripeAccountId,
        transferGroup: cashoutId,
        metadata: { cashoutRequestId: cashoutId, doctorId: userId },
      });

      await context.db
        .update(doctorCashoutRequests)
        .set({
          status: "completed",
          polarTransferId: transfer.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(doctorCashoutRequests.id, cashoutId));

      await context.db
        .update(doctorCredits)
        .set({
          balanceCents: balance - input.amountCents,
          totalCashedOutCents: (credits?.totalCashedOutCents ?? 0) + input.amountCents,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(doctorCredits.doctorId, userId));

      return { success: true, cashoutId, transferId: transfer.id, amountCents: input.amountCents };
    } catch (err) {
      const failureReason = err instanceof Error ? err.message : "Unknown error";
      await context.db
        .update(doctorCashoutRequests)
        .set({ status: "failed", failureReason, updatedAt: new Date().toISOString() })
        .where(eq(doctorCashoutRequests.id, cashoutId));

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `Payout failed: ${failureReason}`,
      });
    }
  });