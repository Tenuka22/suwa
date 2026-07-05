interface FallbackEnv {
  AI: Ai;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CHAT_MESSAGES_KV: KVNamespace;
  CORS_ORIGIN: string;
  DB: D1Database;
  FACE_EMBEDDINGS_KV: R2Bucket;
  FACE_VIDEOS_BUCKET: R2Bucket;
  FILE_STORAGE_BUCKET: R2Bucket;
  GEMINI_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
  LIVEKIT_HOST: string;
  MODEL_FEATURES_KV: KVNamespace;
  POLAR_ACCESS_TOKEN: string;
  POLAR_SERVER: string;
  POLAR_WEBHOOK_SECRET: string;
  STRESS_PREDICTOR_URL: string;
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
