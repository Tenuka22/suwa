import { doctorSessions } from "@zen-doc/db";
import { and, asc, count, desc, eq, gt, gte, sum } from "drizzle-orm";
import { z } from "zod";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const doctorStatsRoute = protectedProcedure
  .input(z.void())
  .handler(async ({ context }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const [totalSessionsResult] = await context.db
      .select({ value: count() })
      .from(doctorSessions)
      .where(eq(doctorSessions.doctorId, doctorId));

    const [totalEarnedCentsResult] = await context.db
      .select({ value: sum(doctorSessions.doctorEarnedCents) })
      .from(doctorSessions)
      .where(eq(doctorSessions.doctorId, doctorId));

    const now = new Date().toISOString();
    const [upcomingSessionsResult] = await context.db
      .select({ value: count() })
      .from(doctorSessions)
      .where(
        and(
          eq(doctorSessions.doctorId, doctorId),
          eq(doctorSessions.status, "approved"),
          gt(doctorSessions.startAt, now)
        )
      );

    const recentSessions = await context.db
      .select({
        id: doctorSessions.id,
        startAt: doctorSessions.startAt,
        endAt: doctorSessions.endAt,
        status: doctorSessions.status,
        patientId: doctorSessions.patientId,
        doctorEarnedCents: doctorSessions.doctorEarnedCents,
      })
      .from(doctorSessions)
      .where(eq(doctorSessions.doctorId, doctorId))
      .orderBy(desc(doctorSessions.startAt))
      .limit(5);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString();

    const sessions = await context.db
      .select({
        startAt: doctorSessions.startAt,
        doctorEarnedCents: doctorSessions.doctorEarnedCents,
      })
      .from(doctorSessions)
      .where(
        and(
          eq(doctorSessions.doctorId, doctorId),
          gte(doctorSessions.startAt, sixMonthsAgoStr)
        )
      )
      .orderBy(asc(doctorSessions.startAt));

    const monthlyMap = new Map<string, number>();
    for (const session of sessions) {
      const month = session.startAt.slice(0, 7);
      monthlyMap.set(
        month,
        (monthlyMap.get(month) ?? 0) + Number(session.doctorEarnedCents ?? 0)
      );
    }

    const monthlyEarnings = Array.from(monthlyMap.entries()).map(
      ([month, earnings]) => ({ month, earnings })
    );

    return {
      totalSessions: totalSessionsResult?.value ?? 0,
      totalEarnedCents: totalEarnedCentsResult?.value ?? 0,
      upcomingSessions: upcomingSessionsResult?.value ?? 0,
      recentSessions,
      monthlyEarnings,
    };
  });
