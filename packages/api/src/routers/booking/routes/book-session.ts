import { doctorPlans, doctorSessions } from "@zen-doc/db";
import { and, eq, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

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

    // Allow multiple sessions with the same doctor as long as they don't overlap
    const overlapping = await context.db
      .select({ id: doctorSessions.id })
      .from(doctorSessions)
      .where(
        and(
          eq(doctorSessions.doctorId, input.doctorId),
          or(
            and(
              lt(doctorSessions.startAt, input.endAt),
              gt(doctorSessions.endAt, input.startAt)
            ),
            eq(doctorSessions.status, "requested"),
            eq(doctorSessions.status, "rescheduled"),
            eq(doctorSessions.status, "approved")
          )
        )
      );

    if (overlapping.length > 0) {
      throw new Error(
        "You already have a session that overlaps with this time"
      );
    }

    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();

    await context.db.insert(doctorSessions).values({
      id: sessionId,
      doctorId: input.doctorId,
      patientId,
      planId: plan.id,
      startAt: input.startAt,
      endAt: input.endAt,
      status: "requested",
      creditCost: 1,
      createdAt: now,
      updatedAt: now,
    });

    return {
      ok: true,
      sessionId,
    };
  });
