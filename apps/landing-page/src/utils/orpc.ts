import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: () => undefined,
  }),
});

const link = new RPCLink({
  url: `${import.meta.env.VITE_SERVER_URL}/rpc`,
});

export const client = createORPCClient(link) as any;
export const orpc = createTanstackQueryUtils(client) as any;
