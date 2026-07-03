import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { RPCHandler as WebSocketRPCHandler } from "@orpc/server/websocket";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { RedisSampleStore } from "@suwa/api/routers/stress-hub/redis-sample-store";
import { getBundles, getRedis, runPrediction, saveBundle, stressPublisher } from "@suwa/api/routers/stress-hub/simulation";
import { persistPrediction } from "@suwa/api/routers/stress-hub/persist-prediction";
import type { RawSample } from "@suwa/api/routers/stress-hub/stress-publisher";
import { createAuth } from "@suwa/auth";
import { createContext } from "@suwa/api/context";
import { appRouter, wsAppRouter } from "@suwa/api/routers/index";
import { env } from "@suwa/env/server";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import webhookApp from "./webhooks";

type WorkerEnv = {
  AI: Ai;
  CHAT_MESSAGES_KV: KVNamespace;
  FILE_STORAGE_BUCKET: R2Bucket;
  MODEL_FEATURES_KV: KVNamespace;
  SEED_ASSETS_DIR: string;
  SEED_FILE_SERVER_URL?: string;
};

type HonoBindings = { Bindings: WorkerEnv };

const app = new Hono<HonoBindings>();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: (env as any).CORS_ORIGIN.split(","),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) =>
  createAuth().handler(c.req.raw)
);

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error("RPC Error:", error);
      if (error && typeof error === "object" && "cause" in error) {
        console.error("Error Cause:", error.cause);
      }
    }),
  ],
});

export const wsRpcHandler = new WebSocketRPCHandler(wsAppRouter, {
  interceptors: [
    onError((error) => {
      console.error("WebSocket Error:", error);
      if (error && typeof error === "object") {
        console.error("WebSocket Error stack:", (error as Error).stack);
        console.error("WebSocket Error cause:", (error as Error).cause);
      }
    }),
  ],
});

app.route("/", webhookApp);

app.get(
  "/rpc-ws",
  upgradeWebSocket(async (c) => {
    const context = await createContext({ context: c });

    return {
      onMessage(event, ws) {
        if (ws.raw) {
          wsRpcHandler.message(ws.raw, event.data, { context });
        }
      },
      onClose(_event, ws) {
        if (ws.raw) {
          wsRpcHandler.close(ws.raw);
        }
      },
    };
  })
);

