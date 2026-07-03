import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { orpc } from "@/utils/orpc";
import { createVideoThumbnail, isVideoFile } from "@/utils/video-thumbnail";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB - must match server

export interface UploadProgress {
  error: string | null;
  fileName: string;
  materialId: string;
  progress: number; // 0 to 1
  status:
    | "idle"
    | "initializing"
    | "uploading"
    | "completing"
    | "done"
    | "error"
    | "paused";
  totalChunks: number;
  uploadedChunks: number;
  uploadId: string;
}

interface UseChunkedUploadOptions {
  onComplete?: (materialId: string) => void;
  onError?: (error: string) => void;
}

export function useChunkedUpload(options?: UseChunkedUploadOptions) {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const abortRef = useRef(false);
  const queryClient = useQueryClient();

  const startUpload = useCallback(
    async (
      file: File,
      input: {
        fileType: "video" | "audio";
        channelId?: string;
        visibility?: "public" | "unlisted" | "private";
        title?: string;
      }
    ) => {
      abortRef.current = false;
      setProgress({
        uploadId: "",
        materialId: "",
        fileName: file.name,
        totalChunks: Math.ceil(file.size / CHUNK_SIZE),
        uploadedChunks: 0,
        progress: 0,
        status: "initializing",
        error: null,
      });

      try {
        // Step 1: Initialize upload
        const thumbnail = isVideoFile(file)
          ? await createVideoThumbnail(file)
          : null;

        const initResult = await orpc.initHubUpload.call({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          totalSize: file.size,
          fileType: input.fileType,
          title: input.title,
          channelId: input.channelId,
          visibility: input.visibility ?? "private",
          ...(thumbnail
            ? {
                thumbnailDataBase64: thumbnail.dataBase64,
                thumbnailMimeType: thumbnail.mimeType,
              }
            : {}),
        });

        setProgress((prev) =>
          prev
            ? {
                ...prev,
                uploadId: initResult.uploadId,
                materialId: initResult.materialId,
                totalChunks: initResult.totalChunks,
                status: "uploading",
              }
            : null
        );

        // Step 2: Upload chunks sequentially
        for (let i = 0; i < initResult.totalChunks; i++) {
          if (abortRef.current) {
            setProgress((prev) =>
              prev ? { ...prev, status: "paused" } : null
            );
            return;
          }

          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          const chunkBuffer = await chunk.arrayBuffer();
          const base64 = arrayBufferToBase64(chunkBuffer);

          const chunkResult = await orpc.uploadHubChunk.call({
            uploadId: initResult.uploadId,
            chunkIndex: i,
            chunkData: base64,
          });

          setProgress((prev) =>
            prev
              ? {
                  ...prev,
                  uploadedChunks: chunkResult.uploadedCount,
                  progress: chunkResult.progress,
                }
              : null
          );
        }

        // Step 3: Complete upload
        setProgress((prev) =>
          prev ? { ...prev, status: "completing" } : null
        );

        await orpc.completeHubUpload.call({
          uploadId: initResult.uploadId,
          title: input.title,
          visibility: input.visibility,
          channelId: input.channelId,
        });

        setProgress((prev) =>
          prev ? { ...prev, status: "done", progress: 1 } : null
        );

        await queryClient.invalidateQueries({
          queryKey: orpc.listMaterials.queryKey({
            input: { page: 1, pageSize: 50 },
          }),
        });

        options?.onComplete?.(initResult.materialId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setProgress((prev) =>
          prev ? { ...prev, status: "error", error: message } : null
        );
        options?.onError?.(message);
      }
    },
    [queryClient, options]
  );

  const resumeUpload = useCallback(async (uploadId: string) => {
    try {
      // Check upload status to find missing chunks
      const status = await orpc.getHubUploadStatus.call({ uploadId });

      if (status.status === "completed") {
        setProgress((prev) =>
          prev
            ? { ...prev, status: "done", progress: 1 }
            : {
                uploadId: status.uploadId,
                materialId: status.materialId ?? "",
                fileName: status.fileName,
                totalChunks: status.totalChunks,
                uploadedChunks: status.totalChunks,
                progress: 1,
                status: "done",
                error: null,
              }
        );
        return;
      }

      abortRef.current = false;
      setProgress((prev) =>
        prev
          ? { ...prev, status: "uploading" }
          : {
              uploadId: status.uploadId,
              materialId: status.materialId ?? "",
              fileName: status.fileName,
              totalChunks: status.totalChunks,
              uploadedChunks: status.uploadedChunks.length,
              progress: status.progress,
              status: "uploading",
              error: null,
            }
      );

      // For resume, we'd need the original file - this is handled by the UI
      // The status tells us which chunks are missing
      // The caller should re-select the same file and call resumeWithFile
    } catch (err) {
      const message = err instanceof Error ? err.message : "Resume failed";
      setProgress((prev) =>
        prev ? { ...prev, status: "error", error: message } : null
      );
    }
  }, []);

  const resumeWithFile = useCallback(
    async (file: File, uploadId: string) => {
      try {
        const status = await orpc.getHubUploadStatus.call({ uploadId });

        if (status.status === "completed") {
          setProgress({
            uploadId: status.uploadId,
            materialId: status.materialId ?? "",
            fileName: status.fileName,
            totalChunks: status.totalChunks,
            uploadedChunks: status.totalChunks,
            progress: 1,
            status: "done",
            error: null,
          });
          return;
        }

        abortRef.current = false;
        setProgress({
          uploadId: status.uploadId,
          materialId: status.materialId ?? "",
          fileName: status.fileName,
          totalChunks: status.totalChunks,
          uploadedChunks: status.uploadedChunks.length,
          progress: status.progress,
          status: "uploading",
          error: null,
        });

        // Upload only missing chunks
        for (const chunkIndex of status.missingChunks) {
          if (abortRef.current) {
            setProgress((prev) =>
              prev ? { ...prev, status: "paused" } : null
            );
            return;
          }

          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          const chunkBuffer = await chunk.arrayBuffer();
          const base64 = arrayBufferToBase64(chunkBuffer);

          const chunkResult = await orpc.uploadHubChunk.call({
            uploadId: status.uploadId,
            chunkIndex,
            chunkData: base64,
          });

          setProgress((prev) =>
            prev
              ? {
                  ...prev,
                  uploadedChunks: chunkResult.uploadedCount,
                  progress: chunkResult.progress,
                }
              : null
          );
        }

        // Complete upload
        setProgress((prev) =>
          prev ? { ...prev, status: "completing" } : null
        );

        await orpc.completeHubUpload.call({ uploadId });

        setProgress((prev) =>
          prev ? { ...prev, status: "done", progress: 1 } : null
        );

        await queryClient.invalidateQueries({
          queryKey: orpc.listMaterials.queryKey({
            input: { page: 1, pageSize: 50 },
          }),
        });

        options?.onComplete?.(status.materialId ?? "");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Resume failed";
        setProgress((prev) =>
          prev ? { ...prev, status: "error", error: message } : null
        );
      }
    },
    [queryClient, options]
  );

  const pauseUpload = useCallback(() => {
    abortRef.current = true;
  }, []);

  const resetUpload = useCallback(() => {
    abortRef.current = true;
    setProgress(null);
  }, []);

  return {
    progress,
    startUpload,
    resumeUpload,
    resumeWithFile,
    pauseUpload,
    resetUpload,
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
