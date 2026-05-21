import { doctorScheduleEntries, doctorSessions } from "@zen-doc/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const bookSessionRoute = protectedProcedure
  .input(
    z.object({
      doctorId: z.string().min(1),
      scheduleEntryId: z.string().uuid(),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId: patientId } = requireAuth(context);

    const [entry] = await context.db
      .select()
      .from(doctorScheduleEntries)
      .where(
        and(
          eq(doctorScheduleEntries.id, input.scheduleEntryId),
          eq(doctorScheduleEntries.doctorId, input.doctorId),
          eq(doctorScheduleEntries.kind, "open")
        )
      )
      .limit(1);

    if (!entry) {
      throw new Error(
        "The selected schedule slot is not available or does not exist"
      );
    }

    const sessionId = crypto.randomUUID();

    await context.db.insert(doctorSessions).values({
      id: sessionId,
      doctorId: input.doctorId,
      patientId,
      startAt: entry.startAt,
      endAt: entry.endAt,
      status: "scheduled",
      payoutStatus: "none",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await context.db
      .update(doctorScheduleEntries)
      .set({
        kind: "session",
        sessionId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(doctorScheduleEntries.id, input.scheduleEntryId));

    return { ok: true, sessionId };
  });
