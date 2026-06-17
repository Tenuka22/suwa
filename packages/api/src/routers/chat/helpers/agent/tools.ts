import { doctorProfiles } from "@suwa/db";
import { tool } from "@langchain/core/tools";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ClerkRequestContext } from "../../../../context";

export function createDoctorTools(context: ClerkRequestContext) {
  const searchDoctors = tool(
    async ({ query, limit }) => {
      const doctors = await context.db
        .select()
        .from(doctorProfiles)
        .limit(limit);
      const results = doctors.filter((doc) => {
        const searchText =
          `${doc.displayName} ${doc.headline} ${doc.bio} ${doc.specialties}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });
      return JSON.stringify(
        results.map((doc) => ({
          id: doc.userId,
          name: doc.displayName,
          headline: doc.headline,
          specialties: doc.specialties,
          location: doc.location,
        }))
      );
    },
    {
      name: "search_doctors",
      description: "Search for doctors by specialty, name, or keywords",
      schema: z.object({
        query: z.string().describe("Search query for doctors"),
        limit: z.number().default(5).describe("Max results"),
      }),
    }
  );

  const getDoctorProfile = tool(
    async ({ doctorId }) => {
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
        languages: doctor.languages,
        location: doctor.location,
        placeAddress: doctor.placeAddress,
        consultationModes: doctor.consultationModes,
        experience: doctor.experienceStartYear,
        approach: doctor.approach,
      });
    },
    {
      name: "get_doctor_profile",
      description: "Get detailed profile information for a specific doctor",
      schema: z.object({
        doctorId: z.string().describe("The doctor user ID"),
      }),
    }
  );

  const getDoctorsWithSpecialty = tool(
    async ({ specialty }) => {
      const doctors = await context.db.select().from(doctorProfiles).limit(10);
      const filtered = doctors.filter((doc) =>
        doc.specialties?.toLowerCase().includes(specialty.toLowerCase())
      );
      return JSON.stringify(
        filtered.map((doc) => ({
          id: doc.userId,
          name: doc.displayName,
          headline: doc.headline,
          location: doc.location,
        }))
      );
    },
    {
      name: "get_doctors_with_specialty",
      description: "Get doctors by specific specialty",
      schema: z.object({
        specialty: z.string().describe("The specialty to search for"),
      }),
    }
  );

  return [searchDoctors, getDoctorProfile, getDoctorsWithSpecialty];
}
