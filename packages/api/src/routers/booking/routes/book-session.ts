import { doctorPlans, doctorSessions } from "@suwa/db";
import { TAX_RATE } from "@suwa/pricing";
import { and, eq, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { createHoldPaymentIntent } from "../stripe-utils";

export const bookSessionRoute = protectedProcedure
  .input(
    z.object({
      doctorId: z.string().min(1),
      planId: z.string().min(1),
      startAt: z.string().min(1),
      endAt: z.string().min(1),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId: patientId } = requireAuth(context);

    const [plan] = await context.db
      .select()
      .from(doctorPlans)
      .where(
        and(
          eq(doctorPlans.id, input.planId),
          eq(doctorPlans.doctorId, input.doctorId),
          eq(doctorPlans.isActive, true)
        )
      )
      .limit(1);

    if (!plan) {
      throw new Error("The selected plan is not available");
    }

    const overlappingOwn = await context.db
      .select({ id: doctorSessions.id })
      .from(doctorSessions)
      .where(
        and(
          eq(doctorSessions.doctorId, input.doctorId),
          eq(doctorSessions.patientId, patientId),
          lt(doctorSessions.startAt, input.endAt),
          gt(doctorSessions.endAt, input.startAt),
          or(
            eq(doctorSessions.status, "requested"),
            eq(doctorSessions.status, "rescheduled"),
            eq(doctorSessions.status, "approved")
          )
        )
      );

    if (overlappingOwn.length > 0) {
      throw new Error(
        "You already have a session that overlaps with this time"
      );
    }

    const overlappingDoctor = await context.db
      .select({ id: doctorSessions.id })
      .from(doctorSessions)
      .where(
        and(
          eq(doctorSessions.doctorId, input.doctorId),
          lt(doctorSessions.startAt, input.endAt),
          gt(doctorSessions.endAt, input.startAt),
          or(
            eq(doctorSessions.status, "requested"),
            eq(doctorSessions.status, "rescheduled"),
            eq(doctorSessions.status, "approved")
          )
        )
      );

    if (overlappingDoctor.length > 0) {
      throw new Error("The doctor is not available at this time");
    }

    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();
    const amountCents =
      plan.priceCents + Math.round(plan.priceCents * TAX_RATE);

    // Create Stripe PaymentIntent with manual capture (hold, don't charge yet)
    const paymentIntent = await createHoldPaymentIntent({
      amount: amountCents,
      patientId,
      doctorId: input.doctorId,
      sessionId,
      description: `Session hold for ${plan.name}`,
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Failed to create payment hold");
    }

    await context.db.insert(doctorSessions).values({
      id: sessionId,
      doctorId: input.doctorId,
      patientId,
      planId: plan.id,
      startAt: input.startAt,
      endAt: input.endAt,
      status: "requested",
      creditCost: 0,
      amountCents,
      paymentIntentId: paymentIntent.id,
      createdAt: now,
      updatedAt: now,
    });

    return {
      ok: true,
      sessionId,
      clientSecret: paymentIntent.client_secret,
      amountCents,
    };
  });
