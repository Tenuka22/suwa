import { CloudflareWorkersAIEmbeddings } from "@langchain/cloudflare"
import { type } from "@orpc/server"
import type { UIMessage } from "ai"
import { env } from "@zen-doc/env/server"
import { publicProcedure } from "../../index"
import { cosineSimilarity } from "../../services/doctor-index"
import { streamChatWorkflow } from "../../services/chat-workflow"

const SEVEN_DAYS_SECONDS = 604800

interface StoredDoctor {
  id: string
  name: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  doctors?: StoredDoctor[]
}

interface HistoryEmbedding {
  embedding: number[]
  userMsg: string
  asstMsg: string
}

export const chatPatient = publicProcedure
  .input(type<{ chatId: string; messages: UIMessage[] }>())
  .handler(async ({ context, input }) => {
    function getMessageText(msg: UIMessage): string {
      return msg.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("")
    }

    const lastUserMessage = [...input.messages]
      .reverse()
      .find((m) => m.role === "user")

    const lastUserText = lastUserMessage ? getMessageText(lastUserMessage) : ""

    let historyMessages: ChatMessage[] = []
    let isRegisteredUser = false

    if (context.auth?.userId) {
      isRegisteredUser = true
      try {
        const stored = await context.doctorChatKv.get(
          `chat:${context.auth.userId}`,
          "text"
        )
        if (stored) {
          historyMessages = JSON.parse(stored) as ChatMessage[]
        }
      } catch {
        // Ignore parse errors
      }
    }

    let relevantHistory: Array<{ role: "user" | "assistant"; content: string }> = []
    const currentUserId = context.auth?.userId

    if (currentUserId && lastUserText && historyMessages.length > 0) {
      try {
        const storedEmbeds = await context.doctorChatKv.get(
          `chat-hx-embed:${currentUserId}`,
          "text"
        )
        if (storedEmbeds) {
          const historyEmbeds: HistoryEmbedding[] = JSON.parse(storedEmbeds)
          if (historyEmbeds.length > 0) {
            const embeddings = new CloudflareWorkersAIEmbeddings({
              binding: env.AI,
              model: "@cf/baai/bge-small-en-v1.5",
            })
            const [queryVec] = await embeddings.embedDocuments([lastUserText])

            const scored = historyEmbeds
              .map((entry) => ({
                ...entry,
                score: cosineSimilarity(queryVec ?? [], entry.embedding),
              }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 3)

            relevantHistory = scored.flatMap((entry) => [
              { role: "user" as const, content: entry.userMsg },
              { role: "assistant" as const, content: entry.asstMsg },
            ])
          }
        }
      } catch {
        // Ignore errors in semantic history retrieval
      }
    }

    const workflowMessages = [
      ...relevantHistory,
      ...input.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role,
          content: getMessageText(m),
        })),
    ]

    const generator = streamChatWorkflow(workflowMessages)
    let fullText = ""
    let pendingDoctors: Array<{ id: string; name: string }> = []

    async function* generateEvents() {
      try {
        for await (const event of generator) {
          if (event.type === "text-delta") {
            fullText += event.text
          }
          if (event.type === "doctor-suggestions") {
            pendingDoctors = event.doctors
          }
          yield event
        }
      } finally {
        if (isRegisteredUser && context.auth?.userId && lastUserText && fullText) {
          const assistantMsg: ChatMessage = { role: "assistant", content: fullText }
          if (pendingDoctors.length > 0) {
            assistantMsg.doctors = pendingDoctors
          }
          const newMessages: ChatMessage[] = [
            ...historyMessages,
            { role: "user", content: lastUserText },
            assistantMsg,
          ]
          const trimmed = newMessages.slice(-50)
          await context.doctorChatKv.put(
            `chat:${context.auth.userId}`,
            JSON.stringify(trimmed),
            { expirationTtl: SEVEN_DAYS_SECONDS }
          )

          try {
            const embeddings = new CloudflareWorkersAIEmbeddings({
              binding: env.AI,
              model: "@cf/baai/bge-small-en-v1.5",
            })
            const [embedding] = await embeddings.embedDocuments([lastUserText])

            const storedEmbeds = await context.doctorChatKv.get(
              `chat-hx-embed:${context.auth.userId}`,
              "text"
            )
            const existingEmbeds: HistoryEmbedding[] = storedEmbeds
              ? JSON.parse(storedEmbeds)
              : []
            existingEmbeds.push({
              embedding: embedding ?? [],
              userMsg: lastUserText,
              asstMsg: fullText,
            })
            const trimmedEmbeds = existingEmbeds.slice(-50)
            await context.doctorChatKv.put(
              `chat-hx-embed:${context.auth.userId}`,
              JSON.stringify(trimmedEmbeds),
              { expirationTtl: SEVEN_DAYS_SECONDS }
            )
          } catch {
            // Ignore errors in embedding storage
          }
        }
      }
    }

    return generateEvents()
  })
