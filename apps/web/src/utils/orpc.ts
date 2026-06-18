import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouter } from "@suwa/api/routers/index";
import { env } from "@suwa/env/web";
import { QueryCache, QueryClient } from "@tanstack/react-query";
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

export const client: RouterClient<AppRouter> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
