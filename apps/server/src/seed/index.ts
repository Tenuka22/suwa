import type { ReadAssetFn } from "./hub";
import { createDb } from "@suwa/db";
import { seedCashouts } from "./cashouts";
import { seedChats } from "./chats";
import { seedDoctors } from "./doctors";
import { seedHub } from "./hub";
import { seedPatients } from "./patients";
import { seedSessions } from "./sessions";
import { seedSubscriptions } from "./subscriptions";
import { seedTenants } from "./tenants";
import { saveManifest } from "./unseed";
import { resolveUsers } from "./users";

export interface SeedEnv {
  chatMessagesKv?: KVNamespace;
  doctorMaterialsKv?: KVNamespace;
  modelFeaturesKv?: KVNamespace;
  readAsset?: ReadAssetFn;
}

export interface SeedSummary {
  cashouts: number;
  chats: {
    conversations: number;
    messages: number;
  };
  doctorIds: string[];
  doctors: {
    profiles: number;
    educationEntries: number;
    plans: number;
    availabilitySlots: number;
    scheduleEntries: number;
    fileRecords: number;
    credits: number;
  };
  hub: {
    channels: number;
    materials: number;
    playlists: number;
    uploads: number;
  };
  patientIds: string[];
  patients: {
    profiles: number;
    stressPredictions: number;
    acknowledgments: number;
  };
  sessions: {
    sessions: number;
    tasks: number;
    attendanceEvents: number;
    snapshots: number;
  };
  subscriptions: number;
  tenants: {
    hospitals: number;
    clinics: number;
    affiliations: number;
    invitations: number;
    attendanceEvents: number;
    overrides: number;
    auditLogs: number;
    notifications: number;
  };
}

export async function runSeed(env?: SeedEnv): Promise<SeedSummary> {
  const db = createDb();

  const { doctorIds, patientIds } = await resolveUsers(db);

  const doctorResult = await seedDoctors(
    db,
    doctorIds,
    env?.doctorMaterialsKv
      ? {
          put: (key, data) => env.doctorMaterialsKv!.put(key, data),
        }
      : undefined
  );

  const patientResult = await seedPatients(db, patientIds);

  const sessionResult = await seedSessions(db, doctorIds, patientIds);

  const tenantResult = await seedTenants(db, doctorIds);

  const hubResult = await seedHub(
    db,
    doctorIds,
    env?.doctorMaterialsKv
      ? {
          put: (key, data) => env.doctorMaterialsKv!.put(key, data),
        }
      : undefined,
    env?.readAsset
  );

  const allIds = [...new Set([...doctorIds, ...patientIds])];
  const subscriptionResult = await seedSubscriptions(db, allIds);

  const cashoutResult = await seedCashouts(db, doctorIds);

  const chatResult = await seedChats(db, doctorIds, patientIds);

  if (env?.doctorMaterialsKv) {
    await saveManifest(env.doctorMaterialsKv, doctorIds, patientIds);
  }

  return {
    cashouts: cashoutResult.cashouts,
    chats: chatResult,
    doctors: doctorResult,
    hub: hubResult,
    patients: patientResult,
    sessions: sessionResult,
    subscriptions: subscriptionResult.subscriptions,
    tenants: tenantResult,
    doctorIds,
    patientIds,
  };
}
