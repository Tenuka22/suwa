import { env } from "@suwa/env/native";
import { Platform } from "react-native";
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

function isWeb(): boolean {
  return Platform.OS === "web";
}

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
  const baseUrl = getBaseUrl();

  if (isWeb()) {
    return webPollEvents(`${baseUrl}/api/iot/stress-events`, options.signal);
  }

  return nativeFetchStream(`${baseUrl}/api/iot/stress-stream`, options.signal);
}

async function* webPollEvents(
  url: string,
  signal?: AbortSignal
): AsyncGenerator<StressStreamEvent> {
  const POLL_INTERVAL_MS = 2000;

  while (!signal?.aborted) {
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`Poll failed: ${response.status}`);
      }
      const data = (await response.json()) as { events: StressStreamEvent[] };
      for (const event of data.events) {
        if (signal?.aborted) return;
        yield event;
      }
    } catch {
      if (signal?.aborted) return;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
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
