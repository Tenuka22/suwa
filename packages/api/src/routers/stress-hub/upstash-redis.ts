export class UpstashRedis {
  private url: string;
  private token: string;

  constructor(config: { url: string; token: string }) {
    this.url = config.url.startsWith("http")
      ? config.url
      : `https://${config.url}`;
    this.token = config.token;
  }

  private async command<T>(cmd: string[]): Promise<T> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cmd),
    });
    if (!response.ok) {
      throw new Error(
        `Redis error: ${response.status} ${await response.text()}`
      );
    }
    const data = (await response.json()) as { result?: T; error?: string };
    if (data.error) {
      throw new Error(`Redis error: ${data.error}`);
    }
    return data.result as T;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<"OK"> {
    if (ttlSeconds) {
      return this.command(["SET", key, value, "EX", String(ttlSeconds)]);
    }
    return this.command(["SET", key, value]);
  }

  async get(key: string): Promise<string | null> {
    return this.command(["GET", key]);
  }

  async del(key: string): Promise<number> {
    return this.command(["DEL", key]);
  }

  async exists(key: string): Promise<number> {
    return this.command(["EXISTS", key]);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.command(["EXPIRE", key, String(seconds)]);
  }

  async rpush(key: string, value: string): Promise<number> {
    return this.command(["RPUSH", key, value]);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.command(["LRANGE", key, String(start), String(stop)]);
  }

  async llen(key: string): Promise<number> {
    return this.command(["LLEN", key]);
  }

  async ltrim(key: string, start: number, stop: number): Promise<"OK"> {
    return this.command(["LTRIM", key, String(start), String(stop)]);
  }

  async incr(key: string): Promise<number> {
    return this.command(["INCR", key]);
  }
}
