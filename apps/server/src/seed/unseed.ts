import type { createDb } from "@suwa/db";
import {
  clinicAttendance,
  clinics,
  conversations,
  doctorCashoutRequests,
  doctorCredits,
  doctorEducationEntries,
  doctorFiles,
  doctorHospitalAffiliations,
  doctorHospitalInvitations,
  doctorHubChannels,
  doctorHubMaterials,
  doctorPlans,
  doctorPlaylists,
  doctorProfiles,
  doctorScheduleEntries,
  doctorSessions,
  doctorWeeklyAvailability,
  hospitalAttendanceEvents,
  hospitalAvailabilityOverrides,
  hubUploadSessions,
  messages,
  patientProfiles,
  sessionAttendanceEvents,
  sessionSnapshots,
  sessionTaskAssignments,
  stressDownloadAcknowledgments,
  stressPredictions,
  tenantAdmins,
  tenantAuditLogs,
  tenantNotifications,
  tenants,
  userSubscriptions,
} from "@suwa/db";

export interface SeedManifest {
  doctorIds: string[];
  patientIds: string[];
  seededAt: string;
}

const MANIFEST_KEY = "seed:manifest";

export async function saveManifest(
  kv: KVNamespace,
  doctorIds: string[],
  patientIds: string[]
): Promise<void> {
  const manifest: SeedManifest = {
    seededAt: new Date().toISOString(),
    doctorIds,
    patientIds,
  };
  await kv.put(MANIFEST_KEY, JSON.stringify(manifest));
}

export async function loadManifest(
  kv: KVNamespace
): Promise<SeedManifest | null> {
  const raw = await kv.get(MANIFEST_KEY);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as SeedManifest;
}

export async function deleteManifest(kv: KVNamespace): Promise<void> {
  await kv.delete(MANIFEST_KEY);
}

async function listKvKeys(kv: KVNamespace, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | undefined;
  while (true) {
    const page = await kv.list<unknown>({ prefix, cursor });
    keys.push(...page.keys.map((k) => k.name));
    if ((page as any).list_complete) {
      break;
    }
    cursor = (page as any).cursor as string;
  }
  return keys;
}

async function deleteKvPrefix(
  kv: KVNamespace,
  prefix: string
): Promise<number> {
  const keys = await listKvKeys(kv, prefix);
  for (const key of keys) {
    await kv.delete(key);
  }
  return keys.length;
}

interface UnseedResult {
  dbRecords: Record<string, number>;
  kvFilesDeleted: number;
  kvManifestDeleted: boolean;
}

export async function unseedData(
  db: ReturnType<typeof createDb>,
  kv: KVNamespace
): Promise<UnseedResult> {
  const manifest = await loadManifest(kv);

  // ── KV file deletion ────────────────────────────────────────────────
  let kvFilesDeleted = 0;
  if (manifest?.doctorIds?.length) {
    for (const doctorId of manifest.doctorIds) {
      kvFilesDeleted += await deleteKvPrefix(kv, `doctor-files/${doctorId}/`);
      kvFilesDeleted += await deleteKvPrefix(kv, `hub-uploads/${doctorId}/`);
    }
    await kv.delete("seed:sample-video").catch(() => {});
    await kv.delete("seed:sample-audio").catch(() => {});
    await kv.delete("seed:sample-thumbnail").catch(() => {});
  }

  let kvManifestDeleted = false;
  if (manifest) {
    await deleteManifest(kv);
    kvManifestDeleted = true;
  }

  // ── DB deletion (reverse dependency order) ──────────────────────────
  const counts: Record<string, number> = {};

  counts.messages = await deleteAll(db, messages);
  counts.conversations = await deleteAll(db, conversations);

  counts.sessionTaskAssignments = await deleteAll(db, sessionTaskAssignments);
  counts.sessionAttendanceEvents = await deleteAll(db, sessionAttendanceEvents);
  counts.sessionSnapshots = await deleteAll(db, sessionSnapshots);
  counts.doctorSessions = await deleteAll(db, doctorSessions);

  counts.hubUploadSessions = await deleteAll(db, hubUploadSessions);
  counts.doctorHubMaterials = await deleteAll(db, doctorHubMaterials);
  counts.doctorHubChannels = await deleteAll(db, doctorHubChannels);
  counts.doctorPlaylists = await deleteAll(db, doctorPlaylists);

  counts.clinicAttendance = await deleteAll(db, clinicAttendance);
  counts.clinics = await deleteAll(db, clinics);
  counts.tenantAuditLogs = await deleteAll(db, tenantAuditLogs);
  counts.tenantNotifications = await deleteAll(db, tenantNotifications);
  counts.hospitalAvailabilityOverrides = await deleteAll(
    db,
    hospitalAvailabilityOverrides
  );
  counts.hospitalAttendanceEvents = await deleteAll(
    db,
    hospitalAttendanceEvents
  );
  counts.doctorHospitalInvitations = await deleteAll(
    db,
    doctorHospitalInvitations
  );
  counts.doctorHospitalAffiliations = await deleteAll(
    db,
    doctorHospitalAffiliations
  );
  counts.tenantAdmins = await deleteAll(db, tenantAdmins);
  counts.tenants = await deleteAll(db, tenants);

  counts.doctorCashoutRequests = await deleteAll(db, doctorCashoutRequests);
  counts.userSubscriptions = await deleteAll(db, userSubscriptions);

  counts.doctorPlans = await deleteAll(db, doctorPlans);
  counts.doctorWeeklyAvailability = await deleteAll(
    db,
    doctorWeeklyAvailability
  );
  counts.doctorScheduleEntries = await deleteAll(db, doctorScheduleEntries);
  counts.doctorEducationEntries = await deleteAll(db, doctorEducationEntries);
  counts.doctorFiles = await deleteAll(db, doctorFiles);
  counts.doctorCredits = await deleteAll(db, doctorCredits);

  counts.stressPredictions = await deleteAll(db, stressPredictions);
  counts.stressDownloadAcknowledgments = await deleteAll(
    db,
    stressDownloadAcknowledgments
  );

  counts.doctorProfiles = await deleteAll(db, doctorProfiles);
  counts.patientProfiles = await deleteAll(db, patientProfiles);

  return { kvFilesDeleted, kvManifestDeleted, dbRecords: counts };
}

async function deleteAll(
  db: ReturnType<typeof createDb>,
  table: any
): Promise<number> {
  const result = await db.delete(table).run();
  return (result as { meta?: { changes?: number } })?.meta?.changes ?? 0;
}
