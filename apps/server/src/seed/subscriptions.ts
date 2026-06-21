import { faker } from "@faker-js/faker";
import type { createDb } from "@suwa/db";
import { doctorPlans, userSubscriptions } from "@suwa/db";

const SUBSCRIPTION_STATUSES = [
  "active",
  "active",
  "active",
  "canceled",
  "past_due",
  "trialing",
] as const;

export async function seedSubscriptions(
  db: ReturnType<typeof createDb>,
  userIds: string[]
) {
  // Clean slate
  await db.delete(userSubscriptions);

  const plans = await db
    .select({
      id: doctorPlans.id,
      doctorId: doctorPlans.doctorId,
      priceCents: doctorPlans.priceCents,
    })
    .from(doctorPlans);

  if (plans.length === 0) {
    return { subscriptions: 0 };
  }

  let count = 0;
  for (const userId of userIds) {
    if (!faker.datatype.boolean(0.6)) {
      continue;
    }
    const plan = faker.helpers.arrayElement(plans);
    const startDate = faker.date.recent({ days: 60 });
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    const status = faker.helpers.arrayElement(SUBSCRIPTION_STATUSES);

    await db.insert(userSubscriptions).values({
      id: crypto.randomUUID(),
      userId,
      planId: plan.id,
      stripeSubscriptionId:
        status === "trialing" ? null : `sub_${faker.string.alphanumeric(24)}`,
      status,
      currentPeriodStart: startDate.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      cancelAtPeriodEnd: faker.datatype.boolean(0.2),
      createdAt: startDate.toISOString(),
      updatedAt: new Date().toISOString(),
    });
    count++;
  }

  return { subscriptions: count };
}
