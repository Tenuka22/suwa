import { doctorPlans } from "@doca/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const planStatsRoute = protectedProcedure
  .input(z.void())
  .handler(async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);

    const plans = await context.db
      .select()
      .from(doctorPlans)
      .where(
        and(eq(doctorPlans.doctorId, doctorId), eq(doctorPlans.isActive, true))
      );

    const totalPlans = plans.length;

    if (totalPlans === 0) {
      return {
        totalPlans: 0,
        averagePriceCents: 0,
        averageDurationMinutes: 0,
        minPriceCents: 0,
        maxPriceCents: 0,
        minDurationMinutes: 0,
        maxDurationMinutes: 0,
        defaultPlanName: null,
      };
    }

    const prices = plans.map((p) => p.priceCents);
    const durations = plans.map((p) => p.durationMinutes);
    const defaultPlan = plans.find((p) => p.isDefault);

    return {
      totalPlans,
      averagePriceCents: Math.round(
        prices.reduce((a, b) => a + b, 0) / totalPlans
      ),
      averageDurationMinutes: Math.round(
        durations.reduce((a, b) => a + b, 0) / totalPlans
      ),
      minPriceCents: Math.min(...prices),
      maxPriceCents: Math.max(...prices),
      minDurationMinutes: Math.min(...durations),
      maxDurationMinutes: Math.max(...durations),
      defaultPlanName: defaultPlan?.name ?? null,
    };
  });
