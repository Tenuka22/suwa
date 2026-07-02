import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";
import { createVideoThumbnail, isVideoFile } from "@/utils/video-thumbnail";

export function useDoctorFiles() {
  return useQuery({
    queryKey: orpc.myDoctorFiles.queryKey(),
    queryFn: () => orpc.myDoctorFiles.call(),
  });
}

interface UploadDoctorFileInput {
  caption?: string;
  doctorId: string;
  file: File;
  fileKind: "portrait" | "qualification" | "intro_video" | "other";
}

export function useUploadDoctorFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadDoctorFileInput) => {
      const thumbnail = isVideoFile(input.file)
        ? await createVideoThumbnail(input.file)
        : null;

      return orpc.createDoctorFile.call({
        caption: input.caption,
        doctorId: input.doctorId,
        file: input.file,
        fileKind: input.fileKind,
        ...(thumbnail
          ? {
              thumbnailDataBase64: thumbnail.dataBase64,
              thumbnailMimeType: thumbnail.mimeType,
            }
          : {}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.myDoctorFiles.queryKey(),
      });
    },
  });
}

export function useDeleteDoctorFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string }) => orpc.deleteDoctorFile.call(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.myDoctorFiles.queryKey(),
      });
    },
  });
}
