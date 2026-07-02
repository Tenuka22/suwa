import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import alchemy from "alchemy";
import {
  Ai,
  D1Database,
  KVNamespace,
  R2Bucket as createR2Bucket,
  TanStackStart,
  Website,
  Worker,
} from "alchemy/cloudflare";
// import { UpstashRedis } from "alchemy/upstash";
import { config } from "dotenv";

config({ path: "./.env" });

if (process.env.NODE_ENV === "production") {
  config({ path: "../../apps/server/.env.production" });
  config({ path: "../../apps/web/.env.production" });
  config({ path: "../../apps/landing-page/.env.production" });
  config({ path: "../../apps/native/.env.production" });
} else {
  config({ path: "../../apps/server/.env" });
  config({ path: "../../apps/web/.env" });
  config({ path: "../../apps/landing-page/.env" });
}

const app = await alchemy("suwa");

const db = await D1Database("primary-database", {
  migrationsDir: "../../packages/db/src/migrations",
});

const fileStorageBucket = await createR2Bucket("file-storage", {
  name: process.env.NODE_ENV === "production" ? "prod-suwa-files" : "suwa-dev-files",
});

const modelFeaturesKv = await KVNamespace("model-features");
const chatMessagesKv = await KVNamespace("chat-messages");
const faceEmbeddingsKv = await KVNamespace("face-embeddings");
const faceVideosKv = await KVNamespace("face-videos");

// const redis = await UpstashRedis(
//   process.env.NODE_ENV === "production" ? "prod-suwa" : "suwa-dev",
//   {
//     name:
//       process.env.NODE_ENV === "production" ? "prod-suwa" : "suwa-dev",
//     primaryRegion: "us-east-1",
//   }
// );

const aiBinding = Ai();

const seedAssetsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/server/src/seed-assets"
);
const seedFileServer = Bun.serve({
  port: 0,
  fetch(req) {
    const url = new URL(req.url);
    const filePath = join(seedAssetsDir, url.pathname.replace(/^\//, ""));
    const f = Bun.file(filePath);
    return new Response(f);
  },
});
const SEED_FILE_SERVER_URL = `http://localhost:${seedFileServer.port}`;

export const server = await Worker("server", {
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  observability: {
    enabled: true,
    traces: {
      enabled: true,
    },
  },
  compatibilityFlags: ["no_handle_cross_request_promise_resolution"],
  domains: [
    { domainName: "api.suwa.life", zoneId: "32f35707091cc8835c6734e191cbd6c2" },
  ],
  bindings: {
    DB: db,
    FILE_STORAGE_BUCKET: fileStorageBucket,
    SEED_ASSETS_DIR: join(
      dirname(fileURLToPath(import.meta.url)),
      "../../apps/server/src/seed-assets"
    ),
    SEED_FILE_SERVER_URL,
    CHAT_MESSAGES_KV: chatMessagesKv,
    MODEL_FEATURES_KV: modelFeaturesKv,
    FACE_EMBEDDINGS_KV: faceEmbeddingsKv,
    FACE_VIDEOS_KV: faceVideosKv,
    AI: aiBinding,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    UPSTASH_REDIS_REST_URL:
      // redis.endpoint,
      "https://pure-goat-80264.upstash.io",
    UPSTASH_REDIS_REST_TOKEN:
      // redis.restToken,
      "gQAAAAAAATmIAAIgcDI0ZGNjODgzNzc2ZmQ0MTA3YTgzNmQ2MTY1YmM4ZWE5OA",
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
    LANGSMITH_TRACING: alchemy.secret.env.LANGSMITH_TRACING!,
    LANGSMITH_ENDPOINT: alchemy.secret.env.LANGSMITH_ENDPOINT!,
    LANGSMITH_API_KEY: alchemy.secret.env.LANGSMITH_API_KEY!,
    LANGSMITH_PROJECT: alchemy.secret.env.LANGSMITH_PROJECT!,
    STRESS_PREDICTOR_URL: alchemy.env.STRESS_PREDICTOR_URL!,
    GEMINI_API_KEY: alchemy.env.GEMINI_API_KEY!,
    STRESS_PREDICTOR_SECRET: alchemy.secret.env.STRESS_PREDICTOR_SECRET!,
    STRIPE_SECRET_KEY: alchemy.secret.env.STRIPE_SECRET_KEY!,
    STRIPE_WEBHOOK_SECRET: alchemy.secret.env.STRIPE_WEBHOOK_SECRET!,
    LIVEKIT_HOST: alchemy.env.LIVEKIT_HOST!,
    LIVEKIT_API_KEY: alchemy.secret.env.LIVEKIT_API_KEY!,
    GOOGLE_CLIENT_ID: alchemy.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: alchemy.secret.env.GOOGLE_CLIENT_SECRET!,
    LIVEKIT_API_SECRET: alchemy.secret.env.LIVEKIT_API_SECRET!,
  },
  crons: ["*/10 * * * *"],
  dev: {
    port: 3000,
  },
});

export const web = await TanStackStart("web", {
  cwd: "../../apps/web",
  domains: [
    { domainName: "app.suwa.life", zoneId: "32f35707091cc8835c6734e191cbd6c2" },
  ],
  bindings: {
    VITE_SERVER_URL: server.url!,
    VITE_WEB_URL: alchemy.env.VITE_WEB_URL!,
    VITE_STRIPE_PUBLISHABLE_KEY: alchemy.env.VITE_STRIPE_PUBLISHABLE_KEY!,
  },
  observability: {
    enabled: true,
    traces: {
      enabled: true,
    },
  },
});

export const landingPage = await TanStackStart("landing-page", {
  cwd: "../../apps/landing-page",
  bindings: {
    VITE_WEB_URL: alchemy.env.VITE_WEB_URL!,
    VITE_MOBILE_WEB_URL: alchemy.env.VITE_MOBILE_WEB_URL!,
    VITE_SERVER_URL: server.url!,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
  },
  domains: [
    { domainName: "suwa.life", zoneId: "32f35707091cc8835c6734e191cbd6c2" },
  ],
  build: {
    command: "bun run build",
  },
  observability: {
    enabled: true,
    traces: {
      enabled: true,
    },
  },
});

export const mobileWeb = await Website("mobile-web", {
  cwd: "../../apps/native",
  domains: [
    { domainName: "m.suwa.life", zoneId: "32f35707091cc8835c6734e191cbd6c2" },
  ],
  build: {
    command: "bunx expo export --platform web",
    env: {
      ...(process.env.NODE_ENV === "production"
        ? { ENV_FILE: ".env.production" }
        : {}),
    },
  },
  spa: true,
  assets: {
    directory: "dist",
  },
  bindings: {},
});

console.log(`Server -> ${server.url}`);
console.log(`Web -> ${web.url}`);
console.log(`Landing Page -> ${landingPage.url}`);
console.log(`Mobile Web -> ${mobileWeb.url}`);

await app.finalize();
