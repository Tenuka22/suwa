import {
  doctorEducationEntries,
  doctorFiles,
  doctorProfiles,
  parseJsonApproachSteps,
  parseJsonStringArray,
} from "@zen-doc/db";
import { eq } from "drizzle-orm";
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

    return {
      profile: mapDoctorProfile(profile),
      portrait: portrait ?? null,
      files,
      education,
    };
  });
