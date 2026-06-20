"use client";

import * as FileSystem from "expo-file-system";
import { useEffect, useState } from "react";
import { orpc } from "@/utils/orpc";

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
        const file = await orpc.getHubMaterialFile.call({ id: materialId });
        if (!(active && file)) {
          return;
        }

        const cachePath = `${FileSystem.Paths.cache.uri}thumb-${materialId}.jpg`;
        const cacheFile = new FileSystem.File(cachePath);
        if (cacheFile.exists) {
          setUri(cachePath);
          setLoading(false);
          return;
        }

        const blob = file as Blob;
        const buffer = await blob.arrayBuffer();
        cacheFile.create({ overwrite: true });
        cacheFile.write(new Uint8Array(buffer));

        const { getThumbnailAsync } = await import("expo-video-thumbnails");
        const result = await getThumbnailAsync(cacheFile.uri, {
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
