import { hubUploadSessions } from "@suwa/db";
import { getHubUploadStatusSchema } from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getHubUploadStatusRoute = protectedProcedure
  .input(getHubUploadStatusSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    const [session] = await context.db
      .select()
      .from(hubUploadSessions)
      .where(
        and(
          eq(hubUploadSessions.id, input.uploadId),
          eq(hubUploadSessions.doctorId, doctorId)
        )
      )
      .limit(1);

    if (!session) {
      throw new Error("Upload session not found");
    }

    const uploadedChunks: number[] = session.uploadedChunks
      ? JSON.parse(session.uploadedChunks)
      : [];

    return {
      uploadId: session.id,
      materialId: session.materialId,
      fileName: session.fileName,
      mimeType: session.mimeType,
      totalSize: session.totalSize,
      chunkSize: session.chunkSize,
      totalChunks: session.totalChunks,
      uploadedChunks,
      missingChunks: Array.from(
        { length: session.totalChunks },
        (_, i) => i
      ).filter((i) => !uploadedChunks.includes(i)),
      status: session.status,
      progress: uploadedChunks.length / session.totalChunks,
      fileKey: session.fileKey,
    };
  });
