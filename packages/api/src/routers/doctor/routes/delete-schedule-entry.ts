import { doctorScheduleEntries } from "@zen-doc/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const deleteScheduleEntryRoute = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = requireAuth(context);

    const [entry] = await context.db
      .select()
      .from(doctorScheduleEntries)
      .where(
        and(
          eq(doctorScheduleEntries.id, input.id),
          eq(doctorScheduleEntries.doctorId, doctorId)
        )
      )
      .limit(1);

    if (!entry) {
      throw new Error("Schedule entry not found");
    }

    if (entry.kind === "session") {
      throw new Error("Sessions cannot be edited by doctors");
    }

    await context.db
      .delete(doctorScheduleEntries)
      .where(eq(doctorScheduleEntries.id, input.id));

    return { ok: true };
  });
