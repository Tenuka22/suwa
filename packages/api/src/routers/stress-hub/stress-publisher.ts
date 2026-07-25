import { env } from "@suwa/env/server";

export interface RawSample {
  sample: number[];
  timestamp: number;
}

export interface StoredPrediction {
  predictedClass: string;
  probabilities: number[];
  sampleCount: number;
  timestamp: number;
  windowStart: number;
}

export interface StressBundle {
  bundleId: string;
  createdAt: number;
  prediction: StoredPrediction | null;
  samples: RawSample[];
}

export type StressStreamEvent =
  | {
      type: "state";
      bundles: StressBundle[];
      totalSamples: number;
      buffered: number;
    }
  | {
      type: "bundle";
      data: StressBundle;
    }
  | {
      type: "progress";
      buffered: number;
      totalSamples: number;
    };

const REDIS_EVENTS_KEY_PREFIX = "stress:events:";
const POLL_INTERVAL_MS = 500;

async function redisCommand<T>(cmd: string[]): Promise<T> {
  const response = await fetch(env.UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
  });
  if (!response.ok) {
    throw new Error(`Redis error: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as { result?: T; error?: string };
  if (data.error) throw new Error(`Redis error: ${data.error}`);
  return data.result as T;
}

export const stressPublisher = {
  async publish(userId: string, event: StressStreamEvent): Promise<void> {
    const key = `${REDIS_EVENTS_KEY_PREFIX}${userId}`;
    const raw = JSON.stringify(event);
    await Promise.allSettled([
      redisCommand(["RPUSH", key, raw]),
      redisCommand(["EXPIRE", key, "60"]),
      redisCommand(["LTRIM", key, "-100", "-1"]),
    ]);
  },

  subscribe(
    userId: string,
    options?: { signal?: AbortSignal }
  ): AsyncGenerator<StressStreamEvent> {
    const signal = options?.signal;
    const key = `${REDIS_EVENTS_KEY_PREFIX}${userId}`;

    let running = !signal?.aborted;

    const abortHandler = () => {
      running = false;
    };
    if (signal && !signal.aborted) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }

    const iter = {
      [Symbol.asyncIterator]() {
        return iter;
      },
      async next(): Promise<IteratorResult<StressStreamEvent>> {
        while (running) {
          try {
            const raw = await redisCommand<string | null>(["LPOP", key]);
            if (raw !== null) {
              return {
                done: false,
                value: JSON.parse(raw) as StressStreamEvent,
              };
            }
          } catch {
            // poll failed, wait and retry
          }
          await new Promise((resolve) =>
            setTimeout(resolve, POLL_INTERVAL_MS)
          );
        }
        return { done: true, value: undefined as never };
      },
      async return(): Promise<IteratorResult<StressStreamEvent>> {
        running = false;
        signal?.removeEventListener("abort", abortHandler);
        return { done: true, value: undefined as never };
      },
      async throw(
        err?: unknown
      ): Promise<IteratorResult<StressStreamEvent>> {
        running = false;
        signal?.removeEventListener("abort", abortHandler);
        throw err;
      },
    };

    return iter as unknown as AsyncGenerator<StressStreamEvent>;
  },
};
