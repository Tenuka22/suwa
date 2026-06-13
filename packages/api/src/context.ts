import "./globals.d.ts";

export interface ClerkContextAuth {
  sessionClaims: CustomJwtSessionClaims | null;
  userId: string | null;
}

export interface ClerkRequestContext {
  auth: ClerkContextAuth | null;
  chatMessagesKv: KVNamespace;
  clerk: typeof clerkClient;
  db: ReturnType<typeof createDb>;
  modelFeaturesKv: KVNamespace;
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
import { createDb } from "@zen-doc/db";
import { env } from "@zen-doc/env/server";

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
    modelFeaturesKv: env.MODEL_FEATURES_KV,
    chatMessagesKv: env.CHAT_MESSAGES_KV,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
