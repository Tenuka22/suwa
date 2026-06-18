"use client";

import { useCallback } from "react";

import type { Action } from "@/components/design/ui/error-dialog";
import { showToast } from "@/components/design/ui/toast";
import { parseError } from "@/utils/error-handler";

interface UseErrorHandlerOptions {
  onHardError?: (title: string, message: string, actions?: Action[]) => void;
}

export function useErrorHandler({ onHardError }: UseErrorHandlerOptions = {}) {
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
        showToast({
          type: "error",
          title: parsed.title,
          message: parsed.message,
        });
      } else if (onHardError) {
        onHardError(parsed.title, parsed.message, actions);
      } else {
        showToast({
          type: "error",
          title: parsed.title,
          message: parsed.message,
        });
      }
    },
    [onHardError]
  );

  return { handleError };
}
