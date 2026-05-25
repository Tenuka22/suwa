import { type server } from "@zen-doc/infra/alchemy.run";

// This file infers types for the cloudflare:workers environment from your Alchemy Worker.
// @see https://alchemy.run/concepts/bindings/#type-safe-bindings

interface FallbackEnv {
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  CORS_ORIGIN: string;
  DB: D1Database;
  DOCTOR_MATERIALS_BUCKET: R2Bucket;
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
  LIVEKIT_HOST: string;
  MODEL_FEATURES_KV: KVNamespace;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SVIX_API_TOKEN: string;
  SVIX_APP_ID: string;
}

export type CloudflareEnv = typeof server.Env & FallbackEnv;

declare global {
  type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
  // biome-ignore lint/style/noNamespace: Standard Cloudflare type declaration format
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
