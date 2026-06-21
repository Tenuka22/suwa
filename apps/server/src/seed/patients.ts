import { faker } from "@faker-js/faker";
import type { createDb } from "@suwa/db";
import {
  patientProfiles,
  stressDownloadAcknowledgments,
  stressPredictions,
} from "@suwa/db";
import { inArray } from "drizzle-orm";
import { PATIENT_PROFILE_SPECS } from "../data-specs/profiles";

export interface PatientSeedResult {
  acknowledgments: number;
  profiles: number;
  stressPredictions: number;
}

export async function seedPatients(
  db: ReturnType<typeof createDb>,
  patientIds: string[]
): Promise<PatientSeedResult> {
  const existingPatients = await db
    .select({ userId: patientProfiles.userId })
    .from(patientProfiles);

  // Check for existing stress data to avoid PK conflicts on re-seed
  const existingAcks = new Set(
    (
      await db
        .select({ userId: stressDownloadAcknowledgments.userId })
        .from(stressDownloadAcknowledgments)
        .where(inArray(stressDownloadAcknowledgments.userId, patientIds))
    ).map((r) => r.userId)
  );

  const existingStressUserIds = new Set(
    (
      await db
        .select({ userId: stressPredictions.userId })
        .from(stressPredictions)
        .where(inArray(stressPredictions.userId, patientIds))
    ).map((r) => r.userId)
  );

  const count = Math.min(patientIds.length, PATIENT_PROFILE_SPECS.length);
  let createdCount = 0;
  let stressCount = 0;
  let ackCount = 0;

  for (let i = 0; i < count; i++) {
    const userId = patientIds[i];
    if (!userId) {
      continue;
    }
    const alias = PATIENT_PROFILE_SPECS[i]?.alias ?? `patient_${i}`;
    const now = new Date().toISOString();
    const isExisting = existingPatients.some((p) => p.userId === userId);

    if (!isExisting) {
      await db.insert(patientProfiles).values({
        userId,
        alias,
        isOnboardingComplete: true,
        secured: i < 2,
        createdAt: now,
        updatedAt: now,
      });
      createdCount++;
    }

    // Stress predictions — skip if user already has them
    if (!existingStressUserIds.has(userId)) {
      const predictionCount = 5 + i;
      for (let p = 0; p < predictionCount; p++) {
        const predDate = new Date();
        predDate.setDate(predDate.getDate() - (predictionCount - p) * 3);
        const predClass = faker.helpers.arrayElement([0, 1, 2]);
        const classLabels = ["low", "moderate", "high"];

        await db.insert(stressPredictions).values({
          id: crypto.randomUUID(),
          userId,
          prediction: classLabels[predClass] ?? "moderate",
          predictedClass: predClass.toString(),
          probabilities: JSON.stringify([
            faker.number.float({ min: 0.0, max: 0.4 }),
            faker.number.float({ min: 0.0, max: 0.6 }),
            faker.number.float({ min: 0.0, max: 0.8 }),
          ]),
          sampleCount: faker.number.int({ min: 200, max: 1000 }),
          createdAt: predDate.toISOString(),
          updatedAt: predDate.toISOString(),
        });
        stressCount++;
      }
    }

    // Stress download acknowledgment — skip if already exists (userId is PK)
    if (!existingAcks.has(userId) && faker.datatype.boolean(0.8)) {
      await db.insert(stressDownloadAcknowledgments).values({
        userId,
        patientAcknowledgedAt: faker.date.recent({ days: 14 }).toISOString(),
        createdAt: now,
        updatedAt: now,
      });
      ackCount++;
    }
  }

  return {
    profiles: createdCount,
    stressPredictions: stressCount,
    acknowledgments: ackCount,
  };
}
