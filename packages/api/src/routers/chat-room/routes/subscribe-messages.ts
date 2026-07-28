import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const subscribeMessagesRoute = protectedProcedure
  .input(
    z.object({
      knownCount: z.coerce.number().int().min(0).default(0),
    })
  )
  .handler(async function* ({ context, input, signal }) {
    requireAuth(context);
    const key = "global-chat:messages";
    let knownCount = input.knownCount;

    while (!signal?.aborted) {
      try {
        const total = await context.redis.llen(key);
        if (total > knownCount) {
          const raw = await context.redis.lrange(key, knownCount, total - 1);
          knownCount = total;
          const messages = raw
            .map((m) => {
              try {
                return JSON.parse(m) as {
                  authorId: string;
                  authorName: string;
                  content: string;
                  id: string;
                  timestamp: number;
                };
              } catch {
                return null;
              }
            })
            .filter((m): m is NonNullable<typeof m> => m !== null);

          if (messages.length > 0) {
            yield { type: "new_messages" as const, messages };
          }
        }
      } catch {
        // poll failed, retry
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  });
