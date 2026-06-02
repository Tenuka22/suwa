import { doctorProfiles, doctorSessions, patientProfiles } from "@zen-doc/db";
import { count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const adminStatsRoute = protectedProcedure
  .input(z.void())
  .handler(async ({ context }) => {
    requireAdmin(context);

    const [pendingDoctorsCount] = await context.db
      .select({ value: count() })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.permanent, false));

    const [approvedDoctorsCount] = await context.db
      .select({ value: count() })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.permanent, true));

    const [totalSessionsCount] = await context.db
      .select({ value: count() })
      .from(doctorSessions);

    const [totalPatientsCount] = await context.db
      .select({ value: count() })
      .from(patientProfiles);

    const sessionsByDay = await context.db
      .select({
        day: sql<string>`strftime('%Y-%m-%d', datetime(created_at, 'unixepoch'))`,
        count: count(),
      })
      .from(doctorSessions)
      .groupBy(sql`strftime('%Y-%m-%d', datetime(created_at, 'unixepoch'))`)
      .orderBy(
        sql`strftime('%Y-%m-%d', datetime(created_at, 'unixepoch')) DESC`
      )
      .limit(7);

    return {
      pendingDoctors: pendingDoctorsCount?.value ?? 0,
      approvedDoctors: approvedDoctorsCount?.value ?? 0,
      totalSessions: totalSessionsCount?.value ?? 0,
      totalPatients: totalPatientsCount?.value ?? 0,
      sessionsByDay: sessionsByDay.reverse(),
    };
  });
