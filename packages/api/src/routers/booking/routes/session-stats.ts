import { doctorSessions } from "@suwa/db";
import { and, asc, count, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const sessionStatsRoute = protectedProcedure
  .input(z.void())
  .handler(async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);

    const statusCounts = await context.db
      .select({
        status: doctorSessions.status,
        value: count(),
      })
      .from(doctorSessions)
      .where(eq(doctorSessions.doctorId, doctorId))
      .groupBy(doctorSessions.status);

    const totalSessions = statusCounts.reduce((sum, row) => sum + row.value, 0);

    const sessionsByStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      sessionsByStatus[row.status] = row.value;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todaySessionsResult] = await context.db
      .select({ value: count() })
      .from(doctorSessions)
      .where(
        and(
          eq(doctorSessions.doctorId, doctorId),
          gte(doctorSessions.startAt, todayStart.toISOString()),
          lte(doctorSessions.startAt, todayEnd.toISOString())
        )
      );

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString();

    const sessions = await context.db
      .select({
        startAt: doctorSessions.startAt,
        status: doctorSessions.status,
      })
      .from(doctorSessions)
      .where(
        and(
          eq(doctorSessions.doctorId, doctorId),
          gte(doctorSessions.startAt, sixMonthsAgoStr)
        )
      )
      .orderBy(asc(doctorSessions.startAt));

    const monthlyMap = new Map<string, Record<string, number>>();
    for (const session of sessions) {
      const month = session.startAt.slice(0, 7);
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {});
      }
      const statusMap = monthlyMap.get(month)!;
      statusMap[session.status] = (statusMap[session.status] ?? 0) + 1;
    }

    const monthlySessions = Array.from(monthlyMap.entries()).map(
      ([month, statuses]) => ({
        month,
        ...statuses,
        total: Object.values(statuses).reduce((a, b) => a + b, 0),
      })
    );

    const recentSessions = await context.db
      .select({
        id: doctorSessions.id,
        startAt: doctorSessions.startAt,
        endAt: doctorSessions.endAt,
        status: doctorSessions.status,
        patientId: doctorSessions.patientId,
        doctorEarnedCents: doctorSessions.doctorEarnedCents,
        createdAt: doctorSessions.createdAt,
      })
      .from(doctorSessions)
      .where(eq(doctorSessions.doctorId, doctorId))
      .orderBy(desc(doctorSessions.startAt))
      .limit(10);

    return {
      totalSessions,
      sessionsByStatus,
      todaySessions: todaySessionsResult?.value ?? 0,
      monthlySessions,
      recentSessions,
    };
  });
