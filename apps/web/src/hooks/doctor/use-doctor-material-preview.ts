import {
  getDoctorMaterialPreviewUrl,
  type DoctorMediaSource,
} from "@/utils/doctor/materials";

export function useDoctorMaterialPreviewUrl(
  media: DoctorMediaSource | null | undefined
) {
  return getDoctorMaterialPreviewUrl(media);
}
