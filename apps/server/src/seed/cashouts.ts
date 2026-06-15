import type { createDb } from "@doca/db";
import { doctorCashoutRequests, doctorCredits } from "@doca/db";
import { faker } from "@faker-js/faker";
import { inArray } from "drizzle-orm";

const CASHOUT_STATUSES = ["pending", "completed", "failed"] as const;

export async function seedCashouts(
  db: ReturnType<typeof createDb>,
  doctorIds: string[]
) {
  if (doctorIds.length === 0) {
    return { cashouts: 0 };
  }

  const existing = await db
    .select({ id: doctorCashoutRequests.id })
    .from(doctorCashoutRequests);

  if (existing.length > 0) {
    return { cashouts: 0 };
  }

  const doctorCreditsList = await db
    .select({
      doctorId: doctorCredits.doctorId,
      balanceCents: doctorCredits.balanceCents,
      totalEarnedCents: doctorCredits.totalEarnedCents,
    })
    .from(doctorCredits)
    .where(inArray(doctorCredits.doctorId, doctorIds));

  const cashouts: Array<{
    id: string;
    doctorId: string;
    amountCents: number;
    status: (typeof CASHOUT_STATUSES)[number];
    stripeTransferId: string | null;
    failureReason: string | null;
  }> = [];

  for (const credit of doctorCreditsList) {
    const requestCount = faker.number.int({ min: 0, max: 3 });
    for (let i = 0; i < requestCount; i++) {
      const status = faker.helpers.arrayElement([
        ...CASHOUT_STATUSES,
        ...CASHOUT_STATUSES,
        "completed",
        "completed",
      ]);
      const amountCents = faker.number.int({
        min: Math.min(1000, credit.balanceCents),
        max: Math.max(1000, credit.balanceCents),
      });

      cashouts.push({
        id: crypto.randomUUID(),
        doctorId: credit.doctorId,
        amountCents,
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
      });
    }
  }

  if (cashouts.length > 0) {
    const BATCH_SIZE = 3;
    for (let i = 0; i < cashouts.length; i += BATCH_SIZE) {
      await db
        .insert(doctorCashoutRequests)
        .values(cashouts.slice(i, i + BATCH_SIZE));
    }
  }

  return { cashouts: cashouts.length };
}
