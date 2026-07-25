import { env } from "@suwa/env/native";
import { authClient } from "@/utils/better-auth";

import type { StressBundle } from "@/utils/stress-storage";

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

function getBaseUrl(): string {
  return env.EXPO_PUBLIC_SERVER_URL.replace(/\/$/, "");
}

function parseSSEData(raw: string): StressStreamEvent | null {
  if (!raw.startsWith("data: ")) return null;
  try {
    return JSON.parse(raw.slice(6)) as StressStreamEvent;
  } catch {
    return null;
  }
}

export async function subscribeStressStreamSSE(
  options: { signal?: AbortSignal } = {}
): Promise<AsyncGenerator<StressStreamEvent>> {
  return nativeFetchStream(
    `${getBaseUrl()}/api/iot/stress-stream`,
    options.signal
  );
}

async function* nativeFetchStream(
  url: string,
  signal?: AbortSignal
): AsyncGenerator<StressStreamEvent> {
  const cookies = authClient.getCookie();
  const headers: Record<string, string> = {};
  if (cookies) {
    headers["Cookie"] = cookies;
  }

  const response = await fetch(url, { headers, signal });
  if (!response.ok) {
    throw new Error(`SSE request failed: ${response.status}`);
  }

  const body = response.body;
  if (!body || typeof body.getReader !== "function") {
    throw new Error("Response body streaming is not supported");
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const abortHandler = () => {
    reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", abortHandler, { once: true });

  try {
    while (!signal?.aborted) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;
        const parsed = parseSSEData(trimmed);
        if (parsed) {
          yield parsed;
        }
      }
    }
  } finally {
    reader.cancel().catch(() => {});
    signal?.removeEventListener("abort", abortHandler);
  }
}
