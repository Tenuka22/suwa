import { faker } from "@faker-js/faker";
import type { createDb } from "@zen-doc/db";
import {
  clinicAttendance,
  clinics,
  doctorHospitalAffiliations,
  doctorHospitalInvitations,
  hospitalAttendanceEvents,
  hospitalAvailabilityOverrides,
  tenantAdmins,
  tenantAuditLogs,
  tenantNotifications,
  tenants,
} from "@zen-doc/db";

const HOSPITAL_TYPES = ["PRIVATE_HOSPITAL", "PUBLIC_HOSPITAL"] as const;

const HOSPITAL_SERVICES = [
  "EMERGENCY",
  "THEATRE",
  "ICU",
  "OPD",
  "PHARMACY",
  "LABORATORY",
  "RADIOLOGY",
  "PHYSIOTHERAPY",
  "CARDIOLOGY",
  "PEDIATRICS",
] as const;

const AFFILIATION_STATUSES = ["PENDING", "ACTIVE", "INACTIVE"] as const;

const CLINIC_SPECIALIZATIONS = [
  "General Psychiatry",
  "Child and Adolescent Psychiatry",
  "Geriatric Psychiatry",
  "Addiction Medicine",
  "Trauma Recovery",
  "Anxiety and Mood Disorders",
  "Eating Disorders",
  "Neuropsychiatry",
];

const HOSPITAL_NAMES = [
  "Metropolitan General Hospital",
  "St. Mary's Medical Center",
  "Pacific Neuroscience Institute",
  "Central Wellness Hospital",
  "Riverside Psychiatric Hospital",
];

export async function seedTenants(
  db: ReturnType<typeof createDb>,
  doctorIds: string[]
) {
  const existing = await db.select({ id: tenants.id }).from(tenants);

  if (existing.length > 0) {
    return { tenants: 0, clinics: 0 };
  }

  const tenantRecords: Array<{
    id: string;
    name: string;
    type: (typeof HOSPITAL_TYPES)[number];
    address: string;
    contactInfo: string;
    status: "ACTIVE";
    services: string;
    latitude: string;
    longitude: string;
    phone: string;
    website: string;
    createdBy: string;
  }> = [];
  const tenantCount = 3;

  for (let i = 0; i < tenantCount; i++) {
    const tenantId = crypto.randomUUID();
    const services = faker.helpers.arrayElements(
      [...HOSPITAL_SERVICES],
      faker.number.int({ min: 3, max: 6 })
    );

    tenantRecords.push({
      id: tenantId,
      name: HOSPITAL_NAMES[i] ?? `${faker.company.name()} Hospital`,
      type: faker.helpers.arrayElement([...HOSPITAL_TYPES]),
      address: faker.location.streetAddress(),
      contactInfo: faker.phone.number(),
      status: "ACTIVE" as const,
      services: JSON.stringify(services),
      latitude: faker.location.latitude().toString(),
      longitude: faker.location.longitude().toString(),
      phone: faker.phone.number(),
      website: faker.internet.url(),
      createdBy: faker.helpers.arrayElement(doctorIds),
    });
  }

  await db.insert(tenants).values(tenantRecords);

  const clinicRecords: Array<{
    id: string;
    tenantId: string;
    name: string;
    specialization: string;
    schedule: string;
  }> = [];
  for (const tenant of tenantRecords) {
    const clinicCount = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < clinicCount; j++) {
      clinicRecords.push({
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        name: `${tenant.name} - ${faker.helpers.arrayElement(CLINIC_SPECIALIZATIONS)} Clinic`,
        specialization: faker.helpers.arrayElement(CLINIC_SPECIALIZATIONS),
        schedule: JSON.stringify({
          weekdays: "9:00 AM - 5:00 PM",
          saturday: "10:00 AM - 2:00 PM",
          sunday: "Closed",
        }),
      });
    }

    if (doctorIds.length > 0) {
      const adminDoctorId = faker.helpers.arrayElement(doctorIds);
      await db.insert(tenantAdmins).values({
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        userId: adminDoctorId,
      });
    }
  }

  await db.insert(clinics).values(clinicRecords);

  for (const doctorId of doctorIds) {
    const tenant = faker.helpers.arrayElement(tenantRecords);
    const status = faker.helpers.arrayElement([...AFFILIATION_STATUSES]);

    await db.insert(doctorHospitalAffiliations).values({
      id: crypto.randomUUID(),
      doctorId,
      tenantId: tenant.id,
      status,
      availabilityWindows: JSON.stringify([
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
      ]),
    });

    if (faker.datatype.boolean(0.7)) {
      const inviter = faker.helpers.arrayElement(
        doctorIds.filter((id) => id !== doctorId)
      );
      await db.insert(doctorHospitalInvitations).values({
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        doctorId,
        invitedBy: inviter,
        status: faker.helpers.arrayElement([
          "PENDING",
          "ACCEPTED",
          "DECLINED",
        ] as const),
        message: faker.helpers.arrayElement([
          "We would love to have you join our team.",
          "Your expertise would be valuable at our facility.",
          "Invitation to collaborate with our medical staff.",
        ]),
      });
    }

    if (faker.datatype.boolean(0.4)) {
      await db.insert(hospitalAttendanceEvents).values({
        id: crypto.randomUUID(),
        doctorId,
        tenantId: tenant.id,
        timestamp: faker.date.recent({ days: 14 }).toISOString(),
        eventType: faker.helpers.arrayElement([
          "CHECKED_IN",
          "CHECKED_OUT",
        ] as const),
        recordedBy: faker.helpers.arrayElement(doctorIds),
      });
    }

    // Hospital availability overrides
    if (faker.datatype.boolean(0.3)) {
      const startDate = faker.date.soon({ days: 30 });
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + faker.number.int({ min: 1, max: 5 }));
      await db.insert(hospitalAvailabilityOverrides).values({
        id: crypto.randomUUID(),
        doctorId,
        tenantId: tenant.id,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        reason: faker.helpers.arrayElement([
          "Vacation",
          "Conference",
          "Medical leave",
          "Training",
        ]),
      });
    }
  }

  // Clinic attendance
  const clinicIds = (await db.select({ value: clinics.id }).from(clinics)).map(
    (r) => r.value
  );
  for (const cid of clinicIds) {
    const docId = faker.helpers.arrayElement(doctorIds);
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
      });
    }
  }

  // Tenant audit logs
  for (const tenant of tenantRecords) {
    const logCount = faker.number.int({ min: 0, max: 4 });
    for (let l = 0; l < logCount; l++) {
      await db.insert(tenantAuditLogs).values({
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        actorId: faker.helpers.arrayElement(doctorIds),
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
      });
    }
  }

  // Tenant notifications
  for (const doctorId of doctorIds) {
    if (faker.datatype.boolean(0.4)) {
      await db.insert(tenantNotifications).values({
        id: crypto.randomUUID(),
        userId: doctorId,
        type: faker.helpers.arrayElement([
          "HOSPITAL_INVITATION",
          "ATTENDANCE_MARKED",
          "AFFILIATION_STATUS",
        ] as const),
        title: faker.helpers.arrayElement([
          "New hospital invitation",
          "Attendance recorded",
          "Affiliation updated",
        ]),
        message: faker.lorem.sentence(),
        entityId: faker.helpers.arrayElement(
          tenantRecords.map((t) => t.id)
        ),
        isRead: faker.datatype.boolean(0.3),
      });
    }
  }

  return {
    tenants: tenantRecords.length,
    clinics: clinicRecords.length,
  };
}