app.post("/api/iot/ingest", async (c) => {
  try {
    const { userEmail, deviceId, samples } = await c.req.json<{
      userEmail: string;
      deviceId: string;
      samples: { sample: number[]; timestamp: number }[];
    }>();

    if (!userEmail || !samples?.length) {
      return c.json({ error: "userEmail and samples are required" }, 400);
    }

    const { createDb, users } = await import("@suwa/db");
    const { eq } = await import("drizzle-orm");
    const db = createDb();

    const [foundUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (!foundUser) {
      console.warn(`[IOT] Unknown user email: ${userEmail}`);
      return c.json({ error: "User not found" }, 404);
    }

    const userId = foundUser.id;
    const redis = getRedis();
    const store = new RedisSampleStore(redis);
    let windowsCompleted = 0;

    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));
    const sanitizeSample = (sample: number[]) => [
      clamp(sample[0] ?? 750, 300, 1500),
      clamp(sample[1] ?? 50, 10, 200),
      clamp(sample[2] ?? 30, 5, 150),
      clamp(sample[3] ?? 0, 0, 100),
      clamp(sample[4] ?? 75, 30, 180),
    ];

    for (const sample of samples) {
      const rawSample: RawSample = {
        sample: sanitizeSample(sample.sample),
        timestamp: sample.timestamp ?? Date.now(),
      };
      const ready = await store.addSample(userId, rawSample);
      if (!ready) continue;

      const windowSamples = await store.popWindow(userId);
      if (!windowSamples) continue;

      const sanitizedWindowSamples = windowSamples.map((s) => ({
        ...s,
        sample: sanitizeSample(s.sample),
      }));
      const sampleArrays = sanitizedWindowSamples.map((s) => s.sample);
      const windowStart = sanitizedWindowSamples[0]?.timestamp ?? Date.now();

      let storedPrediction: { predictedClass: string; probabilities: number[]; sampleCount: number; timestamp: number; windowStart: number } | null = null;

      const prediction = await runPrediction(sampleArrays);
      if (prediction) {
        storedPrediction = {
          predictedClass: prediction.predictedClass,
          probabilities: prediction.probabilities,
          sampleCount: sanitizedWindowSamples.length,
          timestamp: Date.now(),
          windowStart,
        };
        const results = {
          "0": { prediction: prediction.predictedClass, probabilities: prediction.probabilities },
        };
        await persistPrediction(db, userId, results, sanitizedWindowSamples.length);
      }

      await saveBundle(redis, userId, sanitizedWindowSamples, storedPrediction);
      windowsCompleted++;

      stressPublisher.publish(userId, {
        type: "bundle",
        data: {
          bundleId: `bundle_${Date.now()}_${windowsCompleted}`,
          samples: sanitizedWindowSamples,
          prediction: storedPrediction,
          createdAt: Date.now(),
        },
      });
    }

    const buf = await store.getBuffer(userId);
    const total = buf?.totalSamples ?? 0;
    const buffered = buf?.buffered ?? 0;

    stressPublisher.publish(userId, { type: "progress", buffered, totalSamples: total });

    console.log(`[IOT] Ingested ${samples.length} samples for ${userEmail}, buffered=${buffered}, windowsCompleted=${windowsCompleted}`);

    return c.json({
      success: true,
      ingested: samples.length,
      totalSamples: total,
      buffered,
      windowsCompleted,
    });
  } catch (error) {
    console.error("[IOT] Ingest error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/api/iot/stress-stream", async (c) => {
  const context = await createContext({ context: c });
  const userId = context.auth.userId;

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const redis = getRedis();
  const store = new RedisSampleStore(redis);
  const encoder = new TextEncoder();
  const signal = c.req.raw.signal;

  const encodeEvent = (event: unknown) =>
    encoder.encode(`data: ${JSON.stringify(event)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      const [bundles, buf] = await Promise.all([
        getBundles(redis, userId, 100),
        store.getBuffer(userId),
      ]);

      controller.enqueue(
        encodeEvent({
          type: "state",
          bundles,
          totalSamples: buf?.totalSamples ?? 0,
          buffered: buf?.buffered ?? 0,
        })
      );

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      const iterator = stressPublisher.subscribe(userId, { signal });

      try {
        while (!signal.aborted) {
          const { value, done } = await iterator.next();
          if (done) break;
          if (value) controller.enqueue(encodeEvent(value));
        }
      } finally {
        clearInterval(heartbeat);
        await iterator.return();
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
});

app.use("/*", async (c, next) => {
  const requestPath = new URL(c.req.url).pathname;
  if (
    requestPath.startsWith("/materials/") ||
    requestPath.startsWith("/media/") ||
    requestPath.startsWith("/images/")
  ) {
    await next();
    return;
  }

  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

async function serveMedia(c: any) {
  const { FILE_STORAGE_BUCKET } = c.env as Pick<WorkerEnv, "FILE_STORAGE_BUCKET">;
  const key = c.req.param("key");
  if (!key) {
    return c.text("Media key is required", 400);
  }

  const range = c.req.raw.headers.get("Range");
  const head = await FILE_STORAGE_BUCKET.head(key);

  if (!head) {
    return c.text("Media not found", 404);
  }

  const contentType = head.httpMetadata?.contentType ?? "application/octet-stream";
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Content-Type": contentType,
  });

  if (range) {
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    if (!match) {
      return c.text("Invalid range", 416, {
        "Content-Range": `bytes */${head.size}`,
      });
    }

    const rawStart = match[1] ?? "";
    const rawEnd = match[2] ?? "";
    const suffixLength = rawStart ? 0 : Number(rawEnd);
    const start = rawStart ? Number(rawStart) : Math.max(head.size - suffixLength, 0);
    const end = rawEnd && rawStart ? Number(rawEnd) : head.size - 1;

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < 0 ||
      end < start ||
      start >= head.size
    ) {
      return c.text("Range not satisfiable", 416, {
        "Content-Range": `bytes */${head.size}`,
      });
    }

    const boundedEnd = Math.min(end, head.size - 1);
    const length = boundedEnd - start + 1;
    const object = await FILE_STORAGE_BUCKET.get(key, {
      range: { offset: start, length },
    });

    if (!object?.body) {
      return c.text("Media not found", 404);
    }

    headers.set("Content-Length", String(length));
    headers.set("Content-Range", `bytes ${start}-${boundedEnd}/${head.size}`);

    return new Response(object.body, {
      status: 206,
      headers,
    });
  }

  const object = await FILE_STORAGE_BUCKET.get(key);
  if (!object?.body) {
    return c.text("Media not found", 404);
  }

  headers.set("Content-Length", String(head.size));

  return new Response(object.body, {
    status: 200,
    headers,
  });
}

app.get("/media/:key", serveMedia);
app.get("/images/:key", serveMedia);

app.get("/seed", async (c) => {
  try {
    const { runSeed } = await import("./seed/index");
    const result = await runSeed();
    return c.json({ success: true, result });
  } catch (error) {
    console.error("Seed error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Seed failed",
      },
      500
    );
  }
});

app.get("/unseed", async (c) => {
  try {
    const { unseedData } = await import("./seed/unseed");
    const { createDb } = await import("@suwa/db");
    const db = createDb();
    const result = await unseedData(db);
    return c.json({ success: true, result });
  } catch (error) {
    console.error("Unseed error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unseed failed",
      },
      500
    );
  }
});

app.get("/", (c) => c.text("OK"));

export default {
  fetch: app.fetch,
};
