import {
  clinics,
  doctorHospitalAffiliations,
  doctorProfiles,
  tenants,
} from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../../../index";

export const getTenantDetailRoute = publicProcedure
  .input(z.object({ tenantId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const [tenant] = await context.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, input.tenantId))
      .limit(1);

    if (!tenant) {
      return null;
    }

    const allClinics = await context.db
      .select()
      .from(clinics)
      .where(eq(clinics.tenantId, input.tenantId));

    const affiliations = await context.db
      .select()
      .from(doctorHospitalAffiliations)
      .where(eq(doctorHospitalAffiliations.tenantId, input.tenantId));

    const doctorIds = affiliations.map((a) => a.doctorId);

    // Fetch doctor profiles for affiliated doctors
    const doctors =
      doctorIds.length > 0
        ? await context.db
            .select({
              userId: doctorProfiles.userId,
              displayName: doctorProfiles.displayName,
              headline: doctorProfiles.headline,
              specialties: doctorProfiles.specialties,
            })
            .from(doctorProfiles)
            .where(eq(doctorProfiles.permanent, true))
        : [];

    const doctorsMap = new Map(doctors.map((d) => [d.userId, d]));

    return {
      tenant: {
        ...tenant,
        services: tenant.services
          ? (JSON.parse(tenant.services) as string[])
          : [],
      },
      clinics: allClinics,
      affiliatedDoctors: affiliations.map((aff) => {
        const doc = doctorsMap.get(aff.doctorId);
        return {
          affiliationId: aff.id,
          doctorId: aff.doctorId,
          status: aff.status,
          availabilityWindows: aff.availabilityWindows
            ? (JSON.parse(aff.availabilityWindows) as Array<{
                dayOfWeek: number;
                startTime: string;
                endTime: string;
              }>)
            : [],
          profile: {
            displayName: doc?.displayName ?? "Unknown Doctor",
            headline: doc?.headline ?? null,
            specialties: doc?.specialties
              ? (JSON.parse(doc.specialties) as string[])
              : [],
          },
        };
      }),
    };
  });
