import type { createDb } from "@doca/db";
import {
  doctorCredits,
  doctorEducationEntries,
  doctorFiles,
  doctorPlans,
  doctorProfiles,
  doctorScheduleEntries,
  doctorWeeklyAvailability,
} from "@doca/db";
import { faker } from "@faker-js/faker";
import { inArray } from "drizzle-orm";

const SPECIALTIES = [
  "psychiatry",
  "psychology",
  "counseling",
  "wellness",
] as const;

const LANGUAGES = ["english", "spanish", "french", "arabic", "hindi"] as const;

const CONSULTATION_MODES = ["video", "in_person", "chat"] as const;

const FOCUS_AREAS = [
  "anxiety",
  "depression",
  "stress",
  "trauma",
  "sleep",
  "burnout",
] as const;

const PLACE_NAMES = [
  "Serenity Mental Health Center",
  "Mindful Growth Therapy",
  "Clear Mind Clinic",
  "Wellness Harbor",
  "Tranquil Pathways Psychotherapy",
  "Harmony Behavioral Health",
  "Elevate Counseling Services",
  "New Dawn Psychiatric Care",
];

export async function seedDoctors(db: ReturnType<typeof createDb>) {
  const existing = await db
    .select({ userId: doctorProfiles.userId })
    .from(doctorProfiles);

  if (existing.length > 0) {
    return {
      created: 0,
      existing: existing.length,
      userIds: existing.map((d) => d.userId),
    };
  }

  const doctors: Array<{
    userId: string;
    displayName: string;
    headline: string;
    bio: string;
    licenseNumber: string;
    location: string;
    placeName: string;
    placeAddress: string;
    placeDescription: string;
    experienceStartYear: number;
    specialties: string;
    languages: string;
    consultationModes: string;
    focusAreas: string;
    approach: string;
    education: string;
    permanent: boolean;
    stripeAccountEnabled: boolean;
  }> = [];
  const count = 5;

  for (let i = 0; i < count; i++) {
    const userId = crypto.randomUUID();
    const specialties = faker.helpers.arrayElements(
      [...SPECIALTIES],
      faker.number.int({ min: 2, max: 4 })
    );
    const languages = faker.helpers.arrayElements(
      [...LANGUAGES],
      faker.number.int({ min: 1, max: 3 })
    );
    const modes = faker.helpers.arrayElements(
      [...CONSULTATION_MODES],
      faker.number.int({ min: 1, max: 3 })
    );
    const focusAreas = faker.helpers.arrayElements(
      [...FOCUS_AREAS],
      faker.number.int({ min: 3, max: 6 })
    );

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const displayName = `Dr. ${firstName} ${lastName}`;
    const specialtiesLabel = specialties.join(", ");

    doctors.push({
      userId,
      displayName,
      headline: faker.helpers.arrayElement([
        `Licensed Clinical Psychologist specializing in ${specialtiesLabel}`,
        `Board-certified psychiatrist with expertise in ${focusAreas.slice(0, 2).join(" and ")}`,
        `Experienced counselor focusing on ${focusAreas.slice(0, 2).join(" and ")}`,
        `Clinical psychologist specializing in evidence-based treatments for ${focusAreas.slice(0, 2).join(" and ")}`,
      ]),
      bio: faker.lorem.paragraphs(2),
      licenseNumber: `LIC-${faker.string.alphanumeric(8).toUpperCase()}`,
      location: faker.location.city(),
      placeName: faker.helpers.arrayElement(PLACE_NAMES),
      placeAddress: faker.location.streetAddress(),
      placeDescription: faker.lorem.sentence(),
      experienceStartYear: faker.number.int({ min: 2000, max: 2020 }),
      specialties: JSON.stringify(specialties),
      languages: JSON.stringify(languages),
      consultationModes: JSON.stringify(modes),
      focusAreas: JSON.stringify(focusAreas),
      approach: faker.helpers.arrayElement([
        "I use a combination of CBT, DBT, and mindfulness-based approaches tailored to each patient's unique needs.",
        "My approach integrates evidence-based psychotherapies with holistic wellness practices.",
        "I specialize in trauma-informed care using EMDR and somatic experiencing techniques.",
        "I focus on strengths-based therapy incorporating positive psychology and cognitive restructuring.",
      ]),
      education: `${faker.helpers.arrayElement(["Ph.D.", "Psy.D.", "M.D."])} in ${faker.helpers.arrayElement(["Clinical Psychology", "Psychiatry", "Counseling Psychology"])} - ${faker.company.name()}\n${faker.helpers.arrayElement(["M.A.", "M.S."])} in Psychology - ${faker.company.name()}`,
      permanent: true,
      stripeAccountEnabled: faker.datatype.boolean(0.6),
    });
  }

  await db.insert(doctorProfiles).values(doctors);

  return {
    created: doctors.length,
    existing: 0,
    userIds: doctors.map((d) => d.userId),
  };
}

