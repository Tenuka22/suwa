import { createDb } from "@zen-doc/db";
import { seedChats } from "./chats";
import { getDoctorIds, seedDoctors } from "./doctors";
import { seedGamification } from "./gamification";
import { seedHub } from "./hub";
import { getPatientIds, seedPatients } from "./patients";
import { seedSessions } from "./sessions";
import { seedTenants } from "./tenants";

export interface SeedEnv {
  doctorMaterialsKv: KVNamespace;
  chatMessagesKv: KVNamespace;
  modelFeaturesKv: KVNamespace;
}

export interface SeedSummary {
  chats: { conversations: number; messages: number };
  doctors: { created: number; existing: number };
  gamification: { sprites: number; wellness: number; credits: number };
  hub: { channels: number; materials: number; playlists: number };
  patients: { created: number; existing: number };
  sessions: number;
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

  const allIds = [...new Set([...doctorIds, ...patientIds])];

  const sessionsResult = await seedSessions(db, doctorIds, patientIds);
  const tenantsResult = await seedTenants(db, doctorIds);
  const gamificationResult = await seedGamification(db, allIds);
  const chatsResult = await seedChats(db, allIds);
  const hubResult = await seedHub(db, doctorIds, env?.doctorMaterialsKv);

  return {
    doctors: {
      created: doctorsResult.created,
      existing: doctorsResult.existing,
    },
    patients: {
      created: patientsResult.created,
      existing: patientsResult.existing,
    },
    sessions: sessionsResult.created,
    tenants: { created: tenantsResult.tenants, clinics: tenantsResult.clinics },
    gamification: gamificationResult,
    chats: chatsResult,
    hub: hubResult,
  };
}
