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
  const url = `${getBaseUrl()}/api/iot/stress-stream`;

  if (isWeb()) {
    return webEventSource(url, options.signal);
  }

  return nativeFetchStream(url, options.signal);
}

async function* webEventSource(
  url: string,
  signal?: AbortSignal
): AsyncGenerator<StressStreamEvent> {
  const ES = (globalThis as any).EventSource as typeof EventSource | undefined;
  if (!ES) {
    throw new Error("EventSource is not available in this environment");
  }

  const eventQueue: StressStreamEvent[] = [];
  let resolveEvent: ((value: IteratorResult<StressStreamEvent>) => void) | null = null;
  let eventSource: EventSource | null = null;

  function connect() {
    if (eventSource) {
      eventSource.close();
    }
    eventSource = new ES(url, { withCredentials: true });

    eventSource.onmessage = (event: MessageEvent) => {
      const parsed = parseSSEData(`data: ${event.data}`);
      if (!parsed) return;

      if (resolveEvent) {
        const res = resolveEvent;
        resolveEvent = null;
        res({ value: parsed, done: false });
      } else {
        eventQueue.push(parsed);
      }
    };

    eventSource.onerror = () => {
      // EventSource auto-reconnects — wake up any pending consumer
      // so it can continue waiting for new messages
      if (resolveEvent) {
        const res = resolveEvent;
        resolveEvent = null;
        res({ value: undefined as any, done: false });
      }
    };
  }

  connect();

  const abortHandler = () => {
    if (eventSource) {
      eventSource.close();
    }
    if (resolveEvent) {
      const res = resolveEvent;
      resolveEvent = null;
      res({ value: undefined as any, done: true });
    }
  };

  signal?.addEventListener("abort", abortHandler, { once: true });

  try {
    while (!signal?.aborted) {
      if (eventQueue.length > 0) {
        yield eventQueue.shift()!;
      } else {
        const result = await new Promise<IteratorResult<StressStreamEvent>>((resolve) => {
          resolveEvent = resolve;
        });
        if (result.done) break;
        if (result.value) {
          yield result.value;
        }
      }
    }
  } finally {
    if (eventSource) {
      eventSource.close();
    }
    signal?.removeEventListener("abort", abortHandler);
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
