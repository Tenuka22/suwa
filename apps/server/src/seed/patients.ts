import type { createDb } from "@doca/db";
import {
  moonlightCredits,
  patientProfiles,
  stressDownloadAcknowledgments,
  stressPredictions,
  userCredits,
} from "@doca/db";
import { faker } from "@faker-js/faker";
import { inArray } from "drizzle-orm";

export async function seedPatients(db: ReturnType<typeof createDb>) {
  const existing = await db
    .select({ userId: patientProfiles.userId })
    .from(patientProfiles);

  if (existing.length > 0) {
    return {
      created: 0,
      existing: existing.length,
      userIds: existing.map((p) => p.userId),
    };
  }

  const patients: Array<{
    userId: string;
    alias: string;
    isOnboardingComplete: boolean;
    secured: boolean;
  }> = [];
  const count = 8;

  for (let i = 0; i < count; i++) {
    const userId = crypto.randomUUID();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    patients.push({
      userId,
      alias: faker.helpers.arrayElement([
        `${firstName}${lastName.charAt(0)}`,
        `${firstName}_${faker.word.adjective()}`,
        `${faker.word.adjective()}${faker.word.noun()}`,
        `${firstName}.${faker.number.int({ min: 1, max: 99 })}`,
      ]),
      isOnboardingComplete: faker.datatype.boolean(0.8),
      secured: faker.datatype.boolean(0.3),
    });
  }

  await db.insert(patientProfiles).values(patients);



  return {
    created: patients.length,
    existing: 0,
    userIds: patients.map((p) => p.userId),
  };
}

export async function seedPatientRelations(
  db: ReturnType<typeof createDb>,
  patientIds: string[]
) {
  if (patientIds.length === 0) {
    return { credits: 0, moonlight: 0, stress: 0, acknowledgments: 0 };
  }

  const existingCreditUsers = await db
    .select({ userId: userCredits.userId })
    .from(userCredits)
    .where(inArray(userCredits.userId, patientIds));
  const existingMoonlightUsers = await db
    .select({ userId: moonlightCredits.userId })
    .from(moonlightCredits)
    .where(inArray(moonlightCredits.userId, patientIds));
  const existingStressPatients = await db
    .select({ userId: stressPredictions.userId })
    .from(stressPredictions)
    .where(inArray(stressPredictions.userId, patientIds));

  const existingCreditSet = new Set(existingCreditUsers.map((r) => r.userId));
  const existingMoonlightSet = new Set(
    existingMoonlightUsers.map((r) => r.userId)
  );
  const existingStressSet = new Set(
    existingStressPatients.map((r) => r.userId)
  );

  let creditCount = 0;
  let moonlightCount = 0;
  let stressCount = 0;
  let ackCount = 0;

  for (const userId of patientIds) {
    // User credits
    if (!existingCreditSet.has(userId)) {
      await db.insert(userCredits).values({
        userId,
        balance: faker.number.int({ min: 0, max: 50 }),
      });
      creditCount++;
    }

    // Moonlight credits
    if (!existingMoonlightSet.has(userId)) {
      await db.insert(moonlightCredits).values({
        userId,
        balance: faker.number.int({ min: 0, max: 100 }),
        totalEarned: faker.number.int({ min: 50, max: 500 }),
        consistencyScore: faker.number.int({ min: 0, max: 100 }),
      });
      moonlightCount++;
    }

    // Stress predictions
    if (!existingStressSet.has(userId)) {
      const predictionCount = faker.number.int({ min: 1, max: 5 });
      for (let p = 0; p < predictionCount; p++) {
        await db.insert(stressPredictions).values({
          id: crypto.randomUUID(),
          userId,
          prediction: faker.helpers.arrayElement(["low", "moderate", "high"]),
          predictedClass: faker.helpers.arrayElement([0, 1, 2]).toString(),
          probabilities: JSON.stringify(
            Array.from({ length: 3 }, () =>
              faker.number.float({ min: 0, max: 1 })
            )
          ),
          sampleCount: faker.number.int({ min: 100, max: 500 }),
          createdAt: faker.date.recent({ days: 30 }).toISOString(),
          updatedAt: faker.date.recent({ days: 7 }).toISOString(),
        });
      }
      stressCount += predictionCount;
    }

    // Stress download acknowledgment
    if (faker.datatype.boolean(0.6)) {
      await db.insert(stressDownloadAcknowledgments).values({
        userId,
        patientAcknowledgedAt: faker.date.recent({ days: 14 }).toISOString(),

      });
      ackCount++;
    }
  }

  return {
    credits: creditCount,
    moonlight: moonlightCount,
    stress: stressCount,
    acknowledgments: ackCount,
  };
}

export async function getPatientIds(db: ReturnType<typeof createDb>) {
  const result = await db
    .select({ userId: patientProfiles.userId })
    .from(patientProfiles);
  return result.map((r) => r.userId);
}
