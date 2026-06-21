import { faker } from "@faker-js/faker";
import type { createDb } from "@suwa/db";
import {
  doctorPlans,
  doctorSessions,
  sessionAttendanceEvents,
  sessionSnapshots,
  sessionTaskAssignments,
} from "@suwa/db";

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

export interface SessionSeedResult {
  attendanceEvents: number;
  sessions: number;
  snapshots: number;
  tasks: number;
}

export async function seedSessions(
  db: ReturnType<typeof createDb>,
  doctorIds: string[],
  patientIds: string[]
): Promise<SessionSeedResult> {
  if (doctorIds.length === 0 || patientIds.length === 0) {
    return { sessions: 0, tasks: 0, attendanceEvents: 0, snapshots: 0 };
  }

  // Clean slate — delete all session data to rebuild cleanly each run
  await db.delete(sessionTaskAssignments);
  await db.delete(sessionAttendanceEvents);
  await db.delete(sessionSnapshots);
  await db.delete(doctorSessions);

  const plans = await db
    .select({
      id: doctorPlans.id,
      doctorId: doctorPlans.doctorId,
      priceCents: doctorPlans.priceCents,
    })
    .from(doctorPlans);

  let sessionCount = 0;
  let taskCount = 0;
  let attendanceCount = 0;
  let snapshotCount = 0;

  for (const doctorId of doctorIds) {
    for (const patientId of patientIds) {
      const pairCount = faker.number.int({ min: 1, max: 3 });
      const now = new Date();

      for (let s = 0; s < pairCount; s++) {
        const sessionId = crypto.randomUUID();
        const daysOffset = faker.number.int({ min: -45, max: 14 });
        const startAt = addDays(now, daysOffset);
        startAt.setHours(faker.number.int({ min: 9, max: 16 }), 0, 0, 0);
        const endAt = new Date(startAt);
        endAt.setMinutes(endAt.getMinutes() + 50);

        let status: (typeof SESSION_STATUSES)[number];
        if (daysOffset < -1) {
          status = faker.helpers.arrayElement([
            "attended",
            "attended",
            "timing_balance_failure",
          ]);
        } else if (daysOffset === -1 || daysOffset === 0) {
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

        const doctorPlansForDoc = plans.filter((p) => p.doctorId === doctorId);
        const plan =
          doctorPlansForDoc.length > 0
            ? faker.helpers.arrayElement(doctorPlansForDoc)
            : null;

        const amountCents = plan?.priceCents ?? 3000;
        const doctorEarnedCents =
          status === "attended" ? Math.round(amountCents * 0.8) : null;

        await db.insert(doctorSessions).values({
          id: sessionId,
          doctorId,
          patientId,
          planId: plan?.id ?? null,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          status,
          creditCost: 0,
          amountCents,
          paymentIntentId:
            status === "attended"
              ? `pi_${faker.string.alphanumeric(24)}`
              : null,
          doctorEarnedCents,
          payoutStatus: doctorEarnedCents ? "pending" : "none",
          payoutTransferId: null,
          payoutAmount: doctorEarnedCents,
          createdAt: faker.date.recent({ days: 60 }).toISOString(),
          updatedAt: new Date().toISOString(),
        });
        sessionCount++;

        // Tasks
        const numTasks = faker.number.int({ min: 1, max: 3 });
        for (let t = 0; t < numTasks; t++) {
          await db.insert(sessionTaskAssignments).values({
            id: crypto.randomUUID(),
            sessionId,
            doctorId,
            patientId,
            taskKey: faker.helpers.arrayElement([
              "journal",
              "meditation",
              "exercise",
              "breathing",
              "gratitude",
            ]),
            title: faker.helpers.arrayElement([
              "Daily journal entry",
              "10-minute meditation",
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
            createdAt: startAt.toISOString(),
            updatedAt: new Date().toISOString(),
          });
          taskCount++;
        }

        // Attendance events
        if (status === "attended") {
          await db.insert(sessionAttendanceEvents).values({
            id: crypto.randomUUID(),
            sessionId,
            participantId: patientId,
            participantType: "patient",
            event: "joined",
            timestamp: startAt.toISOString(),
          });
          await db.insert(sessionAttendanceEvents).values({
            id: crypto.randomUUID(),
            sessionId,
            participantId: doctorId,
            participantType: "doctor",
            event: "joined",
            timestamp: startAt.toISOString(),
          });
          attendanceCount += 2;
        }

        // Snapshots
        if (status === "attended" && faker.datatype.boolean(0.5)) {
          await db.insert(sessionSnapshots).values({
            id: crypto.randomUUID(),
            sessionId,
            capturedAt: startAt.toISOString(),
            participantType: "doctor",
            reason: "session_start",
          });
          snapshotCount++;
        }
      }
    }
  }

  return {
    sessions: sessionCount,
    tasks: taskCount,
    attendanceEvents: attendanceCount,
    snapshots: snapshotCount,
  };
}
