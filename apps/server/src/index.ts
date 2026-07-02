import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { RPCHandler as WebSocketRPCHandler } from "@orpc/server/websocket";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { readStoredFileRecord } from "@suwa/api/doctor-materials";
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

const app = new Hono();

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

app.use("/*", async (c, next) => {
  const requestPath = new URL(c.req.url).pathname;
  if (requestPath.startsWith("/materials/") || requestPath.startsWith("/images/")) {
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

app.get("/images/:key", async (c) => {
  const { FILE_STORAGE_BUCKET } = c.env as Pick<WorkerEnv, "FILE_STORAGE_BUCKET">;
  const key = c.req.param("key");
  const record = await readStoredFileRecord(FILE_STORAGE_BUCKET, key);

  if (!record) {
    return c.text("Image not found", 404);
  }

  return new Response(record.data as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": record.mimeType,
    },
  });
});

app.get("/seed", async (c) => {
  try {
    const env = c.env as WorkerEnv;

    const readAsset = async (filename: string) => {
      if (env.SEED_FILE_SERVER_URL) {
        try {
          const res = await fetch(`${env.SEED_FILE_SERVER_URL}/${filename}`);
          if (res.ok) return res.arrayBuffer();
        } catch {
          /* fall through */
        }
      }
      try {
        const { readFile } = await import("node:fs/promises");
        const { join } = await import("node:path");
        const buf = await readFile(join(env.SEED_ASSETS_DIR, filename));
        return buf.buffer.slice(
          buf.byteOffset,
          buf.byteOffset + buf.byteLength
        ) as ArrayBuffer;
      } catch {
        return null;
      }
    };

    const { runSeed } = await import("./seed/index");
    const result = await runSeed({
      ai: env.AI,
      chatMessagesKv: env.CHAT_MESSAGES_KV,
      fileStorageBucket: env.FILE_STORAGE_BUCKET,
      modelFeaturesKv: env.MODEL_FEATURES_KV,
      readAsset,
    });
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
    const { FILE_STORAGE_BUCKET } = c.env as Pick<WorkerEnv, "FILE_STORAGE_BUCKET">;
    const result = await unseedData(db, FILE_STORAGE_BUCKET);
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
