import {
  doctorFiles,
  doctorHospitalAffiliations,
  doctorProfiles,
  doctorWeeklyAvailability,
  parseJsonApproachSteps,
  parseJsonStringArray,
  tenants,
} from "@suwa/db";
import { listDoctorsInputSchema } from "@suwa/db/schemas-types";
import { and, count, desc, eq, inArray } from "drizzle-orm";
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

export const listDoctorsRoute = publicProcedure
  .input(listDoctorsInputSchema)
  .handler(async ({ context, input }) => {
    const profiles = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.permanent, true))
      .orderBy(desc(doctorProfiles.createdAt));

    const rawSearch = input.search.toLowerCase().trim();
    const searchTerms = rawSearch ? rawSearch.split(/\s+/) : [];
    const filteredProfiles =
      searchTerms.length > 0
        ? profiles.filter((profile) => {
            const haystack = [
              profile.displayName,
              profile.headline,
              profile.location,
              profile.specialties,
              profile.languages,
              profile.focusAreas,
            ]
              .filter((value): value is string => typeof value === "string")
              .join(" ")
              .toLowerCase();

            return searchTerms.every((term) => haystack.includes(term));
          })
        : profiles;

    const offset = (input.page - 1) * input.pageSize;
    const pageItems = filteredProfiles.slice(offset, offset + input.pageSize);

    const doctorIds = pageItems.map((p) => p.userId);
    const affiliations =
      doctorIds.length > 0
        ? await context.db
            .select({
              doctorId: doctorHospitalAffiliations.doctorId,
              tenantId: doctorHospitalAffiliations.tenantId,
              tenantName: tenants.name,
              tenantType: tenants.type,
            })
            .from(doctorHospitalAffiliations)
            .innerJoin(
              tenants,
              eq(doctorHospitalAffiliations.tenantId, tenants.id)
            )
            .where(
              and(
                inArray(doctorHospitalAffiliations.doctorId, doctorIds),
                eq(doctorHospitalAffiliations.status, "ACTIVE")
              )
            )
        : [];

    const affiliationsByDoctor: Record<
      string,
      { tenantId: string; tenantName: string; tenantType: string }[]
    > = {};
    for (const aff of affiliations) {
      const group = affiliationsByDoctor[aff.doctorId];
      if (group) {
        group.push({
          tenantId: aff.tenantId,
          tenantName: aff.tenantName,
          tenantType: aff.tenantType,
        });
      } else {
        affiliationsByDoctor[aff.doctorId] = [
          {
            tenantId: aff.tenantId,
            tenantName: aff.tenantName,
            tenantType: aff.tenantType,
          },
        ];
      }
    }

    const doctors = await Promise.all(
      pageItems.map(async (profile) => {
        const [portrait] = await context.db
          .select()
          .from(doctorFiles)
          .where(eq(doctorFiles.doctorId, profile.userId))
          .limit(1);

        const [availabilityCount] = await context.db
          .select({ value: count() })
          .from(doctorWeeklyAvailability)
          .where(eq(doctorWeeklyAvailability.doctorId, profile.userId));

        return {
          profile: mapDoctorProfile(profile),
          portrait: portrait ?? null,
          hasAvailability: (availabilityCount?.value ?? 0) > 0,
          affiliations: affiliationsByDoctor[profile.userId] ?? [],
        };
      })
    );

    return {
      doctors,
      page: input.page,
      pageSize: input.pageSize,
      total: filteredProfiles.length,
      hasMore: offset + input.pageSize < filteredProfiles.length,
    };
  });
