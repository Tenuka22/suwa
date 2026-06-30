import type { SeoConfig, JsonLdSchema } from "./types";
import { WEB_ROUTES, getSeoForRoute } from "./registry";
import type { RouteKey, WebRouteKey } from "./types";

const SITE_NAME = "Suwa";
const BASE_URL = "https://suwa.app";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.png`;

export interface WebMetaTag {
  charset?: string;
  content?: string;
  "http-equiv"?: string;
  itemprop?: string;
  name?: string;
  property?: string;
  rel?: string;
  href?: string;
  hreflang?: string;
}

export interface WebMetaOutput {
  tags: WebMetaTag[];
  jsonLd: string | null;
}

export function buildWebMeta(config: SeoConfig): WebMetaOutput {
  const tags: WebMetaTag[] = [];

  tags.push({ charset: "utf-8" });
  tags.push({ name: "viewport", content: "width=device-width, initial-scale=1" });
  tags.push({ name: "description", content: config.description });

  if (config.keywords?.length) {
    tags.push({ name: "keywords", content: config.keywords.join(", ") });
  }

  if (config.robots) {
    const robotsContent = buildRobotsContent(config.robots);
    if (robotsContent) {
      tags.push({ name: "robots", content: robotsContent });
    }
    if (config.robots.googleBot) {
      const gbContent = buildGoogleBotContent(config.robots.googleBot);
      if (gbContent) {
        tags.push({ name: "googlebot", content: gbContent });
      }
    }
  }

  const canonical = config.canonical ?? BASE_URL;
  tags.push({ rel: "canonical", href: canonical });

  const og = config.og;
  if (og) {
    tags.push({ property: "og:type", content: og.type ?? "website" });
    tags.push({ property: "og:url", content: og.url ?? canonical });
    tags.push({ property: "og:title", content: og.title });
    tags.push({ property: "og:description", content: og.description });
    tags.push({ property: "og:site_name", content: og.siteName ?? SITE_NAME });
    tags.push({ property: "og:locale", content: og.locale ?? "en_US" });

    if (og.images?.length) {
      for (const image of og.images) {
        tags.push({ property: "og:image", content: image.url });
        if (image.secureUrl) {
          tags.push({ property: "og:image:secure_url", content: image.secureUrl });
        }
        if (image.type) {
          tags.push({ property: "og:image:type", content: image.type });
        }
        if (image.width) {
          tags.push({ property: "og:image:width", content: String(image.width) });
        }
        if (image.height) {
          tags.push({ property: "og:image:height", content: String(image.height) });
        }
        if (image.alt) {
          tags.push({ property: "og:image:alt", content: image.alt });
        }
      }
    } else {
      tags.push({ property: "og:image", content: DEFAULT_OG_IMAGE });
    }

    if (og.alternateLocales?.length) {
      for (const locale of og.alternateLocales) {
        tags.push({ property: "og:locale:alternate", content: locale });
      }
    }

    if (og.publishedTime) {
      tags.push({ property: "article:published_time", content: og.publishedTime });
    }
    if (og.modifiedTime) {
      tags.push({ property: "article:modified_time", content: og.modifiedTime });
    }
    if (og.section) {
      tags.push({ property: "article:section", content: og.section });
    }
    if (og.authors?.length) {
      for (const author of og.authors) {
        tags.push({ property: "article:author", content: author });
      }
    }
    if (og.tags?.length) {
      for (const tag of og.tags) {
        tags.push({ property: "article:tag", content: tag });
      }
    }
    if (og.seeAlso?.length) {
      for (const url of og.seeAlso) {
        tags.push({ property: "og:see_also", content: url });
      }
    }
  }

  const tw = config.twitter;
  if (tw) {
    tags.push({ name: "twitter:card", content: tw.card ?? "summary_large_image" });
    if (tw.site) {
      tags.push({ name: "twitter:site", content: tw.site });
    }
    if (tw.siteId) {
      tags.push({ name: "twitter:site:id", content: tw.siteId });
    }
    if (tw.creator) {
      tags.push({ name: "twitter:creator", content: tw.creator });
    }
    if (tw.creatorId) {
      tags.push({ name: "twitter:creator:id", content: tw.creatorId });
    }
    if (tw.title) {
      tags.push({ name: "twitter:title", content: tw.title });
    }
    if (tw.description) {
      tags.push({ name: "twitter:description", content: tw.description });
    }
    if (tw.images?.length) {
      for (const img of tw.images) {
        tags.push({ name: "twitter:image", content: img });
      }
    }
    if (tw.playerUrl) {
      tags.push({ name: "twitter:player", content: tw.playerUrl });
    }
    if (tw.playerWidth) {
      tags.push({ name: "twitter:player:width", content: String(tw.playerWidth) });
    }
    if (tw.playerHeight) {
      tags.push({ name: "twitter:player:height", content: String(tw.playerHeight) });
    }
  }

  if (config.alternate?.length) {
    for (const alt of config.alternate) {
      tags.push({ rel: "alternate", hreflang: alt.hreflang, href: alt.href });
    }
  }

  const jsonLd = config.jsonLd ? buildJsonLd(config.jsonLd) : null;

  return { tags, jsonLd };
}

function buildRobotsContent(robots: NonNullable<SeoConfig["robots"]>): string {
  const parts: string[] = [];
  if (robots.index === false) parts.push("noindex");
  else parts.push("index");
  if (robots.follow === false) parts.push("nofollow");
  else parts.push("follow");
  return parts.join(", ");
}

function buildGoogleBotContent(gb: {
  index?: boolean;
  follow?: boolean;
  "max-image-preview"?: "none" | "standard" | "large";
  "max-snippet"?: number;
  "max-video-preview"?: number;
}): string {
  const parts: string[] = [];
  if (gb["index"] === false) parts.push("noindex");
  else parts.push("index");
  if (gb["follow"] === false) parts.push("nofollow");
  else parts.push("follow");
  if (gb["max-image-preview"]) {
    parts.push(`max-image-preview:${gb["max-image-preview"]}`);
  }
  if (gb["max-snippet"]) {
    parts.push(`max-snippet:${gb["max-snippet"]}`);
  }
  if (gb["max-video-preview"]) {
    parts.push(`max-video-preview:${gb["max-video-preview"]}`);
  }
  return parts.join(", ");
}

export function buildJsonLd(schema: JsonLdSchema): string {
  const data = {
    "@context": "https://schema.org",
    "@type": schema.type,
    ...schema.data,
  };
  return JSON.stringify(data);
}

export function getWebRouteMeta(key: WebRouteKey) {
  return WEB_ROUTES[key] ?? WEB_ROUTES["web:index"];
}

export function getWebSeo(key: RouteKey): SeoConfig {
  return getSeoForRoute(key);
}

export function getWebMetaOutput(key: RouteKey): WebMetaOutput {
  return buildWebMeta(getWebSeo(key));
}

export function buildTitleSuffix(title: string, suffix = SITE_NAME): string {
  return title.includes(suffix) ? title : `${title} | ${suffix}`;
}

export function getPageTitle(key: RouteKey): string {
  return buildTitleSuffix(getWebSeo(key).title);
}
