import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

export function useApproveDoctor() {
  return useMutation<any, Error, { userId: string }>({
    ...orpc.approveDoctor.mutationOptions(),
    onSuccess: () => {
      toast.success("Doctor approved");
    },
    onError: (error: Error) => {
      toast.error(error instanceof Error ? error.message : "Approval failed");
    },
  } as any);
}
