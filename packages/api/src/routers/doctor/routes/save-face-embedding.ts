import { doctorProfiles } from "@suwa/db";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const FACE_EMBEDDING_KV_PREFIX = "face-embedding:";
const FACE_VIDEO_KV_PREFIX = "face-video:";

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
      const videoKvKey = `${FACE_VIDEO_KV_PREFIX}${userId}`;
      const videoBytes = Uint8Array.from(atob(input.videoBase64), (c) =>
        c.charCodeAt(0)
      );
      await context.faceVideosKv.put(videoKvKey, videoBytes, {
        metadata: { mimeType: "video/webm" },
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
