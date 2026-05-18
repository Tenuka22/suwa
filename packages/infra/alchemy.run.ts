import alchemy from "alchemy";
import { D1Database, TanStackStart, Worker } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/server/.env" });
config({ path: "../../apps/web/.env" });

const app = await alchemy("zen-doc");

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
});

export const server = await Worker("server", {
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  bindings: {
    DB: db,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    CLERK_SECRET_KEY: alchemy.secret.env.CLERK_SECRET_KEY!,
    CLERK_PUBLISHABLE_KEY: alchemy.env.CLERK_PUBLISHABLE_KEY!,
    STRIPE_SECRET_KEY: alchemy.secret.env.STRIPE_SECRET_KEY!,
  },
  dev: {
    port: 3000,
  },
});

export const web = await TanStackStart("web", {
  cwd: "../../apps/web",
  bindings: {
    VITE_SERVER_URL: alchemy.env.VITE_SERVER_URL,
    VITE_WEB_URL: alchemy.env.VITE_WEB_URL!,
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
