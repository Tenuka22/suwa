import { doctorCredits, doctorCashoutRequests, doctorProfiles } from "@suwa/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const payoutStatusRoute = protectedProcedure
  .input(z.void())
  .handler(async ({ context }) => {
    const { userId } = await requireDoctor(context);

    const [credits] = await context.db
      .select()
      .from(doctorCredits)
      .where(eq(doctorCredits.doctorId, userId))
      .limit(1);

    const [profile] = await context.db
      .select({ payoutInfo: doctorProfiles.payoutInfo })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, userId))
      .limit(1);

    const cashoutRequests = await context.db
      .select()
      .from(doctorCashoutRequests)
      .where(eq(doctorCashoutRequests.doctorId, userId))
      .orderBy(desc(doctorCashoutRequests.createdAt))
      .limit(20);

    return {
      balanceCents: credits?.balanceCents ?? 0,
      totalEarnedCents: credits?.totalEarnedCents ?? 0,
      totalCashedOutCents: credits?.totalCashedOutCents ?? 0,
      hasPayoutInfo: !!profile?.payoutInfo,
      payoutInfo: profile?.payoutInfo ?? null,
      cashoutRequests,
    };
  });