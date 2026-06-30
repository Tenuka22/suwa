import { APP_DISPLAY_NAME, getWebMetaOutput, LOGO_PATH } from "@suwa/app-info";
import type { WebRouteKey, WebMetaOutput } from "@suwa/app-info";
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
import type { orpc } from "@/utils/orpc";
import appCss from "../index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

function webMetaToTsrHead({ tags }: WebMetaOutput) {
  const meta: Record<string, string>[] = [];
  const links: Record<string, string>[] = [];

  for (const tag of tags) {
    if (tag.rel) {
      const link: Record<string, string> = { rel: tag.rel };
      if (tag.href) link.href = tag.href;
      if (tag.hreflang) link.hreflang = tag.hreflang;
      links.push(link);
    } else {
      const m: Record<string, string> = {};
      if (tag.charset) m.charSet = tag.charset;
      if (tag.name) m.name = tag.name;
      if (tag.property) m.property = tag.property;
      if (tag.content) m.content = tag.content;
      if (tag["http-equiv"]) m.httpEquiv = tag["http-equiv"];
      if (tag.itemprop) m.itemProp = tag.itemprop;
      meta.push(m);
    }
  }

  return { meta, links };
}

export function buildHeadFromKey(key: WebRouteKey) {
  const head = webMetaToTsrHead(getWebMetaOutput(key));
  head.links.push({ rel: "stylesheet", href: appCss }, { rel: "icon", href: LOGO_PATH });
  return head;
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
  const showDevtools =
    import.meta.env.DEV && import.meta.env.VITE_SHOW_DEVTOOLS === "true";

  return (
    <TooltipProvider>
      <html className="light" lang="en">
        <head>
          <HeadContent />
        </head>
        <body>
          <Outlet />
          <Toaster richColors />
          {showDevtools ? (
            <>
              <TanStackRouterDevtools position="bottom-left" />
              <ReactQueryDevtools
                buttonPosition="bottom-right"
                position="bottom"
              />
            </>
          ) : null}
          <Scripts />
        </body>
      </html>
    </TooltipProvider>
  );
}
