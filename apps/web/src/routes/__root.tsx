import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import { APP_DISPLAY_NAME, LOGO_PATH } from "@suwa/app-info";
import { env } from "@suwa/env/web";
import { Toaster } from "@suwa/ui/components/sonner";
import { TooltipProvider } from "@suwa/ui/components/tooltip";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
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
        href: LOGO_PATH,
      },
    ],
    title: APP_DISPLAY_NAME,
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
