import { hubUploadSessions } from "@suwa/db";
import { uploadHubChunkSchema } from "@suwa/db/schemas-types";
import { env } from "@suwa/env/server";
import { and, eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const uploadHubChunkRoute = protectedProcedure
  .input(uploadHubChunkSchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = await requireDoctor(context);

    // Fetch the upload session
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

    if (session.status === "completed" || session.status === "cancelled") {
      throw new Error(`Upload session is ${session.status}`);
    }

    if (input.chunkIndex >= session.totalChunks) {
      throw new Error("Chunk index out of range");
    }

    // Decode base64 chunk data
    const chunkBuffer = Uint8Array.from(atob(input.chunkData), (c) =>
      c.charCodeAt(0)
    );

    // Store chunk in KV with its index
    const chunkKey = `${session.fileKey}/chunks/${input.chunkIndex}`;
    await env.DOCTOR_MATERIALS_KV.put(
      chunkKey,
      chunkBuffer.buffer as ArrayBuffer
    );

    // Update uploaded chunks list
    const uploadedChunks: number[] = session.uploadedChunks
      ? JSON.parse(session.uploadedChunks)
      : [];

    if (!uploadedChunks.includes(input.chunkIndex)) {
      uploadedChunks.push(input.chunkIndex);
      uploadedChunks.sort((a, b) => a - b);
    }

    const timestamp = new Date().toISOString();
    const newStatus =
      uploadedChunks.length >= session.totalChunks
        ? "completed"
        : "in_progress";

    await context.db
      .update(hubUploadSessions)
      .set({
        uploadedChunks: JSON.stringify(uploadedChunks),
        status: newStatus,
        updatedAt: timestamp,
      })
      .where(eq(hubUploadSessions.id, input.uploadId));

    return {
      chunkIndex: input.chunkIndex,
      uploadedCount: uploadedChunks.length,
      totalChunks: session.totalChunks,
      progress: uploadedChunks.length / session.totalChunks,
      isComplete: uploadedChunks.length >= session.totalChunks,
    };
  });
