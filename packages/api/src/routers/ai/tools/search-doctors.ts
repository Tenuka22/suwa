import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ClerkRequestContext } from "../../../context";

export function createSearchDoctorsTool(context: ClerkRequestContext) {
  return tool(
    async ({ query }: { query: string }) => {
      const { doctorProfiles } = await import("@suwa/db");
      const { or, like } = await import("drizzle-orm");
      const doctors = await context.db
        .select()
        .from(doctorProfiles)
        .where(
          or(
            like(doctorProfiles.displayName, `%${query}%`),
            like(doctorProfiles.specialties, `%${query}%`),
            like(doctorProfiles.headline, `%${query}%`),
            like(doctorProfiles.bio, `%${query}%`)
          )
        )
        .limit(10);
      return JSON.stringify(
        doctors.map((d) => ({
          id: d.userId,
          name: d.displayName,
          headline: d.headline,
          specialties: d.specialties,
        }))
      );
    },
    {
      name: "search_doctors",
      description: "Search doctors by name, specialty, or keywords",
      schema: z.object({ query: z.string() }),
    }
  );
}
