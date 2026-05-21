import type { Href } from "expo-router";
import type { useRouter } from "expo-router";

export const OAUTH_STRATEGIES = [
  { strategy: "oauth_google", label: "Google", icon: "google" as const },
  { strategy: "oauth_apple", label: "Apple", icon: "apple" as const },
  { strategy: "oauth_line", label: "LINE", icon: "comments" as const },
] as const;

export function pushDecoratedUrl(
  router: ReturnType<typeof useRouter>,
  decorateUrl: (url: string) => string,
  href: string
) {
  const url = decorateUrl(href);
  const nextHref = url.startsWith("http") ? new URL(url).pathname : url;
  router.push(nextHref as Href);
}
