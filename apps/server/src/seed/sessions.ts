import { faker } from "@faker-js/faker";
import type { createDb } from "@zen-doc/db";
import {
  creditTransactions,
  doctorSessions,
  sessionAttendanceEvents,
  sessionSnapshots,
  sessionTaskAssignments,
  userCredits,
} from "@zen-doc/db";
import { eq, sql } from "drizzle-orm";

const SESSION_STATUSES = [
  "requested",
  "rescheduled",
  "approved",
  "attended",
  "timing_balance_failure",
] as const;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

export async function seedSessions(
  db: ReturnType<typeof createDb>,
  doctorIds: string[],
  patientIds: string[]
) {
  if (doctorIds.length === 0 || patientIds.length === 0) {
    return { created: 0 };
  }

  const existing = await db
    .select({ id: doctorSessions.id })
    .from(doctorSessions);
  if (existing.length > 0) {
    return { created: 0 };
  }

  const sessions: Array<{
    id: string;
    doctorId: string;
    patientId: string;
    startAt: string;
    endAt: string;
    status: (typeof SESSION_STATUSES)[number];
    creditCost: number;
    doctorEarnedCents: number | null;
    payoutStatus: "none" | "pending" | "completed";
    payoutAmount: number | null;
  }> = [];
  const count = faker.number.int({ min: 8, max: 15 });
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const doctorId = faker.helpers.arrayElement(doctorIds);
    const patientId = faker.helpers.arrayElement(patientIds);
    const daysOffset = faker.number.int({ min: -30, max: 30 });
    const startAt = addDays(now, daysOffset);
    startAt.setHours(faker.number.int({ min: 8, max: 17 }), 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setMinutes(endAt.getMinutes() + 50);

    let status: (typeof SESSION_STATUSES)[number];
    if (daysOffset < 0) {
      status = faker.helpers.arrayElement([
        "attended",
        "attended",
        "timing_balance_failure",
      ]);
    } else if (daysOffset === 0) {
      status = faker.helpers.arrayElement([
        "approved",
        "approved",
        "requested",
      ]);
    } else {
      status = faker.helpers.arrayElement([
        "requested",
        "approved",
        "rescheduled",
      ]);
    }

    const creditCost = faker.helpers.arrayElement([1, 2, 3]);
    const isAttended = status === "attended";

    sessions.push({
      id: crypto.randomUUID(),
      doctorId,
      patientId,
      startAt: formatDate(startAt),
      endAt: formatDate(endAt),
      status,
      creditCost,
      doctorEarnedCents: isAttended
        ? faker.number.int({ min: 2000, max: 10_000 })
        : null,
      payoutStatus: isAttended
        ? faker.helpers.arrayElement(["none", "pending", "completed"] as const)
        : "none",
      payoutAmount: isAttended
        ? faker.number.int({ min: 2000, max: 10_000 })
        : null,
    });
  }

  // Batch insert to stay under D1's 100-variable limit
  const BATCH_SIZE = 3;
  for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
    await db.insert(doctorSessions).values(sessions.slice(i, i + BATCH_SIZE));
  }

  for (const session of sessions) {
    if (session.status === "attended") {
      await db.insert(creditTransactions).values({
        id: crypto.randomUUID(),
        userId: session.patientId,
        amount: -session.creditCost,
        type: "session",
        sessionId: session.id,
      });

      await db
        .update(userCredits)
        .set({
          balance: sql`${userCredits.balance} - ${session.creditCost}`,
        })
        .where(eq(userCredits.userId, session.patientId));
    }

    // Session task assignments
    const taskCount = faker.number.int({ min: 0, max: 3 });
    for (let t = 0; t < taskCount; t++) {
      await db.insert(sessionTaskAssignments).values({
        id: crypto.randomUUID(),
        sessionId: session.id,
        doctorId: session.doctorId,
        patientId: session.patientId,
        taskKey: faker.helpers.arrayElement([
          "journal",
          "meditation",
          "exercise",
          "breathing",
          "gratitude",
        ]),
        title: faker.helpers.arrayElement([
          "Daily journal entry",
          "10-min meditation",
          "Walk for 20 minutes",
          "Breathing exercise",
          "Gratitude list",
        ]),
        minutes: faker.number.int({ min: 5, max: 30 }),
        points: faker.number.int({ min: 1, max: 10 }),
        rewardLabel: faker.helpers.arrayElement([
          "Moonlight Credit",
          "Wellness Point",
          "Streak Bonus",
        ]),
        status: faker.helpers.arrayElement([
          "assigned",
          "completed",
          "skipped",
        ]),
      });
    }

    // Session attendance events
    if (session.status === "attended") {
      const startDate = new Date(session.startAt);
      await db.insert(sessionAttendanceEvents).values({
        id: crypto.randomUUID(),
        sessionId: session.id,
        participantId: session.patientId,
        participantType: "patient",
        event: "joined",
        timestamp: startDate.toISOString(),
      });
      await db.insert(sessionAttendanceEvents).values({
        id: crypto.randomUUID(),
        sessionId: session.id,
        participantId: session.doctorId,
        participantType: "doctor",
        event: "joined",
        timestamp: startDate.toISOString(),
      });
    }

    // Session snapshots
    if (session.status === "attended" && faker.datatype.boolean(0.5)) {
      await db.insert(sessionSnapshots).values({
        id: crypto.randomUUID(),
        sessionId: session.id,
        capturedAt: new Date(session.startAt).toISOString(),
        participantType: "doctor",
        reason: "session_start",
      });
    }
  }

  return { created: sessions.length };
}
