import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { RedisSampleStore } from "../redis-sample-store";
import { getBundles, getRedis } from "../simulation";
import { stressPublisher } from "../stress-publisher";

export const subscribeStressStreamRoute = protectedProcedure.handler(
  async function* ({ context, signal }) {
    const { userId } = requireAuth(context);
    const redis = getRedis();
    const store = new RedisSampleStore(redis);

    const [bundles, buf] = await Promise.all([
      getBundles(redis, userId, 100),
      store.getBuffer(userId),
    ]);

    yield {
      type: "state",
      bundles,
      totalSamples: buf?.totalSamples ?? 0,
      buffered: buf?.buffered ?? 0,
    } as const;

    const publisherIterator = stressPublisher.subscribe(userId, { signal });

    try {
      while (!signal?.aborted) {
        const { value, done } = await publisherIterator.next();
        if (done) {
          break;
        }
        if (value) {
          yield value;
        }
      }
    } finally {
      await publisherIterator.return();
    }
  }
);
