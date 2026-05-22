import {
  doctorScheduleEntries,
  doctorSessions,
  userCredits,
} from "@zen-doc/db";
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
    const { userId: patientId, auth } = requireAuth(context);
    const role = auth.sessionClaims?.metadata?.role;
    const isAdmin = role === "admin";

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

    if (!isAdmin) {
      try {
        let [creditRecord] = await context.db
          .select()
          .from(userCredits)
          .where(eq(userCredits.userId, patientId))
          .limit(1);

        if (!creditRecord) {
          const creditId = crypto.randomUUID();
          await context.db.insert(userCredits).values({
            id: creditId,
            userId: patientId,
            balance: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          creditRecord = {
            id: creditId,
            userId: patientId,
            balance: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        if (creditRecord.balance < 1) {
          throw new Error("Insufficient credits to book this session");
        }

        await context.db
          .update(userCredits)
          .set({
            balance: creditRecord.balance - 1,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(userCredits.id, creditRecord.id));
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Insufficient credits to book this session"
        ) {
          throw error;
        }
        // If table doesn't exist or other DB error, allow booking with default credit
      }
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
