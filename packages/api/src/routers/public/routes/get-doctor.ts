import {
  doctorEducationEntries,
  doctorFiles,
  doctorHospitalAffiliations,
  doctorProfiles,
  doctorWeeklyAvailability,
  parseJsonApproachSteps,
  parseJsonStringArray,
  tenants,
} from "@suwa/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../../../index";

function mapDoctorProfile(profile: typeof doctorProfiles.$inferSelect) {
  return {
    ...profile,
    specialties: parseJsonStringArray(profile.specialties),
    languages: parseJsonStringArray(profile.languages),
    consultationModes: parseJsonStringArray(profile.consultationModes),
    focusAreas: parseJsonStringArray(profile.focusAreas),
    approachSteps: parseJsonApproachSteps(profile.approachSteps),
  };
}

export const getDoctorRoute = publicProcedure
  .input(z.object({ doctorId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const [profile] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, input.doctorId))
      .limit(1);

    if (!profile) {
      return null;
    }

    const [portrait] = await context.db
      .select()
      .from(doctorFiles)
      .where(eq(doctorFiles.doctorId, profile.userId))
      .limit(1);

    const files = await context.db
      .select()
      .from(doctorFiles)
      .where(eq(doctorFiles.doctorId, profile.userId));

    const education = await context.db
      .select()
      .from(doctorEducationEntries)
      .where(eq(doctorEducationEntries.doctorId, profile.userId));

    const weeklyAvailability = await context.db
      .select()
      .from(doctorWeeklyAvailability)
      .where(eq(doctorWeeklyAvailability.doctorId, profile.userId));

    const rawAffiliations = await context.db
      .select({
        id: doctorHospitalAffiliations.id,
        doctorId: doctorHospitalAffiliations.doctorId,
        tenantId: doctorHospitalAffiliations.tenantId,
        tenantName: tenants.name,
        tenantAddress: tenants.address,
        tenantLatitude: tenants.latitude,
        tenantLongitude: tenants.longitude,
        availabilityWindows: doctorHospitalAffiliations.availabilityWindows,
        status: doctorHospitalAffiliations.status,
      })
      .from(doctorHospitalAffiliations)
      .innerJoin(
        tenants,
        eq(doctorHospitalAffiliations.tenantId, tenants.id)
      )
      .where(
        and(
          eq(doctorHospitalAffiliations.doctorId, profile.userId),
          eq(doctorHospitalAffiliations.status, "ACTIVE")
        )
      );

    const affiliations = rawAffiliations.map((aff) => ({
      ...aff,
      availabilityWindows: aff.availabilityWindows
        ? (JSON.parse(aff.availabilityWindows) as Array<{
            dayOfWeek: number;
            startTime: string;
            endTime: string;
          }>)
        : [],
    }));

    return {
      profile: mapDoctorProfile(profile),
      portrait: portrait ?? null,
      portraitKey: profile.portraitKey ?? null,
      files,
      education,
      weeklyAvailability,
      affiliations,
    };
  });
