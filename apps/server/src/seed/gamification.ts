import { faker } from "@faker-js/faker";
import type { createDb } from "@zen-doc/db";
import {
  moonlightCreditTransactions,
  spriteStates,
  wellnessActions,
} from "@zen-doc/db";
import { eq } from "drizzle-orm";

const WELLNESS_ACTION_TYPES = [
  "breathing_morning",
  "breathing_evening",
  "breathing_night",
  "meditation_morning",
  "meditation_evening",
] as const;

const MOODS = ["idle", "sleep", "yawn", "happy", "sad"] as const;

export async function seedGamification(
  db: ReturnType<typeof createDb>,
  userIds: string[]
) {
  if (userIds.length === 0) {
    return { sprites: 0, wellness: 0, credits: 0 };
  }

  let spriteCount = 0;
  let wellnessCount = 0;
  let creditTxnCount = 0;

  for (const userId of userIds) {
    const existingSprite = await db
      .select({ userId: spriteStates.userId })
      .from(spriteStates)
      .where(eq(spriteStates.userId, userId));

    if (existingSprite.length === 0) {
      await db.insert(spriteStates).values({
        userId,
        health: faker.number.int({ min: 30, max: 100 }),
        mood: faker.helpers.arrayElement([...MOODS]),
        streakDays: faker.number.int({ min: 0, max: 30 }),
        lastInteractionAt: faker.date.recent({ days: 7 }).toISOString(),
      });
      spriteCount++;
    }

    const actionCount = faker.number.int({ min: 0, max: 5 });
    for (let i = 0; i < actionCount; i++) {
      await db.insert(wellnessActions).values({
        id: crypto.randomUUID(),
        userId,
        actionType: faker.helpers.arrayElement([...WELLNESS_ACTION_TYPES]),
        completedAt: faker.date.recent({ days: 14 }).toISOString(),
        durationSeconds: faker.number.int({ min: 60, max: 1800 }),
        creditsEarned: faker.number.int({ min: 1, max: 5 }),
      });
      wellnessCount++;
    }

    const txnCount = faker.number.int({ min: 0, max: 3 });
    for (let i = 0; i < txnCount; i++) {
      await db.insert(moonlightCreditTransactions).values({
        id: crypto.randomUUID(),
        userId,
        amount: faker.number.int({ min: 1, max: 10 }),
        type: faker.helpers.arrayElement(["earned", "bonus"] as const),
        reason: faker.helpers.arrayElement([
          "Daily wellness check-in",
          "Meditation streak bonus",
          "Consistency reward",
          "Wellness action completed",
          "Sleep tracking milestone",
        ]),
      });
      creditTxnCount++;
    }
  }

  return {
    sprites: spriteCount,
    wellness: wellnessCount,
    credits: creditTxnCount,
  };
}
