import alchemy from "alchemy";
import {
  D1Database,
  KVNamespace,
  TanStackStart,
  Website,
  Worker,
} from "alchemy/cloudflare";
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

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
});

const doctorMaterialsKv = await KVNamespace("doctor-materials");
const modelFeaturesKv = await KVNamespace("model-features");

export const server = await Worker("server", {
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  bindings: {
    DB: db,
    DOCTOR_MATERIALS_KV: doctorMaterialsKv,
    MODEL_FEATURES_KV: modelFeaturesKv,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    CLERK_SECRET_KEY: alchemy.secret.env.CLERK_SECRET_KEY!,
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
