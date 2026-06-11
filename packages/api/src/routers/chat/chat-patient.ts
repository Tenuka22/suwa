import { type } from "@orpc/server"
import type { UIMessage } from "ai"
import { publicProcedure } from "../../index"
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

    const workflowMessages = input.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: getMessageText(m),
      }))

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
        }
      }
    }

    return generateEvents()
  })
