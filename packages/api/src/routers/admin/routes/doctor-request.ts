import { doctorProfiles } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDoctorInfo, mapDoctorProfile, requireAdmin } from "../../../hooks";
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

function computeCompleteness(profile: Record<string, unknown>): number {
  let filled = 0;
  for (const field of OPTIONAL_FIELDS) {
    const value = profile[field];
    if (value !== null && value !== undefined && value !== "") {
      const strVal = String(value);
      if (strVal !== "[]" && strVal !== "null" && strVal.length > 0) {
        filled++;
      }
    }
  }
  return Math.round((filled / OPTIONAL_FIELDS.length) * 100);
}

export const adminDoctorRequestRoute = protectedProcedure
  .input(z.object({ userId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    requireAdmin(context);

    const [profile] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, input.userId))
      .limit(1);

    if (!profile || profile.permanent) {
      throw new Error("Doctor request not found");
    }

    const info = await getDoctorInfo(context.db, profile);
    const mappedProfile = mapDoctorProfile(profile);
    const embeddingObject = profile.faceEmbeddingKvKey
      ? await context.faceEmbeddingsBucket.get(profile.faceEmbeddingKvKey)
      : null;
    const embeddingRaw = embeddingObject ? await embeddingObject.text() : null;
    const embedding = embeddingRaw ? (JSON.parse(embeddingRaw) as number[]) : [];

    return {
      ...info,
      ...mappedProfile,
      completeness: computeCompleteness(profile as Record<string, unknown>),
      faceEmbeddingDimension: embedding.length,
      faceEmbeddingKvKey: profile.faceEmbeddingKvKey,
      faceEmbeddingPreview: embedding.slice(0, 96),
      hasFaceEmbedding: Boolean(profile.faceEmbeddingKvKey),
    };
  });
