"use client";

import { env } from "@suwa/env/native";
import * as FileSystem from "expo-file-system";
import { useEffect, useState } from "react";

export function useMaterialThumbnail(materialId: string | null) {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!materialId) {
      setUri(null);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const cachePath = `${FileSystem.Paths.cache.uri}thumb-${materialId}.jpg`;
        const cacheFile = new FileSystem.File(cachePath);
        if (cacheFile.exists) {
          setUri(cachePath);
          setLoading(false);
          return;
        }

        const downloadPath = `${FileSystem.Paths.cache.uri}raw-${materialId}`;
        await FileSystem.downloadAsync(
          `${env.EXPO_PUBLIC_SERVER_URL}/materials/${materialId}/file`,
          downloadPath
        );

        if (!active) {
          return;
        }

        const { getThumbnailAsync } = await import("expo-video-thumbnails");
        const result = await getThumbnailAsync(downloadPath, {
          time: 0,
          quality: 0.5,
        });

        if (!active) {
          return;
        }

        if (result?.uri) {
          setUri(result.uri);
        }
      } catch {
        // ignore
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [materialId]);

  return { uri, loading };
}
