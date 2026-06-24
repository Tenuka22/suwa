export function getMobileWebUrl(): string {
  return new URL("/landing", import.meta.env.VITE_MOBILE_WEB_URL).toString();
}

export const MOBILE_WEB_URL = getMobileWebUrl();
