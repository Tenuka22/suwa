import { protectedProcedure } from '../../../index'

export const clearChatHistoryRoute = protectedProcedure.handler(
  async ({ context }) => {
    if (!context.auth?.userId) {
      return { ok: false }
    }

    await context.doctorChatKv.delete(`chat:${context.auth.userId}`)

    return { ok: true }
  }
)