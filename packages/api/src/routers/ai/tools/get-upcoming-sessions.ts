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
      const { doctorSessions } = await import("@suwa/db");
      const { and, gte, eq } = await import("drizzle-orm");
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
      return JSON.stringify(results);
    },
    {
      name: "get_upcoming_sessions",
      description: "Get your upcoming appointments",
      schema: z.object({}).describe("No input needed"),
    }
  );
}
