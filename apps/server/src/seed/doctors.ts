import type { createDb } from "@suwa/db";
import {
  doctorCredits,
  doctorEducationEntries,
  doctorFiles,
  doctorPlans,
  doctorProfiles,
  doctorScheduleEntries,
  doctorWeeklyAvailability,
  stringifyJsonApproachSteps,
  stringifyJsonStringArray,
} from "@suwa/db";
import { inArray } from "drizzle-orm";
import { PORTRAIT_SPECS } from "../data-specs/portraits";
import { DOCTOR_PROFILE_SPECS } from "../data-specs/profiles";
import {
  APPROACH_STEP_TEMPLATES,
  APPROACH_TEMPLATES,
  QUALIFICATION_SPECS,
  SECONDARY_QUALIFICATIONS,
} from "../data-specs/qualifications";

export interface DoctorSeedResult {
  availabilitySlots: number;
  credits: number;
  educationEntries: number;
  fileRecords: number;
  plans: number;
  profiles: number;
  scheduleEntries: number;
}

interface DoctorFilesStore {
  put: (key: string, data: ArrayBuffer) => Promise<void>;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function downloadImage(url: string): Promise<ArrayBuffer | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      return null;
    }
    return resp.arrayBuffer();
  } catch {
    return null;
  }
}

async function upsertDoctorRelation(
  db: ReturnType<typeof createDb>,
  table: any,
  ids: string[],
  selectCol: any,
  getRows: (id: string) => any[]
): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }
  const existing = await db
    .select({ doctorId: selectCol })
    .from(table)
    .where(inArray(selectCol, ids));
  const existingSet = new Set(existing.map((r) => r.doctorId as string));
  let totalInserted = 0;
  for (const id of ids) {
    if (!existingSet.has(id)) {
      const rows = getRows(id);
      if (rows.length > 0) {
        await db.insert(table).values(rows);
        totalInserted += rows.length;
      }
    }
  }
  return totalInserted;
}

async function upsertSingle(
  db: ReturnType<typeof createDb>,
  table: any,
  ids: string[],
  selectCol: any,
  getRow: (id: string) => any
): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }
  const existing = await db
    .select({ doctorId: selectCol })
    .from(table)
    .where(inArray(selectCol, ids));
  const existingSet = new Set(existing.map((r) => r.doctorId as string));
  let inserted = 0;
  for (const id of ids) {
    if (!existingSet.has(id)) {
      await db.insert(table).values(getRow(id));
      inserted++;
    }
  }
  return inserted;
}

