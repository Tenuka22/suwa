import { env } from "@suwa/env/web";

export function getMediaUrl(key: string | null | undefined) {
  if (!key) {
    return null;
  }

  return `${env.VITE_SERVER_URL}/images/${encodeURIComponent(key)}`;
}
