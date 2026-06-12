import alchemy from "alchemy";
import {
  Ai,
  D1Database,
  KVNamespace,
  TanStackStart,
  Website,
  Worker,
} from "alchemy/cloudflare";
import { UpstashRedis } from "alchemy/upstash";
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

const app = await alchemy("zen-doc");

const db = await D1Database("primary-database", {
  migrationsDir: "../../packages/db/src/migrations",
});

const doctorMaterialsKv = await KVNamespace("doctor-materials");
const modelFeaturesKv = await KVNamespace("model-features");
const chatMessagesKv = await KVNamespace("chat-messages");


const redis = await UpstashRedis(
  process.env.NODE_ENV === "production" ? "prod-zen-doc" : "zen-doc-dev",
  {
    name:
      process.env.NODE_ENV === "production" ? "prod-zen-doc" : "zen-doc-dev",
    primaryRegion: "us-east-1",
  }
);

const aiBinding = Ai({ binding: "AI" });

export const server = await Worker("server", {
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  compatibilityFlags: ["no_handle_cross_request_promise_resolution"],
  bindings: {
    DB: db,
    CHAT_MESSAGES_KV: chatMessagesKv,
    DOCTOR_MATERIALS_KV: doctorMaterialsKv,
    MODEL_FEATURES_KV: modelFeaturesKv,
    AI: aiBinding,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    UPSTASH_REDIS_REST_URL: redis.endpoint,
    UPSTASH_REDIS_REST_TOKEN: redis.restToken,
    CLERK_SECRET_KEY: alchemy.secret.env.CLERK_SECRET_KEY!,
    LANGSMITH_TRACING: alchemy.secret.env.LANGSMITH_TRACING!,
    LANGSMITH_ENDPOINT: alchemy.secret.env.LANGSMITH_ENDPOINT!,
    LANGSMITH_API_KEY: alchemy.secret.env.LANGSMITH_API_KEY!,
    LANGSMITH_PROJECT: alchemy.secret.env.LANGSMITH_PROJECT!,
    CLERK_PUBLISHABLE_KEY: alchemy.env.CLERK_PUBLISHABLE_KEY!,
    STRESS_PREDICTOR_URL: alchemy.env.STRESS_PREDICTOR_URL!,
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

export const mobileWeb = await Website("mobile-web", {
  cwd: "../../apps/native",
  build: {
    command: "npx expo export --platform web",
    env: {
      ...(process.env.NODE_ENV === "production"
        ? { ENV_FILE: ".env.production" }
        : {}),
    },
  },
  assets: {
    directory: "dist",
    not_found_handling: "single-page-application",
  },
  bindings: {},
});

console.log(`Server -> ${server.url}`);
console.log(`Web -> ${web.url}`);
console.log(`Mobile Web -> ${mobileWeb.url}`);

await app.finalize();
