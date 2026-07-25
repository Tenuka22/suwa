import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getRedis } from "../simulation";
import type { StressStreamEvent } from "../stress-publisher";

export const pollStressEventsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);
    const redis = getRedis();
    const key = `stress:events:${userId}`;

    const raw = await redis.lrange(key, 0, -1);
    if (raw.length > 0) {
      await redis.del(key);
    }

    const events: StressStreamEvent[] = [];
    for (const entry of raw) {
      try {
        events.push(JSON.parse(entry) as StressStreamEvent);
      } catch {
        // skip malformed
      }
    }

    return { events };
  }
);