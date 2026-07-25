import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { RedisSampleStore } from "../redis-sample-store";
import { getBundles, getRedis } from "../simulation";
import { stressPublisher } from "../stress-publisher";

export const subscribeStressStreamRoute = protectedProcedure.handler(
  async function* ({ context, signal }) {
    const { userId } = requireAuth(context);
    console.log(`[SUBSCRIBE] User ${userId} subscribed to stress stream`);

    const redis = getRedis();
    const store = new RedisSampleStore(redis);

    const [bundles, buf] = await Promise.all([
      getBundles(redis, userId, 100),
      store.getBuffer(userId),
    ]);

    console.log(`[SUBSCRIBE] Initial state: ${bundles.length} bundles, buffered=${buf?.buffered ?? 0}`);

    yield {
      type: "state",
      bundles,
      totalSamples: buf?.totalSamples ?? 0,
      buffered: buf?.buffered ?? 0,
    } as const;

    signal?.addEventListener("abort", () => {
      console.log(`[SUBSCRIBE] Signal aborted for user ${userId}, reason:`, (signal as any).reason?.message ?? "unknown");
    }, { once: true });

    const publisherIterator = stressPublisher.subscribe(userId, { signal });
    let exitReason = "unknown";

    try {
      while (!signal?.aborted) {
        const result = await publisherIterator.next().catch((err) => {
          exitReason = `publisher_iterator_rejected: ${err?.message ?? err}`;
          return { value: undefined, done: true } as const;
        });
        if (result.done) {
          if (exitReason === "unknown") exitReason = "publisher_iterator_done";
          break;
        }
        if (result.value) {
          console.log(`[SUBSCRIBE] Yielding event type=${(result.value as any)?.type} for user ${userId}`);
          yield result.value;
        }
      }
    } finally {
      console.log(`[SUBSCRIBE] User ${userId} unsubscribed, reason=${exitReason}, signalAborted=${signal?.aborted ?? false}`);
      await publisherIterator.return().catch(() => {});
    }
  }
);
