export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  robots?: RobotsConfig;
  og?: OpenGraphConfig;
  twitter?: TwitterCardConfig;
  jsonLd?: JsonLdSchema;
  alternate?: AlternateLocale[];
}

export interface RobotsConfig {
  index?: boolean;
  follow?: boolean;
  googleBot?: {
    index?: boolean;
    follow?: boolean;
    "max-image-preview"?: "none" | "standard" | "large";
    "max-snippet"?: number;
    "max-video-preview"?: number;
  };
}

export interface OpenGraphConfig {
  type?: "website" | "article" | "profile" | "book" | "music" | "video" | "product";
  url?: string;
  title: string;
  description: string;
  siteName?: string;
  images?: OgImage[];
  locale?: string;
  alternateLocales?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
  seeAlso?: string[];
}

export interface OgImage {
  url: string;
  secureUrl?: string;
  type?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface TwitterCardConfig {
  card?: "summary" | "summary_large_image" | "app" | "player";
  site?: string;
  siteId?: string;
  creator?: string;
  creatorId?: string;
  title?: string;
  description?: string;
  images?: string[];
  playerUrl?: string;
  playerWidth?: number;
  playerHeight?: number;
}

export interface JsonLdSchema {
  type: string;
  data: Record<string, unknown>;
}

export interface AlternateLocale {
  hreflang: string;
  href: string;
}

export interface AppMeta {
  name: string;
  shortName: string;
  description: string;
  url: string;
  ogImage: string;
  twitterHandle: string;
  themeColor: string;
  appleTouchIcon: string;
  favicon: string;
  keywords: string[];
  authors: string[];
}

export type Platform = "landing" | "web" | "native";

export type RouteKey =
  | LandingRouteKey
  | WebRouteKey
  | NativeRouteKey;

export type LandingRouteKey =
  | "landing:home"
  | "landing:pricing"
  | "landing:contact";

export type WebRouteKey =
  | "web:index"
  | "web:sign-in"
  | "web:sign-up"
  | "web:onboarding"
  | "web:admin:index"
  | "web:admin:doctors:index"
  | "web:admin:doctors:detail"
  | "web:admin:patients:index"
  | "web:admin:sessions:index"
  | "web:admin:sessions:detail"
  | "web:admin:plans:index"
  | "web:admin:doc-requests:index"
  | "web:admin:chat-settings"
  | "web:doctor:index"
  | "web:doctor:availability"
  | "web:doctor:plans"
  | "web:doctor:profile"
  | "web:doctor:sessions:index"
  | "web:doctor:sessions:detail"
  | "web:doctor:hub"
  | "web:doctor:hub:detail"
  | "web:tenant:index"
  | "web:tenant:create"
  | "web:tenant:detail"
  | "web:tenant:doctors"
  | "web:tenant:settings"
  | "web:tenant:attendance"
  | "web:tenant:invite"
  | "web:tenant:clinics:index"
  | "web:tenant:clinics:detail";

export type NativeRouteKey =
  | "native:patient:index"
  | "native:patient:ai"
  | "native:patient:appointments:index"
  | "native:patient:appointments:detail"
  | "native:patient:doctors:index"
  | "native:patient:doctors:detail"
  | "native:patient:hospitals:detail"
  | "native:patient:health-hub"
  | "native:patient:profile"
  | "native:patient:map"
  | "native:patient:materials:index"
  | "native:patient:materials:detail"
  | "native:patient:doctors:booking";

export interface RouteMeta {
  key: RouteKey;
  platform: Platform;
  path: string;
  seo: SeoConfig;
  native?: NativeScreenConfig;
}

export interface NativeScreenConfig {
  screenTitle?: string;
  screenClassName?: string;
  navBarTitle?: string;
}