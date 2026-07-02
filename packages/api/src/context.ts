import { createAuth } from "@suwa/auth";
import { createDb } from "@suwa/db";
import { env } from "@suwa/env/server";
import type { Context as HonoContext } from "hono";

export interface AuthContext {
  userId: string | null;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    userId: string;
    impersonatedBy?: string | null;
  } | null;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified: boolean;
    role?: string | null;
    banned?: boolean | null;
    banReason?: string | null;
    banExpires?: Date | null;
  } | null;
}

export interface RequestContext {
  ai: Ai;
  auth: AuthContext;
  chatMessagesKv: KVNamespace;
  db: ReturnType<typeof createDb>;
  faceEmbeddingsKv: KVNamespace;
  faceVideosKv: KVNamespace;
  fileStorageBucket: R2Bucket;
  geminiApiKey: string;
}

export interface CreateContextOptions {
  context: HonoContext;
  token?: string;
}

export async function createContext({
  context,
}: CreateContextOptions): Promise<RequestContext> {
  const betterAuth = createAuth();
  const session = await betterAuth.api.getSession({
    headers: context.req.raw.headers,
  });

  return {
    auth: {
      userId: session?.user?.id ?? null,
      session: session?.session ?? null,
      user: session?.user ?? null,
    },
    db: createDb(),
    chatMessagesKv: env.CHAT_MESSAGES_KV,
    faceEmbeddingsKv: env.FACE_EMBEDDINGS_KV,
    faceVideosKv: env.FACE_VIDEOS_KV,
    fileStorageBucket: context.env.FILE_STORAGE_BUCKET,
    ai: context.env.AI,
    geminiApiKey: env.GEMINI_API_KEY,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

// Temporary alias for migration from Clerk to Better Auth
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ClerkRequestContext = Context;
