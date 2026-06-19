import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { RPCHandler as WebSocketRPCHandler } from "@orpc/server/websocket";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@suwa/api/context";
import { appRouter, wsAppRouter } from "@suwa/api/routers/index";
import { env } from "@suwa/env/server";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import webhookApp from "./webhooks";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN.split(","),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
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

app.get("/seed", async (c) => {
  try {
    const { runSeed } = await import("./seed/index");
    const env = c.env as {
      DOCTOR_MATERIALS_KV: KVNamespace;
      CHAT_MESSAGES_KV: KVNamespace;
      MODEL_FEATURES_KV: KVNamespace;
    };
    const result = await runSeed({
      doctorMaterialsKv: env.DOCTOR_MATERIALS_KV,
      chatMessagesKv: env.CHAT_MESSAGES_KV,
      modelFeaturesKv: env.MODEL_FEATURES_KV,
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

app.get("/materials/:id/file", async (c) => {
  try {
    const { createDb } = await import("@suwa/db");
    const { doctorHubMaterials } = await import("@suwa/db");
    const { eq } = await import("drizzle-orm");
    const db = createDb();
    const [material] = await db
      .select()
      .from(doctorHubMaterials)
      .where(eq(doctorHubMaterials.id, c.req.param("id")))
      .limit(1);

    if (!material?.fileKey) {
      return c.text("Material file not found", 404);
    }

    const fileData = await env.DOCTOR_MATERIALS_KV.get(
      material.fileKey,
      "arrayBuffer"
    );

    if (!fileData) {
      return c.text("File data not found in storage", 404);
    }

    return c.body(fileData, 200, {
      "Content-Type": material.mimeType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${material.fileName ?? "file"}"`,
      "Content-Length": fileData.byteLength.toString(),
      "Accept-Ranges": "bytes",
    });
  } catch (error) {
    console.error("File stream error:", error);
    return c.text("Failed to stream file", 500);
  }
});

app.get("/", (c) => c.text("OK"));

export default {
  fetch: app.fetch,
};
