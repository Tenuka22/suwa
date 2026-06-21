import { faker } from "@faker-js/faker";
import type { createDb } from "@suwa/db";
import {
  clinicAttendance,
  clinics as clinicsTable,
  doctorHospitalAffiliations,
  doctorHospitalInvitations,
  hospitalAttendanceEvents,
  hospitalAvailabilityOverrides,
  tenantAdmins,
  tenantAuditLogs,
  tenantNotifications,
  tenants,
} from "@suwa/db";
import { buildHospitalSpecs, type HospitalSpec } from "../data-specs/hospitals";

export interface TenantSeedResult {
  affiliations: number;
  attendanceEvents: number;
  auditLogs: number;
  clinics: number;
  hospitals: number;
  invitations: number;
  notifications: number;
  overrides: number;
}

export async function seedTenants(
  db: ReturnType<typeof createDb>,
  doctorIds: string[]
): Promise<TenantSeedResult> {
  // Clean slate for all tenant data
  await db.delete(clinicAttendance);
  await db.delete(clinicsTable);
  await db.delete(tenantAuditLogs);
  await db.delete(tenantNotifications);
  await db.delete(hospitalAvailabilityOverrides);
  await db.delete(hospitalAttendanceEvents);
  await db.delete(doctorHospitalInvitations);
  await db.delete(doctorHospitalAffiliations);
  await db.delete(tenantAdmins);
  await db.delete(tenants);

  const now = new Date().toISOString();

  let placesData: import("../data-specs/hospitals").PlacesDataEntry[] = [];
  try {
    const placesModule = await import("../../../map-scraper/places_data.json", {
      with: { type: "json" },
    });
    placesData =
      placesModule.default as import("../data-specs/hospitals").PlacesDataEntry[];
  } catch {
    // places_data.json not available in this environment — skip tenant seeding
  }

  const hospitalSpecs = buildHospitalSpecs(placesData);
  const count = Math.min(doctorIds.length, hospitalSpecs.length);
  let clinicCount = 0;
  let affiliationCount = 0;
  let invitationCount = 0;
  let attendanceCount = 0;
  let overrideCount = 0;
  let auditCount = 0;
  let notificationCount = 0;

  for (let i = 0; i < count; i++) {
    const spec: HospitalSpec = hospitalSpecs[i]!;
    const tenantId = crypto.randomUUID();
    const creatorId = doctorIds[i % doctorIds.length]!;

    await db.insert(tenants).values({
      id: tenantId,
      name: spec.name,
      type: spec.type,
      address: spec.address,
      contactInfo: spec.phone,
      logo: null,
      status: "ACTIVE",
      services: JSON.stringify(spec.services),
      latitude: spec.latitude.toString(),
      longitude: spec.longitude.toString(),
      phone: spec.phone,
      website: spec.website,
      placeDataRef: spec.name,
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now,
    });

    // Clinics
    for (const clinic of spec.clinics) {
      await db.insert(clinicsTable).values({
        id: crypto.randomUUID(),
        tenantId,
        name: clinic.name,
        specialization: clinic.specialization,
        schedule: JSON.stringify({
          weekdays: "9:00 AM - 5:00 PM",
          saturday: "10:00 AM - 2:00 PM",
          sunday: "Closed",
        }),
        createdAt: now,
        updatedAt: now,
      });
      clinicCount++;
    }

    // Tenant admin (first available doctor)
    const adminDoc = doctorIds[i % doctorIds.length]!;
    await db.insert(tenantAdmins).values({
      id: crypto.randomUUID(),
      tenantId,
      userId: adminDoc,
      createdAt: now,
    });

    // Affiliations for all doctors
    for (const doctorId of doctorIds) {
      const affStatus = ["ACTIVE", "ACTIVE", "ACTIVE", "PENDING", "INACTIVE"];
      await db.insert(doctorHospitalAffiliations).values({
        id: crypto.randomUUID(),
        doctorId,
        tenantId,
        status: faker.helpers.arrayElement(affStatus) as
          | "ACTIVE"
          | "PENDING"
          | "INACTIVE",
        availabilityWindows: JSON.stringify([
          { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
        ]),
        createdAt: now,
        updatedAt: now,
      });
      affiliationCount++;

      // Invitations
      if (faker.datatype.boolean(0.6)) {
        const inviter = faker.helpers.arrayElement(
          doctorIds.filter((id) => id !== doctorId)
        )!;
        await db.insert(doctorHospitalInvitations).values({
          id: crypto.randomUUID(),
          tenantId,
          doctorId,
          invitedBy: inviter,
          status: faker.helpers.arrayElement([
            "PENDING",
            "ACCEPTED",
            "DECLINED",
          ]) as "PENDING" | "ACCEPTED" | "DECLINED",
          message: faker.helpers.arrayElement([
            "We would love to have you join our team.",
            "Your expertise would be valuable at our facility.",
            "Invitation to collaborate with our medical staff.",
          ]),
          createdAt: now,
          updatedAt: now,
        });
        invitationCount++;
      }

      // Hospital attendance events
      if (faker.datatype.boolean(0.5)) {
        await db.insert(hospitalAttendanceEvents).values({
          id: crypto.randomUUID(),
          doctorId,
          tenantId,
          clinicId: null,
          timestamp: faker.date.recent({ days: 14 }).toISOString(),
          eventType: faker.helpers.arrayElement([
            "CHECKED_IN",
            "CHECKED_OUT",
            "RETURNED",
          ]) as "CHECKED_IN" | "CHECKED_OUT" | "RETURNED",
          note: null,
          recordedBy: doctorId,
          createdAt: now,
          updatedAt: now,
        });
        attendanceCount++;
      }

      // Availability overrides
      if (faker.datatype.boolean(0.3)) {
        const startDate = faker.date.soon({ days: 30 });
        const endDate = new Date(startDate);
        endDate.setDate(
          endDate.getDate() + faker.number.int({ min: 1, max: 5 })
        );
        await db.insert(hospitalAvailabilityOverrides).values({
          id: crypto.randomUUID(),
          doctorId,
          tenantId,
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
          reason: faker.helpers.arrayElement([
            "Vacation",
            "Conference",
            "Medical leave",
            "Training",
          ]),
          createdAt: now,
          updatedAt: now,
        });
        overrideCount++;
      }
    }

    // Audit logs
    const logCount = faker.number.int({ min: 2, max: 5 });
    for (let l = 0; l < logCount; l++) {
      await db.insert(tenantAuditLogs).values({
        id: crypto.randomUUID(),
        tenantId,
        actorId: faker.helpers.arrayElement(doctorIds)!,
        action: faker.helpers.arrayElement([
          "update_profile",
          "invite_doctor",
          "update_settings",
          "manage_clinics",
        ]),
        entityType: faker.helpers.arrayElement([
          "tenant",
          "clinic",
          "affiliation",
          "invitation",
        ]),
        entityId: crypto.randomUUID(),
        details: JSON.stringify({ description: faker.lorem.sentence() }),
        createdAt: now,
      });
      auditCount++;
    }

    // Notifications
    for (const doctorId of doctorIds) {
      if (faker.datatype.boolean(0.5)) {
        await db.insert(tenantNotifications).values({
          id: crypto.randomUUID(),
          userId: doctorId,
          type: faker.helpers.arrayElement([
            "HOSPITAL_INVITATION",
            "ATTENDANCE_MARKED",
            "AFFILIATION_STATUS",
          ]) as
            | "HOSPITAL_INVITATION"
            | "ATTENDANCE_MARKED"
            | "AFFILIATION_STATUS",
          title: faker.helpers.arrayElement([
            "New hospital invitation",
            "Attendance recorded",
            "Affiliation updated",
          ]),
          message: faker.lorem.sentence(),
          entityId: tenantId,
          isRead: faker.datatype.boolean(0.3),
          createdAt: now,
        });
        notificationCount++;
      }
    }
  }

  // Clinic attendance (use the ids we just created)
  const clinicIds = (
    await db.select({ value: clinicsTable.id }).from(clinicsTable)
  ).map((r) => r.value);
  for (const cid of clinicIds) {
    const docId = faker.helpers.arrayElement(doctorIds)!;
    if (faker.datatype.boolean(0.5)) {
      const rawDate = faker.date.recent({ days: 14 });
      const dateStr = rawDate.toISOString().slice(0, 10);
      const arrivedAt = new Date(rawDate);
      arrivedAt.setHours(9, 0, 0, 0);
      const leftAt = new Date(rawDate);
      leftAt.setHours(17, 0, 0, 0);
      await db.insert(clinicAttendance).values({
        id: crypto.randomUUID(),
        clinicId: cid,
        doctorId: docId,
        date: dateStr,
        arrivedAt: arrivedAt.toISOString(),
        leftAt: leftAt.toISOString(),
        recordedBy: docId,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return {
    hospitals: count,
    clinics: clinicCount,
    affiliations: affiliationCount,
    invitations: invitationCount,
    attendanceEvents: attendanceCount,
    overrides: overrideCount,
    auditLogs: auditCount,
    notifications: notificationCount,
  };
}
