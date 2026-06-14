'use client';

import { useEffect, useState } from "react";

import { orpc } from "@/utils/orpc";

export function useDoctorMaterialPreviewUrl(id: string | null) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setPreviewUrl(null);
      return;
    }

    let active = true;

    const loadPreview = async () => {
      const file = await orpc.getDoctorFile.call({ id });

      if (!(active && file)) {
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (active && typeof reader.result === "string") {
          setPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    };

    loadPreview().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [id]);

  return previewUrl;
}
