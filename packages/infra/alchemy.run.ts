import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import alchemy from "alchemy";
import {
  Ai,
  D1Database,
  KVNamespace,
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
  config({ path: "../../apps/native/.env.production" });
} else {
  config({ path: "../../apps/server/.env" });
  config({ path: "../../apps/web/.env" });
}

const app = await alchemy("suwa");

const db = await D1Database("primary-database", {
  migrationsDir: "../../packages/db/src/migrations",
});

const doctorMaterialsKv = await KVNamespace("doctor-materials");
const modelFeaturesKv = await KVNamespace("model-features");
const chatMessagesKv = await KVNamespace("chat-messages");
const faceEmbeddingsKv = await KVNamespace("face-embeddings");

// const redis = await UpstashRedis(
//   process.env.NODE_ENV === "production" ? "prod-suwa" : "suwa-dev",
//   {
//     name:
//       process.env.NODE_ENV === "production" ? "prod-suwa" : "suwa-dev",
//     primaryRegion: "us-east-1",
//   }
// );

const aiBinding = Ai({ binding: "AI" });

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
    SEED_ASSETS_DIR: join(
      dirname(fileURLToPath(import.meta.url)),
      "../../apps/server/src/seed-assets"
    ),
    CHAT_MESSAGES_KV: chatMessagesKv,
    DOCTOR_MATERIALS_KV: doctorMaterialsKv,
    MODEL_FEATURES_KV: modelFeaturesKv,
    FACE_EMBEDDINGS_KV: faceEmbeddingsKv,
    AI: aiBinding,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    UPSTASH_REDIS_REST_URL:
      // redis.endpoint,
      "https://pure-goat-80264.upstash.io",
    UPSTASH_REDIS_REST_TOKEN:
      // redis.restToken,
      "gQAAAAAAATmIAAIgcDI0ZGNjODgzNzc2ZmQ0MTA3YTgzNmQ2MTY1YmM4ZWE5OA",
    CLERK_SECRET_KEY: alchemy.secret.env.CLERK_SECRET_KEY!,
    LANGSMITH_TRACING: alchemy.secret.env.LANGSMITH_TRACING!,
    LANGSMITH_ENDPOINT: alchemy.secret.env.LANGSMITH_ENDPOINT!,
    LANGSMITH_API_KEY: alchemy.secret.env.LANGSMITH_API_KEY!,
    LANGSMITH_PROJECT: alchemy.secret.env.LANGSMITH_PROJECT!,
    CLERK_PUBLISHABLE_KEY: alchemy.env.CLERK_PUBLISHABLE_KEY!,
    STRESS_PREDICTOR_URL: alchemy.env.STRESS_PREDICTOR_URL!,
    GEMINI_API_KEY: alchemy.env.GEMINI_API_KEY!,
    STRESS_PREDICTOR_SECRET: alchemy.secret.env.STRESS_PREDICTOR_SECRET!,
    STRIPE_SECRET_KEY: alchemy.secret.env.STRIPE_SECRET_KEY!,
    STRIPE_WEBHOOK_SECRET: alchemy.secret.env.STRIPE_WEBHOOK_SECRET!,
    LIVEKIT_HOST: alchemy.env.LIVEKIT_HOST!,
    LIVEKIT_API_KEY: alchemy.secret.env.LIVEKIT_API_KEY!,
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
    DOCTOR_MATERIALS_KV: doctorMaterialsKv,
    CLERK_SECRET_KEY: alchemy.secret.env.CLERK_SECRET_KEY!,
    VITE_CLERK_PUBLISHABLE_KEY: alchemy.env.CLERK_PUBLISHABLE_KEY!,
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
  bindings: {},
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
