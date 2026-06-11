import { useCallback } from "react";

import type { Action } from "@/components/ui/error-dialog";
import { useToast } from "@/components/ui/toast";
import { parseError } from "@/utils/error-handler";

interface UseErrorHandlerOptions {
  onHardError?: (title: string, message: string, actions?: Action[]) => void;
}

export function useErrorHandler({ onHardError }: UseErrorHandlerOptions = {}) {
  const { toast } = useToast();

  const handleError = useCallback(
    (error: unknown, context?: { action?: string; retry?: () => void }) => {
      const parsed = parseError(error);
      const actions: Action[] | undefined = context?.retry
        ? [
            { label: "Try again", onPress: context.retry, variant: "primary" },
            {
              label: "Dismiss",
              onPress: () => undefined,
              variant: "secondary",
            },
          ]
        : undefined;

      if (parsed.isSoft) {
        toast({
          type: "error",
          title: parsed.title,
          message: parsed.message,
        });
      } else if (onHardError) {
        onHardError(parsed.title, parsed.message, actions);
      } else {
        toast({
          type: "error",
          title: parsed.title,
          message: parsed.message,
        });
      }
    },
    [onHardError, toast]
  );

  return { handleError };
}
