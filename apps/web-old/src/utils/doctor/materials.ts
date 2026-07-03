import { getMediaUrl } from "@/utils/media-url";

export interface DoctorMediaSource {
  fileKey: string | null;
  thumbnailKey?: string | null;
}

export function getDoctorMaterialPreviewUrl(
  media: DoctorMediaSource | null | undefined
) {
  return getMediaUrl(media?.thumbnailKey ?? media?.fileKey);
}

export function getDoctorMaterialFileUrl(fileKey: string | null | undefined) {
  return getMediaUrl(fileKey);
}
