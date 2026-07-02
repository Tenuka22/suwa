import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../index";
import { runAgentStream } from "./graph";
import type { ChatMessage } from "./storage";
import {
  addMessages,
  createSession,
  deleteSession,
  forkSession as forkStorage,
  getMessages,
  getSession,
  listSessions,
} from "./storage";
import { getAgentInfo } from "./tools";

const sessionId = z.string().min(1);
const agentInfo = getAgentInfo();

export const aiRouter = {
  chat: {
    send: protectedProcedure
      .input(
        z.object({
          sessionId,
          message: z.string().min(1).max(10_000),
        })
      )
      .handler(async function* ({ context, input }) {
        const uid = context.auth?.userId;
        if (!uid) {
          throw new ORPCError("UNAUTHORIZED");
        }
        const kv = context.chatMessagesKv;

        const existing = await getSession(kv, input.sessionId);
        if (!existing) {
          throw new ORPCError("NOT_FOUND", { message: "Session not found" });
        }
        if (existing.userId !== uid) {
          throw new ORPCError("FORBIDDEN");
        }

        const userMsg: ChatMessage = {
          id: crypto.randomUUID(),
          sessionId: input.sessionId,
          role: "user",
          content: input.message,
          timestamp: Date.now(),
        };

        await addMessages(kv, input.sessionId, [userMsg]);

        let cleanMessage = "";
        let lastAgent = existing.lastAgent || "coordinator";
        try {
          const history = await getMessages(kv, input.sessionId, 16);
          for await (const event of runAgentStream(
            context,
            history.map(({ content, role }) => ({ content, role }))
          )) {
            if (event.event === "message.start" && typeof event.data.agent === "string") {
              lastAgent = event.data.agent;
            }
            if (event.event === "message.token") {
              cleanMessage += (event.data.token as string) ?? "";
            }
            yield event;
          }
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Unknown server error";
          yield { event: "message.error", data: { error: msg } };
        }

        if (cleanMessage.trim()) {
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            sessionId: input.sessionId,
            role: "assistant",
            content: cleanMessage,
            agent: lastAgent,
            timestamp: Date.now(),
          };

          await addMessages(kv, input.sessionId, [assistantMsg]);
        }
      }),

    history: protectedProcedure
      .input(
        z.object({
          sessionId,
          limit: z.number().min(1).max(100).default(50),
          before: z.number().optional(),
        })
      )
      .handler(async ({ context, input }) => {
        const uid = context.auth?.userId;
        if (!uid) {
          throw new ORPCError("UNAUTHORIZED");
        }
        const session = await getSession(
          context.chatMessagesKv,
          input.sessionId
        );
        if (!session) {
          throw new ORPCError("NOT_FOUND", { message: "Session not found" });
        }
        if (session.userId !== uid) {
          throw new ORPCError("FORBIDDEN");
        }
        return getMessages(
          context.chatMessagesKv,
          input.sessionId,
          input.limit,
          input.before
        );
      }),

    sessions: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.number().optional(),
        })
      )
      .handler(async ({ context, input }) => {
        const uid = context.auth?.userId;
        if (!uid) {
          throw new ORPCError("UNAUTHORIZED");
        }
        return listSessions(
          context.chatMessagesKv,
          input.limit,
          input.cursor,
          uid
        );
      }),

    create: protectedProcedure
      .input(z.object({ title: z.string().max(200).default("New Chat") }))
      .handler(async ({ context, input }) => {
        const uid = context.auth?.userId;
        if (!uid) {
          throw new ORPCError("UNAUTHORIZED");
        }
        const session = {
          id: crypto.randomUUID(),
          title: input.title,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 0,
          lastAgent: "coordinator",
          userId: uid,
        };
        await createSession(context.chatMessagesKv, session);
        return session;
      }),

    delete: protectedProcedure
      .input(z.object({ sessionId }))
      .handler(async ({ context, input }) => {
        const uid = context.auth?.userId;
        if (!uid) {
          throw new ORPCError("UNAUTHORIZED");
        }
        const session = await getSession(
          context.chatMessagesKv,
          input.sessionId
        );
        if (!session) {
          throw new ORPCError("NOT_FOUND", { message: "Session not found" });
        }
        if (session.userId !== uid) {
          throw new ORPCError("FORBIDDEN");
        }
        await deleteSession(context.chatMessagesKv, input.sessionId);
        return { ok: true };
      }),

    fork: protectedProcedure
      .input(z.object({ sessionId, messageId: z.string() }))
      .handler(async ({ context, input }) => {
        const uid = context.auth?.userId;
        if (!uid) {
          throw new ORPCError("UNAUTHORIZED");
        }
        const session = await getSession(
          context.chatMessagesKv,
          input.sessionId
        );
        if (!session) {
          throw new ORPCError("NOT_FOUND", { message: "Session not found" });
        }
        if (session.userId !== uid) {
          throw new ORPCError("FORBIDDEN");
        }
        const forked = await forkStorage(
          context.chatMessagesKv,
          input.sessionId,
          input.messageId,
          crypto.randomUUID()
        );
        if (!forked) {
          throw new ORPCError("NOT_FOUND", { message: "Message not found" });
        }
        return forked;
      }),
  },

  agents: {
    list: protectedProcedure.handler(async () =>
      agentInfo.map(({ id, name, description, tools }) => ({
        id,
        name,
        description,
        tools,
      }))
    ),
  },

  tools: {
    list: protectedProcedure.handler(async () =>
      agentInfo.flatMap((a) => a.tools.map((t) => ({ agent: a.id, name: t })))
    ),
  },
};
