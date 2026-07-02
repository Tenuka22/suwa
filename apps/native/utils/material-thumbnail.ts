"use client";

import { getMediaUrl } from "./media-url";

export interface MaterialPreviewSource {
  fileKey: string | null;
  thumbnailKey?: string | null;
}

export function useMaterialThumbnail(
  material: MaterialPreviewSource | null | undefined
) {
  return {
    uri: getMediaUrl(material?.thumbnailKey ?? material?.fileKey),
    loading: false,
  };
}
