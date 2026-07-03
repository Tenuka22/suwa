import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { RedisSampleStore } from "../redis-sample-store";
import { getBundles, getRedis } from "../simulation";

export const getStressDataRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);
    const redis = getRedis();
    const store = new RedisSampleStore(redis);

    const [bundles, buf] = await Promise.all([
      getBundles(redis, userId, 100),
      store.getBuffer(userId),
    ]);

    return {
      bundles,
      totalSamples: buf?.totalSamples ?? 0,
      fetchedAt: Date.now(),
    };
  }
);
