import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

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
    mutationFn: (input: UploadDoctorFileInput) =>
      orpc.createDoctorFile.call({
        caption: input.caption,
        doctorId: input.doctorId,
        file: input.file,
        fileKind: input.fileKind,
      }),
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
