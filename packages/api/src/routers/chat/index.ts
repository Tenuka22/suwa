import { z } from "zod";
import { protectedProcedure } from "../../index";

export const chatRouter = {
  sendMessage: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(5000),
        conversationId: z.string().optional(),
      })
    )
    .handler(async ({ context, input }) => ({
      id: crypto.randomUUID(),
      message: input.message,
      userId: context.auth!.userId,
      conversationId: input.conversationId || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    })),

  subscribeMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
      })
    )
    .handler(async function* ({ context, input, signal }) {
      const userId = context.auth!.userId;

      yield {
        type: "connected" as const,
        conversationId: input.conversationId,
        userId,
      };

      let count = 0;
      while (!signal?.aborted) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        if (signal?.aborted) {
          break;
        }

        yield {
          type: "heartbeat" as const,
          conversationId: input.conversationId,
          timestamp: new Date().toISOString(),
          count: ++count,
        };
      }

      yield {
        type: "disconnected" as const,
        conversationId: input.conversationId,
      };
    }),
};
