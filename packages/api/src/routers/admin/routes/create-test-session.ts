import { randomUUID } from "node:crypto";
import { doctorSessions } from "@suwa/db";
import { z } from "zod";
import { requireAdmin } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const adminCreateTestSessionRoute = protectedProcedure
  .input(z.object({}).optional())
  .handler(async ({ context }) => {
    const { userId } = requireAdmin(context);

    const now = new Date();
    const startAt = new Date(now.getTime() - 30 * 60 * 1000);
    const endAt = new Date(now.getTime() + 60 * 60 * 1000);
    const sessionId = randomUUID();

    await context.db.insert(doctorSessions).values({
      id: sessionId,
      doctorId: userId,
      patientId: userId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      creditCost: 0,
      status: "approved",
    });

    return {
      sessionId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    };
  });
