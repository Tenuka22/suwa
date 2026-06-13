import { conversations } from "@zen-doc/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../index";

export interface ChatMessage {
  content: string;
  id: string;
  role: "user" | "assistant" | "system";
  timestamp: string;
}

export const chatHttpRouter = {
  getConversations: protectedProcedure
    .input(z.object({}))
    .handler(async ({ context }) => {
      const userId = context.auth!.userId;
      const results = await context.db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt));
      return results;
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.number().optional(), // index offset
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .handler(async ({ context, input }) => {
      const userId = context.auth!.userId;

      const [conversation] = await context.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (!conversation || conversation.userId !== userId) {
        throw new Error("Conversation not found or access denied");
      }

      const key = `chat:${input.conversationId}:messages`;
      const messagesRaw = await context.chatMessagesKv.get(key);
      const allMessages: ChatMessage[] = messagesRaw
        ? JSON.parse(messagesRaw)
        : [];

      const reversed = [...allMessages].reverse();
      const start = input.cursor ?? 0;
      const end = start + input.limit;
      const items = reversed.slice(start, end);

      const nextCursor = end < reversed.length ? end : null;

      return {
        items,
        nextCursor,
      };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(5000),
        conversationId: z.string().optional(),
      })
    )
    .handler(async ({ context, input }) => {
      const userId = context.auth!.userId;
      let conversationId = input.conversationId;

      if (conversationId) {
        const [conversation] = await context.db
          .select()
          .from(conversations)
          .where(eq(conversations.id, conversationId))
          .limit(1);

        if (!conversation || conversation.userId !== userId) {
          throw new Error("Conversation not found or access denied");
        }

        await context.db
          .update(conversations)
          .set({ updatedAt: new Date().toISOString() })
          .where(eq(conversations.id, conversationId));
      } else {
        conversationId = crypto.randomUUID();
        await context.db.insert(conversations).values({
          id: conversationId,
          userId,
          title: input.message.slice(0, 50),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const key = `chat:${conversationId}:messages`;
      const messagesRaw = await context.chatMessagesKv.get(key);
      const allMessages: ChatMessage[] = messagesRaw
        ? JSON.parse(messagesRaw)
        : [];

      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: input.message,
        timestamp: new Date().toISOString(),
      };

      allMessages.push(newMessage);
      await context.chatMessagesKv.put(key, JSON.stringify(allMessages));

      return {
        message: newMessage,
        conversationId,
      };
    }),
};

export const chatWsRouter = {
  subscribeMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
      })
    )
    .handler(async function* ({ context, input, signal }) {
      // WS placeholder for now
      yield { type: "connected", conversationId: input.conversationId };
    }),
};
