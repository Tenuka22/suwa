import { doctorProfiles } from "@suwa/db";
import { z } from "zod";
import { base64ToUint8Array, putStoredFile } from "../../../doctor-materials";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const FACE_EMBEDDING_KV_PREFIX = "face-embedding:";
const FACE_VIDEO_PREFIX = "face-video:";

export const saveFaceEmbeddingRoute = protectedProcedure
  .input(
    z.object({
      embedding: z.array(z.number()),
      videoBase64: z.string().optional(),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const timestamp = new Date().toISOString();
    const embeddingKvKey = `${FACE_EMBEDDING_KV_PREFIX}${userId}`;

    await context.faceEmbeddingsKv.put(
      embeddingKvKey,
      JSON.stringify(input.embedding)
    );

    if (input.videoBase64) {
      await putStoredFile(context.faceVideosBucket, {
        key: `${FACE_VIDEO_PREFIX}${userId}`,
        data: base64ToUint8Array(input.videoBase64),
        mimeType: "video/webm",
      });
    }

    await context.db
      .insert(doctorProfiles)
      .values({
        userId,
        faceEmbeddingKvKey: embeddingKvKey,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: doctorProfiles.userId,
        set: { faceEmbeddingKvKey: embeddingKvKey, updatedAt: timestamp },
      });

    return { ok: true };
  });
