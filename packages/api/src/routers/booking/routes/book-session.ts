import { doctorPlans, doctorSessions } from "@suwa/db";
import { and, eq, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { calculateCheckoutAmount } from "../revenue-split";
import { createCheckoutSession } from "../polar-utils";

export const bookSessionRoute = protectedProcedure
  .input(
    z.object({
      doctorId: z.string().min(1),
      planId: z.string().min(1),
      startAt: z.string().min(1),
      endAt: z.string().min(1),
      returnUrl: z.string().url().optional(),
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

    const amountCents = plan.priceCents;
    const checkoutAmount = calculateCheckoutAmount(amountCents);
    const checkout = await createCheckoutSession({
      amount: checkoutAmount,
      customerExternalId: patientId,
      metadata: {
        type: "booking",
        sessionId,
        doctorId: input.doctorId,
        patientId,
        planId: plan.id,
      },
      successUrl: input.returnUrl,
      returnUrl: input.returnUrl,
    });

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
      polarOrderId: null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      ok: true,
      sessionId,
      checkoutUrl: checkout.url,
      amountCents,
    };
  });
