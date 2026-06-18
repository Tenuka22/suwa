import { faker } from "@faker-js/faker";
import type { createDb } from "@suwa/db";
import { doctorPlans, userSubscriptions } from "@suwa/db";

const SUBSCRIPTION_STATUSES = [
  "active",
  "canceled",
  "past_due",
  "trialing",
] as const;

export async function seedSubscriptions(
  db: ReturnType<typeof createDb>,
  userIds: string[]
) {
  if (userIds.length === 0) {
    return { subscriptions: 0 };
  }

  const existing = await db
    .select({ id: userSubscriptions.id })
    .from(userSubscriptions);

  if (existing.length > 0) {
    return { subscriptions: 0 };
  }

  const plans = await db
    .select({
      id: doctorPlans.id,
      doctorId: doctorPlans.doctorId,
      name: doctorPlans.name,
      priceCents: doctorPlans.priceCents,
    })
    .from(doctorPlans);

  if (plans.length === 0) {
    return { subscriptions: 0 };
  }

  const subscriptions: Array<{
    id: string;
    userId: string;
    planId: string;
    stripeSubscriptionId: string | null;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  }> = [];

  for (const userId of userIds) {
    if (faker.datatype.boolean(0.5)) {
      const plan = faker.helpers.arrayElement(plans);
      const startDate = faker.date.recent({ days: 60 });
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      const status = faker.helpers.arrayElement([
        ...SUBSCRIPTION_STATUSES,
        "active",
        "active",
        "active",
      ]);

      subscriptions.push({
        id: crypto.randomUUID(),
        userId,
        planId: plan.id,
        stripeSubscriptionId:
          status === "trialing" ? null : `sub_${faker.string.alphanumeric(24)}`,
        status,
        currentPeriodStart: startDate.toISOString(),
        currentPeriodEnd: endDate.toISOString(),
        cancelAtPeriodEnd: faker.datatype.boolean(0.2),
      });
    }
  }

  if (subscriptions.length > 0) {
    const BATCH_SIZE = 3;
    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      await db
        .insert(userSubscriptions)
        .values(subscriptions.slice(i, i + BATCH_SIZE));
    }
  }

  return { subscriptions: subscriptions.length };
}
