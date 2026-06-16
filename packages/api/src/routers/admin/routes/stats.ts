import { doctorProfiles, doctorSessions, patientProfiles } from "@doca/db";
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
        day: sql<string>`substr(created_at, 1, 10)`,
        count: count(),
      })
      .from(doctorSessions)
      .groupBy(sql`substr(created_at, 1, 10)`)
      .orderBy(sql`substr(created_at, 1, 10) DESC`)
      .limit(7);

    return {
      pendingDoctors: pendingDoctorsCount?.value ?? 0,
      approvedDoctors: approvedDoctorsCount?.value ?? 0,
      totalSessions: totalSessionsCount?.value ?? 0,
      totalPatients: totalPatientsCount?.value ?? 0,
      sessionsByDay: sessionsByDay.reverse(),
    };
  });
