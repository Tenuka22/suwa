import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const HARMFUL_PATTERNS = [
  /\b(\d{3}[-\s]?\d{3}[-\s]?\d{4})\b/,
  /\b[\w.-]+@[\w.-]+\.\w{2,}\b/,
  /\bhttps?:\/\/[^\s]+\b/,
];

async function moderateWithAi(
  ai: import("../../../context").RequestContext["ai"],
  content: string
): Promise<string | null> {
  try {
    const result = await ai.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages: [
        {
          role: "system",
          content:
            "You are a content moderator. Determine if the message contains: hate speech, harassment, violence, explicit sexual content, spam, promotions, or personal information (phone, email, address, password). Reply with ONLY 'SAFE' or 'UNSAFE: <brief reason>'.",
        },
        { role: "user", content },
      ],
    }) as { response: string };

    const text = result.response.trim();
    if (text.startsWith("UNSAFE")) {
      return text.replace("UNSAFE:", "").trim() || "Harmful content detected";
    }
    return null;
  } catch {
    return null;
  }
}

export const sendMessageRoute = protectedProcedure
  .input(
    z.object({
      content: z.string().min(1).max(2000),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const { content } = input;

    const trimmed = content.trim();
    if (!trimmed) {
      throw new ORPCError("BAD_REQUEST", { message: "Message cannot be empty" });
    }

    const hasPii = HARMFUL_PATTERNS.some((p) => p.test(trimmed));
    if (hasPii) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Message contains personal information or links",
      });
    }

    const moderationReason = await moderateWithAi(context.ai, trimmed);
    if (moderationReason) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Message rejected: ${moderationReason}`,
      });
    }

    const message = {
      id: crypto.randomUUID(),
      content: trimmed,
      authorId: userId,
      authorName: context.auth.user?.name ?? "Anonymous",
      timestamp: Date.now(),
    };

    const key = "global-chat:messages";
    await context.redis.rpush(key, JSON.stringify(message));
    const total = await context.redis.llen(key);
    if (total > 500) {
      await context.redis.ltrim(key, total - 500, -1);
    }

    return { message };
  });
