import { useEffect, useState } from "react";

import { getDoctorMaterialFile } from "../utils/-materials";

export function useDoctorMaterialPreviewUrl(id: string) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    let nextObjectUrl: string | null = null;

    void getDoctorMaterialFile(id).then((file) => {
      if (!isActive || !file) {
        return;
      }

      nextObjectUrl = URL.createObjectURL(file);
      setPreviewUrl(nextObjectUrl);
    });

    return () => {
      isActive = false;
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [id]);

  return previewUrl;
}
