'use client';

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import type { AppRouterClient } from "@zen-doc/api/routers/index";
import { env } from "@zen-doc/env/native";

import { getClerkAuthToken } from "@/utils/clerk-auth";

let globalQueryErrorHandler: ((error: unknown) => void) | null = null;

export function setQueryErrorHandler(handler: (error: unknown) => void) {
  globalQueryErrorHandler = handler;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.ignoreError !== true) {
        globalQueryErrorHandler?.(error);
      }
    },
  }),
});

export const _link = new RPCLink({
  url: `${env.EXPO_PUBLIC_SERVER_URL}/rpc`,
  headers: async () => {
    const token = await getClerkAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

export const _client: AppRouterClient = createORPCClient(_link);

export const orpc = createTanstackQueryUtils(_client);
