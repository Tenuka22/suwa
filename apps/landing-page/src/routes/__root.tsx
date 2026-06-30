import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";

import { LenisProvider } from "../components/lenis-provider";
import { APP_DISPLAY_NAME } from "@suwa/app-info";
import { resolveSiteUrl } from "../lib/seo";
import { queryClient } from "../utils/orpc";
import appCss from "../styles.css?url";

const siteUrl = resolveSiteUrl(import.meta.env.VITE_WEB_URL);

export const Route = createRootRoute({
  head: () => ({
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/icon.png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
    ],
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#faf7f2" },
      { property: "og:site_name", content: APP_DISPLAY_NAME },
      { property: "og:image", content: new URL("/logo.png", siteUrl).toString() },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <LenisProvider>
            <Outlet />
          </LenisProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
