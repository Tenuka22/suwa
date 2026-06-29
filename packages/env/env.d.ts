interface FallbackEnv {
  AI: Ai;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CHAT_MESSAGES_KV: KVNamespace;
  CORS_ORIGIN: string;
  DB: D1Database;
  DOCTOR_MATERIALS_KV: KVNamespace;
  FACE_EMBEDDINGS_KV: KVNamespace;
  FACE_VIDEOS_KV: KVNamespace;
  GEMINI_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
  LIVEKIT_HOST: string;
  MODEL_FEATURES_KV: KVNamespace;
  STRESS_PREDICTOR_URL: string;
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
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
