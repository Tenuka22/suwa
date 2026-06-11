import { protectedProcedure } from '../../../index'

export const getChatHistoryRoute = protectedProcedure.handler(
  async ({ context }) => {
    if (!context.auth?.userId) {
      return { messages: [] }
    }

    try {
      const stored = await context.doctorChatKv.get(
        `chat:${context.auth.userId}`,
        'text'
      )
      if (!stored) {
        return { messages: [] }
      }

      return { messages: JSON.parse(stored) as Array<{ role: string; content: string; doctors?: Array<{ id: string; name: string }> }> }
    } catch {
      return { messages: [] }
    }
  }
)