export async function seedDoctorRelations(
  db: ReturnType<typeof createDb>,
  doctorIds: string[]
) {
  if (doctorIds.length === 0) {
    return {
      education: 0,
      plans: 0,
      credits: 0,
      availability: 0,
      schedule: 0,
      files: 0,
    };
  }

  const existingEducation = await db
    .select({ doctorId: doctorEducationEntries.doctorId })
    .from(doctorEducationEntries)
    .where(inArray(doctorEducationEntries.doctorId, doctorIds));
  const existingPlanDoctors = await db
    .select({ doctorId: doctorPlans.doctorId })
    .from(doctorPlans)
    .where(inArray(doctorPlans.doctorId, doctorIds));
  const existingCreditDoctors = await db
    .select({ doctorId: doctorCredits.doctorId })
    .from(doctorCredits)
    .where(inArray(doctorCredits.doctorId, doctorIds));
  const existingAvailDoctors = await db
    .select({ doctorId: doctorWeeklyAvailability.doctorId })
    .from(doctorWeeklyAvailability)
    .where(inArray(doctorWeeklyAvailability.doctorId, doctorIds));
  const existingScheduleDoctors = await db
    .select({ doctorId: doctorScheduleEntries.doctorId })
    .from(doctorScheduleEntries)
    .where(inArray(doctorScheduleEntries.doctorId, doctorIds));
  const existingFileDoctors = await db
    .select({ doctorId: doctorFiles.doctorId })
    .from(doctorFiles)
    .where(inArray(doctorFiles.doctorId, doctorIds));

  const existingEducationSet = new Set(
    existingEducation.map((r) => r.doctorId)
  );
  const existingPlanSet = new Set(existingPlanDoctors.map((r) => r.doctorId));
  const existingCreditSet = new Set(
    existingCreditDoctors.map((r) => r.doctorId)
  );
  const existingAvailSet = new Set(existingAvailDoctors.map((r) => r.doctorId));
  const existingScheduleSet = new Set(
    existingScheduleDoctors.map((r) => r.doctorId)
  );
  const existingFileSet = new Set(existingFileDoctors.map((r) => r.doctorId));

  let educationCount = 0;
  let planCount = 0;
  let creditCount = 0;
  let availCount = 0;
  let scheduleCount = 0;
  let fileCount = 0;

  for (const doctorId of doctorIds) {
    // Education entries
    if (!existingEducationSet.has(doctorId)) {
      const entries = [
        {
          doctorId,
          institution: faker.company.name(),
          degree: "Ph.D. in Clinical Psychology",
          year: faker.number.int({ min: 2000, max: 2015 }),
        },
        {
          doctorId,
          institution: faker.company.name(),
          degree: "M.A. in Psychology",
          year: faker.number.int({ min: 1995, max: 2010 }),
        },
      ];

      await db.insert(doctorEducationEntries).values(
        entries.map((e) => ({
          id: crypto.randomUUID(),
          doctorId: e.doctorId,
          institution: e.institution,
          degree: e.degree,
          year: e.year,
        }))
      );
      educationCount += entries.length;
    }

    // Plans
    if (!existingPlanSet.has(doctorId)) {
      const plans = [
        {
          doctorId,
          name: "Initial Consultation",
          description:
            "Comprehensive initial assessment and treatment planning",
          creditCost: 1,
          durationMinutes: 30,
          features: JSON.stringify(["assessment", "treatment plan"]),
          isActive: true,
          isDefault: false,
          sortOrder: 0,
        },
        {
          doctorId,
          name: "Standard Session",
          description: "Regular therapy session",
          creditCost: 2,
          durationMinutes: 50,
          features: JSON.stringify(["therapy", "progress review"]),
          isActive: true,
          isDefault: true,
          sortOrder: 1,
        },
        {
          doctorId,
          name: "Extended Session",
          description: "Extended therapy session for deeper work",
          creditCost: 3,
          durationMinutes: 80,
          features: JSON.stringify(["deep therapy", "crisis support"]),
          isActive: true,
          isDefault: false,
          sortOrder: 2,
        },
      ];

      await db.insert(doctorPlans).values(
        plans.map((p) => ({
          id: crypto.randomUUID(),
          doctorId: p.doctorId,
          name: p.name,
          description: p.description,
          creditCost: p.creditCost,
          durationMinutes: p.durationMinutes,
          features: p.features,
          isActive: p.isActive,
          isDefault: p.isDefault,
          sortOrder: p.sortOrder,
        }))
      );
      planCount += plans.length;
    }

    // Credits
    if (!existingCreditSet.has(doctorId)) {
      await db.insert(doctorCredits).values({
        doctorId,
        balanceCents: faker.number.int({ min: 0, max: 50_000 }),
        totalEarnedCents: faker.number.int({ min: 10_000, max: 200_000 }),
        totalCashedOutCents: faker.number.int({ min: 0, max: 100_000 }),
      });
      creditCount++;
    }

    // Weekly availability
    if (!existingAvailSet.has(doctorId)) {
      const days = [0, 1, 2, 3, 4, 5, 6];
      for (const dayOfWeek of days) {
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          if (faker.datatype.boolean(0.3)) {
            await db.insert(doctorWeeklyAvailability).values({
              id: crypto.randomUUID(),
              doctorId,
              dayOfWeek,
              startTime: "10:00",
              endTime: "14:00",
              isAvailable: true,
            });
            availCount++;
          }
        } else {
          await db.insert(doctorWeeklyAvailability).values({
            id: crypto.randomUUID(),
            doctorId,
            dayOfWeek,
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true,
          });
          availCount++;
        }
      }
    }

    // Schedule entries
    if (!existingScheduleSet.has(doctorId)) {
      for (let s = 0; s < 3; s++) {
        const startDate = faker.date.soon({ days: 14 });
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);
        await db.insert(doctorScheduleEntries).values({
          id: crypto.randomUUID(),
          doctorId,
          kind: "open",
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
        });
        scheduleCount++;
      }
    }

    // Doctor files
    if (!existingFileSet.has(doctorId)) {
      await db.insert(doctorFiles).values({
        id: crypto.randomUUID(),
        doctorId,
        fileKey: `doctor-files/${doctorId}/portrait.jpg`,
        fileName: "portrait.jpg",
        mimeType: "image/jpeg",
        fileKind: "portrait",
        caption: "Professional portrait",
        size: faker.number.int({ min: 50_000, max: 500_000 }),
        width: 400,
        height: 400,
      });
      await db.insert(doctorFiles).values({
        id: crypto.randomUUID(),
        doctorId,
        fileKey: `doctor-files/${doctorId}/qualification.pdf`,
        fileName: "license.pdf",
        mimeType: "application/pdf",
        fileKind: "qualification",
        caption: "Medical license",
        size: faker.number.int({ min: 100_000, max: 1_000_000 }),
      });
      fileCount += 2;
    }
  }

  return {
    education: educationCount,
    plans: planCount,
    credits: creditCount,
    availability: availCount,
    schedule: scheduleCount,
    files: fileCount,
  };
}

export async function getDoctorIds(db: ReturnType<typeof createDb>) {
  const result = await db
    .select({ userId: doctorProfiles.userId })
    .from(doctorProfiles);
  return result.map((r) => r.userId);
}
