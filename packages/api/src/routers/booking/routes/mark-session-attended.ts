import { doctorSessions } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const markSessionAttendedRoute = protectedProcedure
  .input(z.object({ sessionId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const { userId, auth } = requireAuth(context);
    const role = auth.sessionClaims?.metadata?.role;

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    const isDoctor = session.doctorId === userId;
    const isAdmin = role === "admin";
    if (!(isDoctor || isAdmin)) {
      throw new Error("Not authorized to mark this session attended");
    }

    if (session.status === "attended") {
      return { ok: true, message: "Session already attended" };
    }

    if (session.status !== "approved") {
      throw new Error("Can only mark approved sessions as attended");
    }

    const now = new Date().toISOString();

    await context.db
      .update(doctorSessions)
      .set({ status: "attended", updatedAt: now })
      .where(eq(doctorSessions.id, input.sessionId));

    return { ok: true };
  });
