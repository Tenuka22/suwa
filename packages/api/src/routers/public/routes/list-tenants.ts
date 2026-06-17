import { clinics, doctorHospitalAffiliations, tenants } from "@suwa/db";
import { inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../../../index";

export const listTenantsRoute = publicProcedure
  .input(
    z
      .object({
        tenantIds: z.array(z.string().min(1)).optional(),
      })
      .optional()
  )
  .handler(async ({ context, input }) => {
    const baseQuery = context.db
      .select()
      .from(tenants)
      .where(input?.tenantIds ? inArray(tenants.id, input.tenantIds) : sql`1=1`)
      .orderBy(tenants.name);

    const allTenants = await baseQuery;

    const parsedTenants = allTenants.map((t) => ({
      ...t,
      services: t.services ? (JSON.parse(t.services) as string[]) : [],
    }));

    const tenantIds = parsedTenants.map((t) => t.id);

    // Fetch clinics for all tenants
    const clinicsByTenant: Record<string, (typeof clinics.$inferSelect)[]> = {};
    if (tenantIds.length > 0) {
      const allClinics = await context.db
        .select()
        .from(clinics)
        .where(inArray(clinics.tenantId, tenantIds));

      for (const clinic of allClinics) {
        const group = clinicsByTenant[clinic.tenantId];
        if (group) {
          group.push(clinic);
        } else {
          clinicsByTenant[clinic.tenantId] = [clinic];
        }
      }
    }

    // Fetch active doctor counts per tenant
    const affCounts =
      tenantIds.length > 0
        ? await context.db
            .select({
              tenantId: doctorHospitalAffiliations.tenantId,
              count: sql<number>`COUNT(*)`,
            })
            .from(doctorHospitalAffiliations)
            .where(inArray(doctorHospitalAffiliations.tenantId, tenantIds))
            .groupBy(doctorHospitalAffiliations.tenantId)
        : [];

    const doctorCountByTenant: Record<string, number> = {};
    for (const row of affCounts) {
      doctorCountByTenant[row.tenantId] = Number(row.count);
    }

    return {
      tenants: parsedTenants.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        address: t.address,
        contactInfo: t.contactInfo,
        logo: t.logo,
        status: t.status,
        services: t.services,
        latitude: t.latitude,
        longitude: t.longitude,
        phone: t.phone,
        website: t.website,
        clinicCount: (clinicsByTenant[t.id] ?? []).length,
        doctorCount: doctorCountByTenant[t.id] ?? 0,
      })),
    };
  });
