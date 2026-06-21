import {
  doctorProfiles,
  parseJsonApproachSteps,
  parseJsonStringArray,
} from "@suwa/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const doctorProfileRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const [profile] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, userId))
      .limit(1);
    const role = context.auth?.sessionClaims?.metadata?.role ?? "user";

    return {
      profile: profile
        ? {
            ...profile,
            specialties: parseJsonStringArray(profile.specialties),
            languages: parseJsonStringArray(profile.languages),
            consultationModes: parseJsonStringArray(profile.consultationModes),
            focusAreas: parseJsonStringArray(profile.focusAreas),
            approachSteps: parseJsonApproachSteps(profile.approachSteps),
            hasFaceEmbedding: !!profile.faceEmbeddingKvKey,
          }
        : null,
      role,
    };
  }
);
