import { env } from "@suwa/env/native";

export function getMediaUrl(key: string | null | undefined) {
  if (!key) {
    return null;
  }

  return `${env.EXPO_PUBLIC_SERVER_URL}/images/${encodeURIComponent(key)}`;
}
