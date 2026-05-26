// This file defines types for the cloudflare:workers environment.
// When running under Alchemy (@zen-doc/infra/alchemy.run), additional bindings
// are inferred from the alchemy.run.ts configuration.

interface FallbackEnv {
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  CORS_ORIGIN: string;
  DB: D1Database;
  DOCTOR_MATERIALS_KV: KVNamespace;
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
  LIVEKIT_HOST: string;
  MODEL_FEATURES_KV: KVNamespace;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SVIX_API_TOKEN: string;
  SVIX_APP_ID: string;
}

type CloudflareEnv = FallbackEnv;

declare global {
  type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
  // biome-ignore lint/style/noNamespace: Standard Cloudflare type declaration format
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
