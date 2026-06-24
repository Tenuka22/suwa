import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";

import { LenisProvider } from "../components/lenis-provider";
import { queryClient } from "../utils/orpc";
import appCss from "../styles.css?url";

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
      { title: "Suwa — Anonymous health consultations, on your terms." },
      {
        name: "description",
        content:
          "Anonymous health consultations with licensed professionals and anonymity built in from the start.",
      },
      { name: "theme-color", content: "#faf7f2" },
      { property: "og:image", content: "/logo.png" },
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
