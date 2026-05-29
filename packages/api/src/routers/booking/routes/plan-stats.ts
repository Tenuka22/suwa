import { doctorPlans } from "@zen-doc/db";
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
        averageCreditCost: 0,
        averageDurationMinutes: 0,
        minCreditCost: 0,
        maxCreditCost: 0,
        minDurationMinutes: 0,
        maxDurationMinutes: 0,
        defaultPlanName: null,
      };
    }

    const creditCosts = plans.map((p) => p.creditCost);
    const durations = plans.map((p) => p.durationMinutes);
    const defaultPlan = plans.find((p) => p.isDefault);

    return {
      totalPlans,
      averageCreditCost: Math.round(
        creditCosts.reduce((a, b) => a + b, 0) / totalPlans
      ),
      averageDurationMinutes: Math.round(
        durations.reduce((a, b) => a + b, 0) / totalPlans
      ),
      minCreditCost: Math.min(...creditCosts),
      maxCreditCost: Math.max(...creditCosts),
      minDurationMinutes: Math.min(...durations),
      maxDurationMinutes: Math.max(...durations),
      defaultPlanName: defaultPlan?.name ?? null,
    };
  });
