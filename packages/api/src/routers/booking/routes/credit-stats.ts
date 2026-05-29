import { doctorCashoutRequests, doctorCredits } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const creditStatsRoute = protectedProcedure
  .input(z.void())
  .handler(async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);

    const [credits] = await context.db
      .select()
      .from(doctorCredits)
      .where(eq(doctorCredits.doctorId, doctorId))
      .limit(1);

    const cashoutRequests = await context.db
      .select()
      .from(doctorCashoutRequests)
      .where(eq(doctorCashoutRequests.doctorId, doctorId))
      .orderBy(doctorCashoutRequests.createdAt);

    // Pending cashout cents
    const pendingCashoutCents = cashoutRequests
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + r.amountCents, 0);

    // Monthly cashout trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString();

    const recentCashouts = cashoutRequests.filter(
      (r) => r.createdAt >= sixMonthsAgoStr && r.status === "completed"
    );

    const monthlyMap = new Map<string, number>();
    for (const req of recentCashouts) {
      const month = req.createdAt.slice(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + req.amountCents);
    }

    const monthlyCashouts = Array.from(monthlyMap.entries()).map(
      ([month, amount]) => ({ month, amount })
    );

    return {
      balanceCents: credits?.balanceCents ?? 0,
      totalEarnedCents: credits?.totalEarnedCents ?? 0,
      totalCashedOutCents: credits?.totalCashedOutCents ?? 0,
      pendingCashoutCents,
      cashoutCount: cashoutRequests.length,
      cashoutRequests,
      monthlyCashouts,
    };
  });
