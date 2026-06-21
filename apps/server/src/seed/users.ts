import type { createDb } from "@suwa/db";
import { doctorProfiles, patientProfiles } from "@suwa/db";

export const TARGET_DOCTOR_COUNT = 5;
export const TARGET_PATIENT_COUNT = 5;

export interface ResolvedUsers {
  doctorIds: string[];
  patientIds: string[];
}

export async function resolveUsers(
  db: ReturnType<typeof createDb>
): Promise<ResolvedUsers> {
  const existingDoctors = await db
    .select({ userId: doctorProfiles.userId })
    .from(doctorProfiles);
  const existingPatients = await db
    .select({ userId: patientProfiles.userId })
    .from(patientProfiles);

  const dbDoctorIds = existingDoctors.map((d) => d.userId);
  const dbPatientIds = existingPatients.map((p) => p.userId);
  const allRealIds = [...new Set([...dbDoctorIds, ...dbPatientIds])];

  // Never let doctor & patient arrays share the same ID — they represent
  // distinct roles. Duplicate IDs cause shallow seeding (no plans, education, etc.)
  const usedForDoc = new Set<string>();
  const usedForPatient = new Set<string>();

  // Distribute real IDs: prefer doctor role for earlier IDs, patient for later
  for (let i = 0; i < allRealIds.length; i++) {
    const id = allRealIds[i]!;
    if (i < Math.ceil(allRealIds.length / 2)) {
      usedForDoc.add(id);
    } else {
      usedForPatient.add(id);
    }
  }

  // Supplement to reach target counts
  const doctorIds: string[] = [...usedForDoc];
  while (doctorIds.length < TARGET_DOCTOR_COUNT) {
    const newId = crypto.randomUUID();
    if (!usedForPatient.has(newId)) {
      doctorIds.push(newId);
    }
  }

  const patientIds: string[] = [...usedForPatient];
  while (patientIds.length < TARGET_PATIENT_COUNT) {
    const newId = crypto.randomUUID();
    if (!usedForDoc.has(newId)) {
      patientIds.push(newId);
    }
  }

  return { doctorIds, patientIds };
}
