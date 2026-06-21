import { faker } from "@faker-js/faker";
import type { createDb } from "@suwa/db";
import { doctorCashoutRequests, doctorCredits, doctorSessions } from "@suwa/db";
import { sql } from "drizzle-orm";

export async function seedCashouts(
  db: ReturnType<typeof createDb>,
  doctorIds: string[]
) {
  if (doctorIds.length === 0) {
    return { cashouts: 0 };
  }

  // Clean slate
  await db.delete(doctorCashoutRequests);

  const earnings = await db
    .select({
      doctorId: doctorSessions.doctorId,
      totalCents: sql<number>`coalesce(sum(${doctorSessions.doctorEarnedCents}), 0)`,
    })
    .from(doctorSessions)
    .groupBy(doctorSessions.doctorId);

  let cashoutCount = 0;
  const now = new Date().toISOString();

  for (const earning of earnings) {
    const totalEarned = Number(earning.totalCents);
    if (totalEarned <= 0) {
      continue;
    }

    let runningBalance = totalEarned;
    let runningCashedOut = 0;

    const requestCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < requestCount; i++) {
      const status = faker.helpers.arrayElement([
        "completed",
        "completed",
        "completed",
        "pending",
        "failed",
      ]);
      const maxAmount = Math.max(5000, runningBalance);
      const amount =
        status === "completed"
          ? Math.min(
              faker.number.int({ min: 5000, max: maxAmount }),
              runningBalance
            )
          : faker.number.int({ min: 5000, max: maxAmount });

      await db.insert(doctorCashoutRequests).values({
        id: crypto.randomUUID(),
        doctorId: earning.doctorId,
        amountCents: amount,
        status,
        stripeTransferId:
          status === "completed" ? `tr_${faker.string.alphanumeric(24)}` : null,
        failureReason:
          status === "failed"
            ? faker.helpers.arrayElement([
                "Insufficient funds",
                "Bank account verification failed",
                "Transfer limit exceeded",
                "Account not found",
              ])
            : null,
        createdAt: now,
        updatedAt: now,
      });

      if (status === "completed") {
        runningBalance -= amount;
        runningCashedOut += amount;
      }

      cashoutCount++;
    }

    await db
      .update(doctorCredits)
      .set({
        balanceCents: Math.max(0, runningBalance),
        totalEarnedCents: totalEarned,
        totalCashedOutCents: runningCashedOut,
        updatedAt: now,
      })
      .where(sql`${doctorCredits.doctorId} = ${earning.doctorId}`);
  }

  return { cashouts: cashoutCount };
}
