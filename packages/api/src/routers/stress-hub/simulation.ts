import { env } from "@suwa/env/server";

export { stressPublisher } from "./stress-publisher";

import type {
  RawSample,
  StoredPrediction,
  StressBundle,
} from "./stress-publisher";

export type { RawSample, StoredPrediction, StressBundle };

import { expandTo11Features } from "./feature-expansion";
import { UpstashRedis } from "./upstash-redis";

export const SAMPLING_INTERVAL_MS = 250;
export const INTERVAL_TOLERANCE_RATIO = 0.5;
export const BUNDLE_TTL_SECONDS = 7 * 86_400;
export const BUNDLE_LIST_KEY = "stress:bundles:";
export const MAX_BUNDLES = 500;

export function getRedis(): UpstashRedis {
  return new UpstashRedis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export function isContinuouslyTimed(entries: { timestamp: number }[]): boolean {
  if (entries.length < 2) {
    return false;
  }

  const maxGap = SAMPLING_INTERVAL_MS * (1 + INTERVAL_TOLERANCE_RATIO);
  const validThreshold = 0.8;

  let validCount = 0;
  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];
    const prev = entries[i - 1];
    if (!(entry && prev)) {
      continue;
    }
    const gap = entry.timestamp - prev.timestamp;
    if (gap >= 0 && gap <= maxGap) {
      validCount++;
    }
  }

  return validCount / (entries.length - 1) >= validThreshold;
}

export interface PredictionResult {
  predictedClass: string;
  probabilities: number[];
}

export async function runPrediction(
  samples: number[][]
): Promise<PredictionResult | null> {
  if (samples.length < 2) {
    return null;
  }

  const flattened: number[] = [];
  for (const sample of samples) {
    const expanded = expandTo11Features(sample);
    flattened.push(...expanded);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(`${env.STRESS_PREDICTOR_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ window_samples: flattened }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as Record<string, unknown>;
    const results = (result?.results ?? result) as
      | Record<string, unknown>
      | undefined;
    const combined = results?.["0"] as
      | { prediction?: string; probabilities?: number[] }
      | undefined;

    if (!(combined?.prediction && combined?.probabilities)) {
      return null;
    }

    return {
      predictedClass: combined.prediction,
      probabilities: combined.probabilities,
    };
  } catch {
    return null;
  }
}

export async function saveBundle(
  redis: UpstashRedis,
  userId: string,
  samples: RawSample[],
  prediction: StoredPrediction | null
): Promise<void> {
  const listKey = `${BUNDLE_LIST_KEY}${userId}`;
  const bundle: StressBundle = {
    bundleId: `bundle_${Date.now()}`,
    samples,
    prediction,
    createdAt: Date.now(),
  };
  const value = JSON.stringify(bundle);
  await redis.rpush(listKey, value);
  await redis.ltrim(listKey, -MAX_BUNDLES, -1);
  await redis.expire(listKey, BUNDLE_TTL_SECONDS);
}

export async function getBundles(
  redis: UpstashRedis,
  userId: string,
  count = 100
): Promise<StressBundle[]> {
  const listKey = `${BUNDLE_LIST_KEY}${userId}`;
  const raw = await redis.lrange(listKey, -count, -1);
  const bundles: StressBundle[] = [];
  for (const entry of raw) {
    try {
      bundles.push(JSON.parse(entry) as StressBundle);
    } catch {
      // skip malformed
    }
  }
  return bundles;
}
