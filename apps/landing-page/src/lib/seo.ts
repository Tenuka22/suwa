import { APP_DISPLAY_NAME, getWebMetaOutput } from "@suwa/app-info";
import type { LandingRouteKey } from "@suwa/app-info";

export const SITE_NAME = APP_DISPLAY_NAME;

export const DEFAULT_SITE_URL = "https://app.suwa.life";

export const DEFAULT_DESCRIPTION =
  "Anonymous health consultations with licensed professionals and anonymity built in from the start.";

export type SeoRoute = Readonly<{
  path: `/${string}` | "/";
  changefreq: "weekly" | "monthly";
  priority: number;
}>;

export const SEO_ROUTES: readonly SeoRoute[] = [
  { path: "/", changefreq: "weekly", priority: 1 },
  { path: "/pricing", changefreq: "monthly", priority: 0.7 },
  { path: "/contact", changefreq: "monthly", priority: 0.6 },
] as const;

export function resolveSiteUrl(siteUrl?: string): string {
  return siteUrl?.trim() || DEFAULT_SITE_URL;
}

export function absoluteUrl(path: string, siteUrl?: string): string {
  return new URL(path, resolveSiteUrl(siteUrl)).toString();
}

const LANDING_SITE_URL = "https://suwa.life";

export function createSeoHeadFromRegistry(
  key: LandingRouteKey,
  overrides?: { siteUrl?: string }
) {
  const { tags } = getWebMetaOutput(key);
  const resolvedUrl = overrides?.siteUrl ?? LANDING_SITE_URL;
  const baseUrl = absoluteUrl("/", resolvedUrl);

  const meta: Record<string, string>[] = [];
  const links: Record<string, string>[] = [{ rel: "canonical", href: baseUrl }];

  for (const tag of tags) {
    if (tag.charset || tag.name === "viewport") continue;
    if (tag.rel === "canonical") continue;

    if (tag.rel) {
      const link: Record<string, string> = { rel: tag.rel };
      if (tag.href) link.href = tag.href;
      if (tag.hreflang) link.hreflang = tag.hreflang;
      links.push(link);
      continue;
    }

    if (tag.property === "og:url") {
      meta.push({ property: "og:url", content: baseUrl });
      continue;
    }

    if (tag.property === "og:image") {
      meta.push({ property: "og:image", content: absoluteUrl("/logo.png", resolvedUrl) });
      continue;
    }

    const m: Record<string, string> = {};
    if (tag.name) m.name = tag.name;
    if (tag.property) m.property = tag.property;
    if (tag.content) m.content = tag.content;
    if (tag["http-equiv"]) m.httpEquiv = tag["http-equiv"];
    if (tag.itemprop) m.itemProp = tag.itemprop;
    meta.push(m);
  }

  return { meta, links };
}
