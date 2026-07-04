import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const FACE_EMBEDDING_PREFIX = "face-embedding:";

export const myFaceEmbeddingRoute = protectedProcedure
  .input(z.void())
  .handler(async ({ context }) => {
    const { userId } = requireAuth(context);

    const object = await context.faceEmbeddingsBucket.get(
      `${FACE_EMBEDDING_PREFIX}${userId}`
    );
    if (!object) {
      return null;
    }

    const raw = await object.text();
    const embedding = JSON.parse(raw) as number[];
    return embedding;
  });
