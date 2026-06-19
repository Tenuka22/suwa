import { z } from "zod";
import { publicProcedure } from "../../../index";

const materialLikes = new Map<string, Set<string>>();
const materialComments = new Map<
  string,
  Array<{ id: string; userId: string; text: string; createdAt: string }>
>();

export const toggleLikeMaterialRoute = publicProcedure
  .input(z.object({ materialId: z.string().min(1), userId: z.string().min(1) }))
  .handler(async ({ input }) => {
    const likes = materialLikes.get(input.materialId) ?? new Set();
    if (likes.has(input.userId)) {
      likes.delete(input.userId);
      materialLikes.set(input.materialId, likes);
      return { liked: false };
    }
    likes.add(input.userId);
    materialLikes.set(input.materialId, likes);
    return { liked: true };
  });

export const getMaterialLikeStatusRoute = publicProcedure
  .input(z.object({ materialId: z.string().min(1), userId: z.string().min(1) }))
  .handler(async ({ input }) => {
    const likes = materialLikes.get(input.materialId) ?? new Set();
    return { liked: likes.has(input.userId) };
  });

export const addMaterialCommentRoute = publicProcedure
  .input(
    z.object({
      materialId: z.string().min(1),
      userId: z.string().min(1),
      text: z.string().min(1).max(500),
    })
  )
  .handler(async ({ input }) => {
    const comments = materialComments.get(input.materialId) ?? [];
    const comment = {
      id: crypto.randomUUID(),
      userId: input.userId,
      text: input.text,
      createdAt: new Date().toISOString(),
    };
    comments.push(comment);
    materialComments.set(input.materialId, comments);
    return comment;
  });

export const listMaterialCommentsRoute = publicProcedure
  .input(z.object({ materialId: z.string().min(1) }))
  .handler(async ({ input }) => materialComments.get(input.materialId) ?? []);
