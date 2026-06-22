import { useEffect, useState } from "react";

import { orpc } from "@/utils/orpc";

export function useHubMaterialFile(materialId: string | null) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!materialId) {
      setFileUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isActive = true;
    let nextObjectUrl: string | null = null;

    setIsLoading(true);
    setError(null);

    void orpc.getMaterialFile
      .call({ materialId })
      .then((file) => {
        if (!isActive) {
          return;
        }

        if (!file) {
          setError("File not found");
          setIsLoading(false);
          return;
        }

        nextObjectUrl = URL.createObjectURL(file);
        if (isActive) {
          setFileUrl(nextObjectUrl);
          setIsLoading(false);
        } else if (nextObjectUrl) {
          URL.revokeObjectURL(nextObjectUrl);
        }
      })
      .catch((err) => {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Failed to load file");
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [materialId]);

  return { fileUrl, isLoading, error };
}
