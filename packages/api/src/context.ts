import "./globals.d.ts";

export interface ClerkContextAuth {
  sessionClaims: CustomJwtSessionClaims | null;
  userId: string | null;
}

export interface ClerkRequestContext {
  ai: Ai;
  auth: ClerkContextAuth | null;
  chatMessagesKv: KVNamespace;
  clerk: typeof clerkClient;
  db: ReturnType<typeof createDb>;
  faceEmbeddingsKv: KVNamespace;
  faceVideosKv: KVNamespace;
  geminiApiKey: string;
  session: null;
}

function toClerkContextAuth(
  auth: {
    userId: string | null;
    sessionClaims?: CustomJwtSessionClaims | null;
  } | null
): ClerkContextAuth | null {
  return auth
    ? { userId: auth.userId, sessionClaims: auth.sessionClaims ?? null }
    : null;
}

import { createClerkClient } from "@clerk/backend";
import { createDb } from "@suwa/db";
import { env } from "@suwa/env/server";

const clerkClient = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

async function authenticateClerkRequest(
  request: Request
): Promise<ClerkContextAuth | null> {
  const requestState = await clerkClient.authenticateRequest(request, {
    authorizedParties: env.CORS_ORIGIN.split(","),
  });
  return toClerkContextAuth(requestState.toAuth());
}

import type { Context as HonoContext } from "hono";

export interface CreateContextOptions {
  context: HonoContext;
  token?: string;
}

export async function createContext({
  context,
}: CreateContextOptions): Promise<ClerkRequestContext> {
  const clerkAuth = await authenticateClerkRequest(context.req.raw);
  return {
    auth: clerkAuth,
    session: null,
    db: createDb(),
    clerk: clerkClient,
    chatMessagesKv: env.CHAT_MESSAGES_KV,
    faceEmbeddingsKv: env.FACE_EMBEDDINGS_KV,
    faceVideosKv: env.FACE_VIDEOS_KV,
    ai: context.env.AI,
    geminiApiKey: env.GEMINI_API_KEY,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
