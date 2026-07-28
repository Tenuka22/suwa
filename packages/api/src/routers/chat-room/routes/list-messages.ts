import { z } from "zod";
import { protectedProcedure } from "../../../index";

export const listMessagesRoute = protectedProcedure
  .input(
    z.object({
      cursor: z.coerce.number().int().min(0).default(0),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    })
  )
  .handler(async ({ context, input }) => {
    const key = "global-chat:messages";
    const total = await context.redis.llen(key);

    if (total === 0) {
      return { messages: [], nextCursor: null, total: 0 };
    }

    const start = input.cursor;
    const end = start + input.limit - 1;
    const raw = await context.redis.lrange(key, start, end);
    const messages = raw
      .map((m) => {
        try {
          return JSON.parse(m) as {
            id: string;
            authorId: string;
            authorName: string;
            content: string;
            timestamp: number;
          };
        } catch {
          return null;
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    const nextCursor = end < total - 1 ? end + 1 : null;

    return { messages, nextCursor, total };
  });
