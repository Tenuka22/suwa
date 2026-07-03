import type { UpstashRedis } from "./upstash-redis";
import type { RawSample } from "./stress-publisher";

export const WINDOW_SIZE = 360;
export const RAW_SAMPLES_KEY = "stress:raw-samples:";
export const TOTAL_SAMPLES_KEY = "stress:total-samples:";
const BUFFER_TTL_SECONDS = 86_400;

export class RedisSampleStore {
  private redis: UpstashRedis;

  constructor(redis: UpstashRedis) {
    this.redis = redis;
  }

  async addSample(userId: string, sample: RawSample): Promise<boolean> {
    const listKey = `${RAW_SAMPLES_KEY}${userId}`;
    const countKey = `${TOTAL_SAMPLES_KEY}${userId}`;

    await this.redis.rpush(listKey, JSON.stringify(sample));
    await this.redis.incr(countKey);

    const len = await this.redis.llen(listKey);

    if (len === 1) {
      await this.redis.expire(listKey, BUFFER_TTL_SECONDS);
    }

    return len >= WINDOW_SIZE;
  }

  async popWindow(userId: string): Promise<RawSample[] | null> {
    const listKey = `${RAW_SAMPLES_KEY}${userId}`;

    const raw = await this.redis.lrange(listKey, 0, WINDOW_SIZE - 1);
    if (raw.length < WINDOW_SIZE) {
      return null;
    }

    await this.redis.ltrim(listKey, WINDOW_SIZE, -1);

    return raw.map((s) => JSON.parse(s) as RawSample);
  }

  async getBuffer(
    userId: string
  ): Promise<{ totalSamples: number; buffered: number } | null> {
    const listKey = `${RAW_SAMPLES_KEY}${userId}`;
    const countKey = `${TOTAL_SAMPLES_KEY}${userId}`;

    const [rawCount, buffered] = await Promise.all([
      this.redis.get(countKey),
      this.redis.llen(listKey),
    ]);

    const totalSamples = rawCount ? parseInt(rawCount, 10) : 0;

    if (totalSamples === 0 && buffered === 0) {
      return null;
    }

    return { totalSamples, buffered };
  }
}
