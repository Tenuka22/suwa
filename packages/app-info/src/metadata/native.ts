import type { NativeRouteKey } from "./types";
import { NATIVE_ROUTES } from "./registry";

const APP_NAME = "Suwa";
const APP_URL = "suwa://";
const APP_BUNDLE_ID = "app.suwa.mobile";
const APP_PLAY_STORE_ID = "app.suwa.mobile";
const RATE_APP_URL_IOS = `itms-apps://itunes.apple.com/app/id${APP_BUNDLE_ID}?action=write-review`;
const RATE_APP_URL_ANDROID = `market://details?id=${APP_PLAY_STORE_ID}`;
const APP_SHARE_URL = `https://apps.apple.com/app/id${APP_BUNDLE_ID}`;
const APP_SHARE_MESSAGE = "Check out Suwa for mental health support";

export interface NativeAppLinkConfig {
  path: string;
  fallbackUrl?: string;
}

export interface NativeScreenMeta {
  screenTitle: string;
  screenClassName?: string;
  navBarTitle?: string;
  linkConfig?: NativeAppLinkConfig;
  shareConfig?: NativeShareConfig;
}

export interface NativeShareConfig {
  title: string;
  message: string;
  url?: string;
}

export interface NativeDeepLink {
  path: string;
  params?: Record<string, string>;
}

export function getNativeRouteMeta(key: NativeRouteKey): NativeScreenMeta | null {
  const route = NATIVE_ROUTES[key];
  if (!route?.native || !route?.path) return null;

  const path: string = route.path;
  const screenTitle: string = route.native.screenTitle ?? APP_NAME;

  return {
    screenTitle,
    screenClassName: route.native.screenClassName,
    navBarTitle: route.native.navBarTitle,
    linkConfig: buildLinkConfig(path),
    shareConfig: buildShareConfig(path, screenTitle),
  };
}

export function buildLinkConfig(path: string): NativeAppLinkConfig {
  return {
    path: `${APP_URL}${path.replace(/\/[^/]+/g, (m, i) => (i === 0 ? m : `/${m}`))}`,
    fallbackUrl: `${APP_URL}${path}`,
  };
}

export function buildShareConfig(
  path: string,
  screenTitle: string
): NativeShareConfig {
  return {
    title: `${screenTitle} - ${APP_NAME}`,
    message: `${APP_SHARE_MESSAGE}: ${screenTitle}`,
    url: `${APP_SHARE_URL}${path}`,
  };
}

export function getAppLinks(): AppLinks {
  return {
    ios: {
      url: APP_URL,
      appStoreId: APP_BUNDLE_ID,
      package: undefined,
    },
    android: {
      url: APP_URL,
      package: APP_PLAY_STORE_ID,
      appStoreId: undefined,
    },
    web: {
      url: `https://suwa.app`,
    },
  };
}

interface AppLinks {
  ios: {
    url: string;
    appStoreId: string;
    package?: undefined;
  };
  android: {
    url: string;
    package: string;
    appStoreId?: undefined;
  };
  web: {
    url: string;
  };
}

export function getNativeScreenMeta(
  key: NativeRouteKey
): NativeScreenMeta {
  return (
    getNativeRouteMeta(key) ?? {
      screenTitle: APP_NAME,
    }
  );
}

export function getScreenTitle(key: NativeRouteKey): string {
  return getNativeScreenMeta(key).screenTitle;
}

export function buildAppleWebAppMeta(): NativeWebAppMeta {
  return {
    appleMobileWebAppCapable: "yes",
    appleMobileWebAppStatusBarStyle: "black-translucent",
    appleMobileWebAppTitle: APP_NAME,
  };
}

interface NativeWebAppMeta {
  appleMobileWebAppCapable: string;
  appleMobileWebAppStatusBarStyle: string;
  appleMobileWebAppTitle: string;
}

export function getRateAppLinks(): { ios: string; android: string } {
  return {
    ios: RATE_APP_URL_IOS,
    android: RATE_APP_URL_ANDROID,
  };
}

export function buildTwitterCard(): { card: string; site: string; creator: string } {
  return {
    card: "summary",
    site: "@getsuwa",
    creator: "@getsuwa",
  };
}