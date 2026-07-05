import { createDb, doctorSessions } from "@suwa/db";
import { env } from "@suwa/env/server";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { Webhooks } from "@polar-sh/hono";

export const polarApp = new Hono();

polarApp.post(
  "/",
  Webhooks({
    webhookSecret: env.POLAR_WEBHOOK_SECRET,
    onOrderPaid: async (payload) => {
      const data = (payload as any).data ?? payload;
      const metadata = data.metadata ?? {};
      const sessionId = metadata.sessionId as string | undefined;

      if (!sessionId) {
        return;
      }

      const db = createDb();
      await db
        .update(doctorSessions)
        .set({
          polarOrderId: data.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(doctorSessions.id, sessionId));
    },
    onOrderRefunded: async (payload) => {
      const data = (payload as any).data ?? payload;
      const metadata = data.metadata ?? {};
      const sessionId = metadata.sessionId as string | undefined;

      if (!sessionId) {
        return;
      }

      const db = createDb();
      await db
        .update(doctorSessions)
        .set({
          status: "timing_balance_failure",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(doctorSessions.id, sessionId));
    },
    onPayload: async (payload) => {
      console.log("[polar:webhook]", (payload as any).type ?? "unknown");
    },
  })
);
