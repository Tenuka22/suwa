import { doctorHubMaterials, hubUploadSessions } from "@suwa/db";
import { CHUNK_SIZE, initHubUploadSchema } from "@suwa/db/schemas-types";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const initHubUploadRoute = protectedProcedure
  .input(initHubUploadSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const uploadId = crypto.randomUUID();
    const materialId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const fileKey = `hub-uploads/${doctorId}/${materialId}/${input.fileName}`;
    const totalChunks = Math.ceil(input.totalSize / CHUNK_SIZE);

    // Create upload session
    await context.db.insert(hubUploadSessions).values({
      id: uploadId,
      doctorId,
      materialId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      totalSize: input.totalSize,
      chunkSize: CHUNK_SIZE,
      totalChunks,
      uploadedChunks: JSON.stringify([]),
      status: "pending",
      fileKey,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Create material record in "uploading" status
    await context.db.insert(doctorHubMaterials).values({
      id: materialId,
      doctorId,
      channelId: input.channelId ?? null,
      title: input.title ?? input.fileName,
      description: null,
      content: null,
      fileKey,
      thumbnailKey: null,
      fileType: input.fileType,
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.totalSize,
      durationSeconds: null,
      visibility: input.visibility,
      status: "uploading",
      tags: null,
      metadata: null,
      playlistId: null,
      isIndividual: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return {
      uploadId,
      materialId,
      chunkSize: CHUNK_SIZE,
      totalChunks,
      fileKey,
    };
  });
