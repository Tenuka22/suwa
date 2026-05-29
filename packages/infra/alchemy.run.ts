import alchemy from "alchemy";
import {
  D1Database,
  KVNamespace,
  TanStackStart,
  Worker,
} from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/server/.env.production" });
config({ path: "../../apps/web/.env.production" });

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

console.log(`Server -> ${server.url}`);
console.log(`Web -> ${web.url}`);

await app.finalize();
