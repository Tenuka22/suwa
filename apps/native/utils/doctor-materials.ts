"use client";

import { getMediaUrl } from "./media-url";

export interface DoctorMediaSource {
  fileKey: string | null;
  thumbnailKey?: string | null;
}

export function useDoctorMaterialPreviewUrl(
  media: DoctorMediaSource | null | undefined
) {
  return getMediaUrl(media?.thumbnailKey ?? media?.fileKey);
}
