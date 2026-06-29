"use client";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouterClient } from "@suwa/api/routers/index";
import { env } from "@suwa/env/native";
import { QueryCache, QueryClient } from "@tanstack/react-query";

import { Platform } from "react-native";

import { authClient } from "@/utils/better-auth";

function isWeb(): boolean {
  return Platform.OS === "web";
}

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
    if (isWeb()) {
      return {};
    }
    const cookies = authClient.getCookie();
    return cookies ? { Cookie: cookies } : {};
  },
  fetch: isWeb()
    ? (url, options) => fetch(url, { ...options, credentials: "include" })
    : undefined,
});

export const _client: AppRouterClient = createORPCClient(_link);
export { _client as client };

export const orpc = createTanstackQueryUtils(_client);
