import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ClerkRequestContext } from "../../../context";

export function createGetUpcomingSessionsTool(context: ClerkRequestContext) {
  return tool(
    async () => {
      const userId = context.auth?.userId;
      if (!userId) {
        return JSON.stringify({ error: "Authentication required" });
      }
      const { doctorPlans, doctorProfiles, doctorSessions } = (await import(
        "@suwa/db"
      )) as any;
      const { and, eq, gte } = (await import("drizzle-orm")) as any;
      const results = await context.db
        .select()
        .from(doctorSessions)
        .where(
          and(
            eq(doctorSessions.patientId, userId),
            gte(doctorSessions.startAt, new Date().toISOString())
          )
        )
        .limit(10);
      const enhanced = await Promise.all(
        results.map(async (session) => {
          const [doctor] = await context.db
            .select()
            .from(doctorProfiles)
            .where(eq(doctorProfiles.userId, session.doctorId))
            .limit(1);

          const [plan] = session.planId
            ? await context.db
                .select()
                .from(doctorPlans)
                .where(eq(doctorPlans.id, session.planId))
                .limit(1)
            : [null];

          return {
            ...session,
            doctor: doctor
              ? {
                  displayName: doctor.displayName,
                  headline: doctor.headline,
                  location: doctor.location,
                }
              : null,
            plan: plan
              ? {
                  durationMinutes: plan.durationMinutes,
                  name: plan.name,
                  priceCents: plan.priceCents,
                }
              : null,
          };
        })
      );
      return JSON.stringify(enhanced);
    },
    {
      name: "get_upcoming_sessions",
      description: "Get your upcoming appointments",
      schema: z.object({}).describe("No input needed"),
    }
  );
}
