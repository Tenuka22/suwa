import { doctorHubMaterials, hubUploadSessions } from "@suwa/db";
import { completeHubUploadSchema } from "@suwa/db/schemas-types";
import { env } from "@suwa/env/server";
import { and, eq } from "drizzle-orm";
import { requireDoctor } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const completeHubUploadRoute = protectedProcedure
  .input(completeHubUploadSchema)
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

    const uploadedChunks: number[] = session.uploadedChunks
      ? JSON.parse(session.uploadedChunks)
      : [];

    if (uploadedChunks.length < session.totalChunks) {
      throw new Error(
        `Not all chunks uploaded: ${uploadedChunks.length}/${session.totalChunks}`
      );
    }

    // Assemble all chunks into a single binary in KV
    const assembledChunks: Uint8Array[] = [];
    for (const chunkIndex of uploadedChunks) {
      const chunkKey = `${session.fileKey}/chunks/${chunkIndex}`;
      const chunkData = await env.DOCTOR_MATERIALS_KV.get(
        chunkKey,
        "arrayBuffer"
      );
      if (!chunkData) {
        throw new Error(`Chunk ${chunkIndex} not found in KV`);
      }
      assembledChunks.push(new Uint8Array(chunkData));
    }

    // Calculate total size from chunks
    const totalSize = assembledChunks.reduce(
      (acc, chunk) => acc + chunk.length,
      0
    );

    // Concatenate all chunks into one ArrayBuffer
    const assembled = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of assembledChunks) {
      assembled.set(chunk, offset);
      offset += chunk.length;
    }

    // Store the assembled file in KV
    await env.DOCTOR_MATERIALS_KV.put(
      session.fileKey,
      assembled.buffer as ArrayBuffer
    );

    // Clean up chunk keys from KV
    for (const chunkIndex of uploadedChunks) {
      const chunkKey = `${session.fileKey}/chunks/${chunkIndex}`;
      await env.DOCTOR_MATERIALS_KV.delete(chunkKey);
    }

    // Update upload session
    const timestamp = new Date().toISOString();
    await context.db
      .update(hubUploadSessions)
      .set({
        status: "completed",
        updatedAt: timestamp,
      })
      .where(eq(hubUploadSessions.id, input.uploadId));

    // Update material record
    const updateData: Record<string, unknown> = {
      status: "ready",
      updatedAt: timestamp,
      size: totalSize,
    };

    if (input.title) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.tags) {
      updateData.tags = JSON.stringify(input.tags);
    }
    if (input.channelId !== undefined) {
      updateData.channelId = input.channelId;
    }
    if (input.playlistId !== undefined) {
      updateData.playlistId = input.playlistId;
    }
    if (input.visibility) {
      updateData.visibility = input.visibility;
    }

    await context.db
      .update(doctorHubMaterials)
      .set(updateData)
      .where(eq(doctorHubMaterials.id, session.materialId!));

    // Return the updated material
    const [material] = await context.db
      .select()
      .from(doctorHubMaterials)
      .where(eq(doctorHubMaterials.id, session.materialId!))
      .limit(1);

    return material;
  });
