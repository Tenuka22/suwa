import { doctorProfiles } from "@suwa/db";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const KV_KEY_PREFIX = "face-embedding:";

export const saveFaceEmbeddingRoute = protectedProcedure
  .input(
    z.object({
      embedding: z.array(z.number()),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const embeddingJson = JSON.stringify(input.embedding);
    const timestamp = new Date().toISOString();
    const kvKey = `${KV_KEY_PREFIX}${userId}`;

    await context.faceEmbeddingsKv.put(kvKey, embeddingJson);

    await context.db
      .insert(doctorProfiles)
      .values({
        userId,
        faceEmbeddingKvKey: kvKey,
        permanent: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: doctorProfiles.userId,
        set: { faceEmbeddingKvKey: kvKey, updatedAt: timestamp },
      });

    return { ok: true };
  });
