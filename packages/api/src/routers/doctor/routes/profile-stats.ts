import { doctorFiles, doctorProfiles } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const OPTIONAL_FIELDS = [
  "displayName",
  "headline",
  "bio",
  "licenseNumber",
  "location",
  "placeName",
  "education",
  "specialties",
  "languages",
  "consultationModes",
  "focusAreas",
  "approach",
  "experienceStartYear",
] as const;

export const profileStatsRoute = protectedProcedure
  .input(z.void())
  .handler(async ({ context }) => {
    const { userId } = requireAuth(context);

    const [profile] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, userId))
      .limit(1);

    const files = await context.db
      .select()
      .from(doctorFiles)
      .where(eq(doctorFiles.doctorId, userId));

    const fileCountByKind: Record<string, number> = {};
    for (const file of files) {
      fileCountByKind[file.fileKind] =
        (fileCountByKind[file.fileKind] ?? 0) + 1;
    }

    let completenessPercentage = 0;
    if (profile) {
      let filled = 0;
      for (const field of OPTIONAL_FIELDS) {
        const value = profile[field as keyof typeof profile];
        if (value !== null && value !== undefined && value !== "") {
          const strVal = String(value);
          if (strVal !== "[]" && strVal !== "null" && strVal.length > 0) {
            filled++;
          }
        }
      }
      completenessPercentage = Math.round(
        (filled / OPTIONAL_FIELDS.length) * 100
      );
    }

    let specialtyCount = 0;
    let languageCount = 0;
    if (profile) {
      try {
        const specialties = JSON.parse(profile.specialties ?? "[]") as string[];
        specialtyCount = specialties.length;
      } catch {
        specialtyCount = 0;
      }
      try {
        const languages = JSON.parse(profile.languages ?? "[]") as string[];
        languageCount = languages.length;
      } catch {
        languageCount = 0;
      }
    }

    const accountAgeDays = profile
      ? Math.floor(
          (Date.now() - new Date(profile.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    return {
      profileExists: !!profile,
      isPermanent: profile?.permanent ?? false,
      completenessPercentage,
      fileCount: files.length,
      fileCountByKind,
      specialtyCount,
      languageCount,
      accountAgeDays,
    };
  });
