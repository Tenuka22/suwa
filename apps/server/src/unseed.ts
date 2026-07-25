import { inArray } from "drizzle-orm";
import {
  accounts,
  clinics,
  conversations,
  doctorCredits,
  doctorEducationEntries,
  doctorFiles,
  doctorHospitalAffiliations,
  doctorHubChannels,
  doctorHubMaterials,
  doctorPlans,
  doctorPlaylists,
  doctorProfiles,
  doctorSessions,
  doctorWeeklyAvailability,
  messages,
  patientMoods,
  patientProfiles,
  sessions,
  tenants,
  users,
  verifications,
} from "@suwa/db";
import { PATIENT_PORTRAIT_SPECS, PORTRAIT_SPECS } from "./data-specs/portraits";

interface UnseedResult {
  summary: string;
}

const SEED_EMAILS = [
  "admin@gmail.com",
  ...PORTRAIT_SPECS.map((s) => s.email),
  ...PATIENT_PORTRAIT_SPECS.map((s) => s.email),
];

export async function unseedDatabase(context: { db: any }): Promise<UnseedResult> {
  const { db } = context;

  const seedUserIds = (
    await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.email, SEED_EMAILS))
  ).map((u: { id: string }) => u.id);

  const tables = [
    messages,
    conversations,
    patientMoods,
    patientProfiles,
    doctorSessions,
    doctorHospitalAffiliations,
    doctorHubMaterials,
    doctorPlaylists,
    doctorHubChannels,
    doctorFiles,
    doctorCredits,
    doctorWeeklyAvailability,
    doctorPlans,
    doctorEducationEntries,
    doctorProfiles,
    clinics,
    tenants,
  ];

  let totalDeleted = 0;
  for (const table of tables) {
    const result = await db.delete(table).all();
    totalDeleted += result.changes ?? 0;
  }

  if (seedUserIds.length > 0) {
    for (const table of [accounts, sessions]) {
      const result = await db.delete(table).where(inArray(table.userId, seedUserIds)).all();
      totalDeleted += result.changes ?? 0;
    }
    await db.delete(verifications).all();
    const result = await db.delete(users).where(inArray(users.id, seedUserIds)).all();
    totalDeleted += result.changes ?? 0;
  }

  return {
    summary: `Unseeded ${totalDeleted} rows across all tables`,
  };
}
