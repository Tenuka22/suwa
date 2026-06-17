import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ClerkRequestContext } from "../../../context";

export function createGetDoctorProfileTool(context: ClerkRequestContext) {
  return tool(
    async ({ doctorId }: { doctorId: string }) => {
      const { doctorProfiles } = await import("@suwa/db");
      const { eq } = await import("drizzle-orm");
      const [doctor] = await context.db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.userId, doctorId))
        .limit(1);
      if (!doctor) {
        return JSON.stringify({ error: "Doctor not found" });
      }
      return JSON.stringify({
        id: doctor.userId,
        name: doctor.displayName,
        headline: doctor.headline,
        bio: doctor.bio,
        specialties: doctor.specialties,
        location: doctor.location,
      });
    },
    {
      name: "get_doctor_profile",
      description: "Get detailed profile for a doctor",
      schema: z.object({ doctorId: z.string() }),
    }
  );
}
