import { stressDownloadAcknowledgments } from "@suwa/db";
import { eq } from "drizzle-orm";

import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { BUNDLE_LIST_KEY, BUNDLE_TTL_SECONDS, getRedis } from "../simulation";

const ONE_DAY = 86_400;

export const acknowledgeDownloadRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);
    const redis = getRedis();

    const now = new Date().toISOString();

    await context.db
      .insert(stressDownloadAcknowledgments)
      .values({
        userId,
        patientAcknowledgedAt: now,
      })
      .onConflictDoUpdate({
        target: stressDownloadAcknowledgments.userId,
        set: { patientAcknowledgedAt: now, updatedAt: now },
      });

    const ackRecord = await context.db
      .select()
      .from(stressDownloadAcknowledgments)
      .where(eq(stressDownloadAcknowledgments.userId, userId))
      .limit(1);

    const record = ackRecord[0];

    const bundleKey = `${BUNDLE_LIST_KEY}${userId}`;

    const patientAcked = Boolean(record?.patientAcknowledgedAt);

    if (patientAcked) {
      await redis.expire(bundleKey, ONE_DAY);
    } else {
      await redis.expire(bundleKey, BUNDLE_TTL_SECONDS);
    }

    return {
      acknowledged: true,
      ttlAdjusted: patientAcked ? ONE_DAY : BUNDLE_TTL_SECONDS,
      patientAcked,
    };
  }
);
