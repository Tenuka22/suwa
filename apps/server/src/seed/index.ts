import { createDb } from "@suwa/db";
import { seedCashouts } from "./cashouts";
import { getDoctorIds, seedDoctorRelations, seedDoctors } from "./doctors";
import { seedGamification } from "./gamification";
import { seedHub } from "./hub";
import { seedHubUploads } from "./hub-uploads";
import { getPatientIds, seedPatientRelations, seedPatients } from "./patients";
import { seedSessions } from "./sessions";
import { seedSubscriptions } from "./subscriptions";
import { seedTenants } from "./tenants";

export interface SeedEnv {
  chatMessagesKv: KVNamespace;
  doctorMaterialsKv: KVNamespace;
  modelFeaturesKv: KVNamespace;
}

export interface SeedSummary {
  cashouts: number;
  doctorRelations: {
    education: number;
    plans: number;
    availability: number;
    schedule: number;
    files: number;
  };
  doctors: { created: number; existing: number };
  gamification: { sprites: number; wellness: number; moonlight: number };
  hub: { channels: number; materials: number; playlists: number };
  hubUploads: number;
  patientRelations: {
    moonlight: number;
    stress: number;
    acknowledgments: number;
  };
  patients: { created: number; existing: number };
  sessions: number;
  subscriptions: number;
  tenants: { created: number; clinics: number };
}

export async function runSeed(env?: SeedEnv): Promise<SeedSummary> {
  const db = createDb();

  const doctorsResult = await seedDoctors(db);
  const patientsResult = await seedPatients(db);

  const doctorIds =
    doctorsResult.userIds.length > 0
      ? doctorsResult.userIds
      : await getDoctorIds(db);
  const patientIds =
    patientsResult.userIds.length > 0
      ? patientsResult.userIds
      : await getPatientIds(db);

  const doctorRelationsResult = await seedDoctorRelations(db, doctorIds);
  const patientRelationsResult = await seedPatientRelations(db, patientIds);

  const allIds = [...new Set([...doctorIds, ...patientIds])];

  const sessionsResult = await seedSessions(db, doctorIds, patientIds);
  const tenantsResult = await seedTenants(db, doctorIds);
  const gamificationResult = await seedGamification(db, allIds);
  const hubResult = await seedHub(db, doctorIds, env?.doctorMaterialsKv);
  const hubUploadsResult = await seedHubUploads(db, doctorIds);
  const cashoutsResult = await seedCashouts(db, doctorIds);
  const subscriptionsResult = await seedSubscriptions(db, allIds);

  return {
    cashouts: cashoutsResult.cashouts,
    doctorRelations: doctorRelationsResult,
    doctors: {
      created: doctorsResult.created,
      existing: doctorsResult.existing,
    },
    patients: {
      created: patientsResult.created,
      existing: patientsResult.existing,
    },
    patientRelations: patientRelationsResult,
    sessions: sessionsResult.created,
    tenants: { created: tenantsResult.tenants, clinics: tenantsResult.clinics },
    gamification: gamificationResult,
    hub: hubResult,
    hubUploads: hubUploadsResult.uploadSessions,
    subscriptions: subscriptionsResult.subscriptions,
  };
}
