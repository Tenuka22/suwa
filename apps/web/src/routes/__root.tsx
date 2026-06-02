import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@zen-doc/ui/components/sonner";
import { TooltipProvider } from "@zen-doc/ui/components/tooltip";
import { env } from "@zen-doc/env/web";
import { useEffect } from "react";

import { setClerkAuthTokenGetter } from "@/utils/clerk-auth";

import appCss from "../index.css?url";

function ClerkApiAuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setClerkAuthTokenGetter(getToken);

    return () => {
      setClerkAuthTokenGetter(null);
    };
  }, [getToken]);

  return null;
}

import type { orpc } from "@/utils/orpc";
export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/Logo.svg",
      },
    ],
    title: "ZenDoc",
  }),

  component: RootDocument,
});

function RootDocument() {
  return (
    <ClerkProvider
      publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <ClerkApiAuthBridge />
      <TooltipProvider>
        <html className="dark" lang="en">
          <head>
            <HeadContent />
          </head>
          <body>
            <Outlet />
            <Toaster richColors />
            <TanStackRouterDevtools position="bottom-left" />
            <ReactQueryDevtools
              buttonPosition="bottom-right"
              position="bottom"
            />
            <Scripts />
          </body>
        </html>
      </TooltipProvider>
    </ClerkProvider>
  );
}