export async function seedDoctors(
  db: ReturnType<typeof createDb>,
  doctorIds: string[],
  kv?: DoctorFilesStore
): Promise<DoctorSeedResult> {
  // ── Step A: Create missing doctor profiles ────────────────────────────
  const existingProfiles = await db
    .select({ userId: doctorProfiles.userId })
    .from(doctorProfiles);
  const existingProfileSet = new Set(existingProfiles.map((p) => p.userId));

  let profilesCreated = 0;
  const idsMissingProfiles = doctorIds.filter(
    (id) => !existingProfileSet.has(id)
  );

  for (let i = 0; i < idsMissingProfiles.length; i++) {
    const userId = idsMissingProfiles[i]!;
    const specIdx = i % DOCTOR_PROFILE_SPECS.length;
    const spec = DOCTOR_PROFILE_SPECS[specIdx]!;
    if (!spec) {
      continue;
    }
    const now = new Date().toISOString();

    await db.insert(doctorProfiles).values({
      userId,
      displayName: spec.displayName,
      headline: spec.headline,
      bio: spec.bio,
      licenseNumber: `LIC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      location: spec.location,
      placeName: spec.placeName,
      placeAddress: spec.placeAddress,
      placeDescription: spec.placeDescription,
      experienceStartYear: spec.experienceStartYear,
      specialties: stringifyJsonStringArray(spec.specialties),
      languages: stringifyJsonStringArray(spec.languages),
      consultationModes: stringifyJsonStringArray(spec.consultationModes),
      focusAreas: stringifyJsonStringArray(spec.focusAreas),
      approachSteps: stringifyJsonApproachSteps(
        APPROACH_STEP_TEMPLATES[specIdx]!.map((text) => ({
          id: crypto.randomUUID(),
          text,
        }))
      ),
      approach: APPROACH_TEMPLATES[specIdx]!,
      education: `${QUALIFICATION_SPECS[specIdx]!.abbreviation} in ${QUALIFICATION_SPECS[specIdx]!.field} — ${QUALIFICATION_SPECS[specIdx]!.institution} (${QUALIFICATION_SPECS[specIdx]!.yearRange[1]})`,
      permanent: true,
      stripeAccountEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
    profilesCreated++;
  }

  // ── Step B: Education entries ──────────────────────────────────────────
  const educationEntries = await upsertDoctorRelation(
    db,
    doctorEducationEntries,
    doctorIds,
    doctorEducationEntries.doctorId,
    (userId) => {
      const idx = doctorIds.indexOf(userId);
      const specIdx = idx % QUALIFICATION_SPECS.length;
      const primary = QUALIFICATION_SPECS[specIdx]!;
      const secondary = SECONDARY_QUALIFICATIONS[specIdx]!;
      const now = new Date().toISOString();
      return [
        {
          id: crypto.randomUUID(),
          doctorId: userId,
          institution: primary.institution,
          degree: `${primary.abbreviation} in ${primary.field}`,
          year: primary.yearRange[1],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          doctorId: userId,
          institution: secondary.institution,
          degree: secondary.abbreviation,
          year: secondary.yearRange[1],
          createdAt: now,
          updatedAt: now,
        },
      ];
    }
  );

  // ── Step C: Plans ────────────────────────────────────────────────────
  const planCount = await upsertDoctorRelation(
    db,
    doctorPlans,
    doctorIds,
    doctorPlans.doctorId,
    (userId) => {
      const now = new Date().toISOString();
      return [
        {
          id: crypto.randomUUID(),
          doctorId: userId,
          name: "Initial Consultation",
          description:
            "Comprehensive initial assessment and personalized treatment planning",
          creditCost: 1,
          priceCents: 1500,
          durationMinutes: 30,
          features: JSON.stringify([
            "assessment",
            "treatment plan",
            "intake evaluation",
          ]),
          isActive: true,
          isDefault: false,
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          doctorId: userId,
          name: "Standard Session",
          description: "Regular one-on-one therapy session",
          creditCost: 1,
          priceCents: 3000,
          durationMinutes: 50,
          features: JSON.stringify([
            "therapy",
            "progress review",
            "skill building",
          ]),
          isActive: true,
          isDefault: true,
          sortOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          doctorId: userId,
          name: "Extended Session",
          description: "Extended session for deeper therapeutic work",
          creditCost: 1,
          priceCents: 5000,
          durationMinutes: 80,
          features: JSON.stringify([
            "deep therapy",
            "crisis support",
            "intensive work",
          ]),
          isActive: true,
          isDefault: false,
          sortOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
      ];
    }
  );

  // ── Step D: Weekly availability ────────────────────────────────────────
  const daySlots = [
    { day: 1, start: "09:00", end: "17:00" },
    { day: 2, start: "09:00", end: "17:00" },
    { day: 3, start: "09:00", end: "17:00" },
    { day: 4, start: "09:00", end: "17:00" },
    { day: 5, start: "09:00", end: "17:00" },
  ];
  let availabilitySlots = 0;
  for (const doctorId of doctorIds) {
    const existingAvail = await db
      .select({ doctorId: doctorWeeklyAvailability.doctorId })
      .from(doctorWeeklyAvailability)
      .where(inArray(doctorWeeklyAvailability.doctorId, [doctorId]));
    if (existingAvail.length > 0) {
      continue;
    }

    const now = new Date().toISOString();
    for (const slot of daySlots) {
      await db.insert(doctorWeeklyAvailability).values({
        id: crypto.randomUUID(),
        doctorId,
        dayOfWeek: slot.day,
        startTime: slot.start,
        endTime: slot.end,
        isAvailable: true,
        createdAt: now,
        updatedAt: now,
      });
      availabilitySlots++;
    }
  }

  // ── Step E: Schedule entries ────────────────────────────────────────────
  let scheduleEntries = 0;
  for (const doctorId of doctorIds) {
    const existingSched = await db
      .select({ doctorId: doctorScheduleEntries.doctorId })
      .from(doctorScheduleEntries)
      .where(inArray(doctorScheduleEntries.doctorId, [doctorId]));
    if (existingSched.length > 0) {
      continue;
    }

    const base = new Date();
    for (let s = 0; s < 3; s++) {
      const startAt = addDays(base, 1 + s * 2);
      startAt.setHours(10 + s, 0, 0, 0);
      const endAt = new Date(startAt);
      endAt.setHours(11 + s, 0, 0, 0);
      const now = new Date().toISOString();
      await db.insert(doctorScheduleEntries).values({
        id: crypto.randomUUID(),
        doctorId,
        kind: "open",
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        createdAt: now,
        updatedAt: now,
      });
      scheduleEntries++;
    }
  }

  // ── Step F: Credits ───────────────────────────────────────────────────
  const credits = await upsertSingle(
    db,
    doctorCredits,
    doctorIds,
    doctorCredits.doctorId,
    (doctorId) => {
      const now = new Date().toISOString();
      return {
        doctorId,
        balanceCents: 0,
        totalEarnedCents: 0,
        totalCashedOutCents: 0,
        createdAt: now,
        updatedAt: now,
      };
    }
  );

  // ── Step G: Files (portrait + qualification) ──────────────────────────
  let fileRecords = 0;
  for (let i = 0; i < doctorIds.length; i++) {
    const doctorId = doctorIds[i]!;
    const specIdx = i % DOCTOR_PROFILE_SPECS.length;
    const spec = DOCTOR_PROFILE_SPECS[specIdx];
    if (!spec) {
      continue;
    }
    const portrait = PORTRAIT_SPECS[specIdx] ?? PORTRAIT_SPECS[0]!;
    const now = new Date().toISOString();

    // Portrait
    const existingPortrait = await db
      .select({ id: doctorFiles.id })
      .from(doctorFiles)
      .where(inArray(doctorFiles.doctorId, [doctorId]));
    if (existingPortrait.length === 0) {
      let portraitBuffer: ArrayBuffer | null = null;
      try {
        portraitBuffer = await downloadImage(portrait.url);
      } catch {
        /* skip */
      }

      const fileId = crypto.randomUUID();
      const fileKey = `doctor-files/${doctorId}/${fileId}-portrait.jpg`;
      if (portraitBuffer && kv) {
        await kv.put(fileKey, portraitBuffer).catch(() => {});
      }

      await db.insert(doctorFiles).values({
        id: fileId,
        doctorId,
        fileKey,
        fileName: "portrait.jpg",
        mimeType: "image/jpeg",
        fileKind: "portrait",
        caption: `${spec.displayName} — Professional Portrait`,
        size: portraitBuffer?.byteLength ?? 75_000,
        width: 256,
        height: 256,
        createdAt: now,
        updatedAt: now,
      });
      fileRecords++;

      // Qualification PDF
      const qualId = crypto.randomUUID();
      const qualKey = `doctor-files/${doctorId}/${qualId}-license.pdf`;
      if (kv) {
        const pdfStr =
          "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF";
        const pdfBuf = new Uint8Array(new TextEncoder().encode(pdfStr).buffer);
        await kv.put(qualKey, pdfBuf.buffer as ArrayBuffer).catch(() => {});
      }
      await db.insert(doctorFiles).values({
        id: qualId,
        doctorId,
        fileKey: qualKey,
        fileName: "medical-license-certification.pdf",
        mimeType: "application/pdf",
        fileKind: "qualification",
        caption: `${spec.displayName} — Medical License & Board Certification`,
        size: 256,
        createdAt: now,
        updatedAt: now,
      });
      fileRecords++;
    }
  }

  return {
    profiles: profilesCreated,
    educationEntries,
    plans: planCount,
    availabilitySlots,
    scheduleEntries,
    fileRecords,
    credits,
  };
}
