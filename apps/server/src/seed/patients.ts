import { faker } from "@faker-js/faker";
import type { createDb } from "@zen-doc/db";
import {
  guardianProfiles,
  moonlightCredits,
  patientProfiles,
  stressDownloadAcknowledgments,
  stressPredictions,
  userCredits,
} from "@zen-doc/db";

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

  for (const patient of patients) {
    await db.insert(userCredits).values({
      userId: patient.userId,
      balance: faker.number.int({ min: 0, max: 50 }),
    });

    await db.insert(moonlightCredits).values({
      userId: patient.userId,
      balance: faker.number.int({ min: 0, max: 100 }),
      totalEarned: faker.number.int({ min: 50, max: 500 }),
      consistencyScore: faker.number.int({ min: 0, max: 100 }),
    });

    // Stress predictions
    const predictionCount = faker.number.int({ min: 1, max: 5 });
    for (let p = 0; p < predictionCount; p++) {
      await db.insert(stressPredictions).values({
        id: crypto.randomUUID(),
        userId: patient.userId,
        prediction: faker.helpers.arrayElement([
          "low",
          "moderate",
          "high",
        ]),
        predictedClass: faker.helpers.arrayElement([0, 1, 2]).toString(),
        probabilities: JSON.stringify(
          Array.from({ length: 3 }, () => faker.number.float({ min: 0, max: 1 }))
        ),
        sampleCount: faker.number.int({ min: 100, max: 500 }),
        createdAt: faker.date.recent({ days: 30 }).toISOString(),
        updatedAt: faker.date.recent({ days: 7 }).toISOString(),
      });
    }

    // Stress download acknowledgment
    if (faker.datatype.boolean(0.6)) {
      await db.insert(stressDownloadAcknowledgments).values({
        userId: patient.userId,
        patientAcknowledgedAt: faker.date.recent({ days: 14 }).toISOString(),
        guardianAcknowledgedAt: faker.datatype.boolean(0.3)
          ? faker.date.recent({ days: 7 }).toISOString()
          : null,
      });
    }
  }

  // Guardian profiles
  for (let i = 0; i < 3; i++) {
    await db.insert(guardianProfiles).values({
      clerkUserId: crypto.randomUUID(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
    });
  }

  return {
    created: patients.length,
    existing: 0,
    userIds: patients.map((p) => p.userId),
  };
}

export async function getPatientIds(db: ReturnType<typeof createDb>) {
  const result = await db
    .select({ userId: patientProfiles.userId })
    .from(patientProfiles);
  return result.map((r) => r.userId);
}
