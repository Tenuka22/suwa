import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

export function useApproveDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.approveDoctor.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(orpc.pendingDoctors.queryOptions());
    },
  });
}
