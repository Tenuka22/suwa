import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCLink as WebSocketRPCLink } from "@orpc/client/websocket";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import type { AppRouter, WSAppRouter } from "@zen-doc/api/routers/index";
import { env } from "@zen-doc/env/web";
import { toast } from "sonner";

import { getClerkAuthToken } from "@/utils/clerk-auth";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.error(`Error: ${error.message}`, {
        action: {
          label: "retry",
          onClick: query.invalidate,
        },
      });
    },
  }),
});

const link = new RPCLink({
  url: `${env.VITE_SERVER_URL}/rpc`,
  headers: async () => {
    const token = await getClerkAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

const getORPCClient = () => createORPCClient(link) as RouterClient<AppRouter>;

export const client: RouterClient<AppRouter> = getORPCClient();

export const orpc = createTanstackQueryUtils(client);

const wsUrl = `${env.VITE_SERVER_URL.replace(/^http/, "ws")}/rpc-ws`;

const websocket = new WebSocket(wsUrl);
const wsLink = new WebSocketRPCLink({ websocket });

export const orpcWs = createORPCClient(wsLink) as RouterClient<WSAppRouter>;
