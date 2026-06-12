import type { DoctorProfile } from "@zen-doc/db";
import {
  doctorEducationEntries,
  doctorPlans,
  doctorProfiles,
  parseJsonApproachSteps,
  parseJsonStringArray,
  stringifyJsonApproachSteps,
  stringifyJsonStringArray,
} from "@zen-doc/db";
import { doctorProfileInputSchema } from "@zen-doc/db/schemas-types";
import {
  BASIC_PLAN_CREDITS,
  BASIC_PLAN_DURATION_MINUTES,
  BASIC_PLAN_FEATURES,
  BASIC_PLAN_NAME,
} from "@zen-doc/pricing";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const saveDoctorProfileRoute = protectedProcedure
  .input(doctorProfileInputSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const currentRole = context.auth?.sessionClaims?.metadata?.role;
    const nextRole =
      currentRole === "admin" || currentRole === "doctor"
        ? currentRole
        : "pending-doctor";
    const timestamp = new Date().toISOString();
    const [existingProfile] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, userId))
      .limit(1);

    const profile: DoctorProfile = {
      userId,
      displayName: input.displayName ?? existingProfile?.displayName ?? null,
      headline: input.headline ?? existingProfile?.headline ?? null,
      bio: input.bio ?? null,
      licenseNumber: input.licenseNumber ?? null,
      location: input.location ?? existingProfile?.location ?? null,
      placeName: input.placeName ?? existingProfile?.placeName ?? null,
      placeAddress: input.placeAddress ?? existingProfile?.placeAddress ?? null,
      placeDescription:
        input.placeDescription ?? existingProfile?.placeDescription ?? null,
      experienceStartYear:
        input.experienceStartYear ??
        existingProfile?.experienceStartYear ??
        null,
      specialties: stringifyJsonStringArray(
        input.specialties ?? parseJsonStringArray(existingProfile?.specialties)
      ),
      languages: stringifyJsonStringArray(
        input.languages ?? parseJsonStringArray(existingProfile?.languages)
      ),
      consultationModes: stringifyJsonStringArray(
        input.consultationModes ??
          parseJsonStringArray(existingProfile?.consultationModes)
      ),
      focusAreas: stringifyJsonStringArray(
        input.focusAreas ?? parseJsonStringArray(existingProfile?.focusAreas)
      ),
      approachSteps: stringifyJsonApproachSteps(
        input.approachSteps ??
          parseJsonApproachSteps(existingProfile?.approachSteps)
      ),
      approach: input.approach ?? existingProfile?.approach ?? null,
      education: input.education ?? existingProfile?.education ?? null,
      permanent: existingProfile?.permanent ?? false,
      stripeAccountId: existingProfile?.stripeAccountId ?? null,
      stripeAccountEnabled: existingProfile?.stripeAccountEnabled ?? false,
      createdAt: existingProfile?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    await context.db.insert(doctorProfiles).values(profile).onConflictDoUpdate({
      target: doctorProfiles.userId,
      set: profile,
    });

    if (input.educationEntries) {
      await context.db
        .delete(doctorEducationEntries)
        .where(eq(doctorEducationEntries.doctorId, userId));
      if (input.educationEntries.length > 0) {
        await context.db.insert(doctorEducationEntries).values(
          input.educationEntries.map((entry) => ({
            id: entry.id,
            doctorId: userId,
            institution: entry.institution,
            degree: entry.degree,
            year: entry.year ?? null,
            createdAt: timestamp,
            updatedAt: timestamp,
          }))
        );
      }
    }

    const [existingPlan] = await context.db
      .select()
      .from(doctorPlans)
      .where(
        and(
          eq(doctorPlans.doctorId, userId),
          eq(doctorPlans.isDefault, true),
          eq(doctorPlans.isActive, true)
        )
      )
      .limit(1);

    if (!existingPlan) {
      const now = new Date().toISOString();
      await context.db.insert(doctorPlans).values({
        id: crypto.randomUUID(),
        doctorId: userId,
        name: BASIC_PLAN_NAME,
        description: "Standard consultation session",
        creditCost: BASIC_PLAN_CREDITS,
        durationMinutes: BASIC_PLAN_DURATION_MINUTES,
        features: JSON.stringify(BASIC_PLAN_FEATURES),
        isActive: true,
        isDefault: true,
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { ok: true, role: nextRole, profile };
  });
