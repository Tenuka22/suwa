import { ORPCError } from "@orpc/server";
import { doctorScheduleEntries } from "@zen-doc/db";
import { createScheduleEntrySchema } from "@zen-doc/db/schemas-types";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { handleBlockDaySlot, handleOpenDaySlot } from "../schedule-utils";

export const createScheduleEntryRoute = protectedProcedure
  .input(createScheduleEntrySchema)
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = requireAuth(context);

    const inputStart = new Date(input.startAt);
    const inputEnd = new Date(input.endAt);

    const now = new Date();
    if (inputStart < now) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Cannot modify schedules in the past",
      });
    }

    const daysMidnightUTC: Date[] = [];
    const currentMidnight = new Date(inputStart);
    currentMidnight.setUTCHours(0, 0, 0, 0);

    const endMidnight = new Date(inputEnd);
    endMidnight.setUTCHours(0, 0, 0, 0);

    while (currentMidnight.getTime() <= endMidnight.getTime()) {
      daysMidnightUTC.push(new Date(currentMidnight));
      currentMidnight.setUTCDate(currentMidnight.getUTCDate() + 1);
    }

    const searchStart = new Date(input.startAt);
    searchStart.setUTCHours(0, 0, 0, 0);
    const searchEnd = new Date(input.endAt);
    searchEnd.setUTCHours(23, 59, 59, 999);

    const existingEntries = await context.db
      .select()
      .from(doctorScheduleEntries)
      .where(
        and(
          eq(doctorScheduleEntries.doctorId, doctorId),
          gte(doctorScheduleEntries.endAt, searchStart.toISOString()),
          lte(doctorScheduleEntries.startAt, searchEnd.toISOString())
        )
      );

    const timestamp = new Date().toISOString();
    const insertValues: (typeof doctorScheduleEntries.$inferInsert)[] = [];
    const deleteIds: string[] = [];

    for (const dayMidnight of daysMidnightUTC) {
      const slotStart = new Date(dayMidnight);
      slotStart.setUTCHours(
        inputStart.getUTCHours(),
        inputStart.getUTCMinutes(),
        inputStart.getUTCSeconds(),
        inputStart.getUTCMilliseconds()
      );

      const slotEnd = new Date(dayMidnight);
      slotEnd.setUTCHours(
        inputEnd.getUTCHours(),
        inputEnd.getUTCMinutes(),
        inputEnd.getUTCSeconds(),
        inputEnd.getUTCMilliseconds()
      );

      const dayStartBoundary = new Date(dayMidnight);
      dayStartBoundary.setUTCHours(0, 0, 0, 0);
      const dayEndBoundary = new Date(dayMidnight);
      dayEndBoundary.setUTCHours(23, 59, 59, 999);

      const dayEntries = existingEntries.filter((entry) => {
        const entryStart = new Date(entry.startAt);
        const entryEnd = new Date(entry.endAt);
        return (
          (entryStart >= dayStartBoundary && entryStart <= dayEndBoundary) ||
          (entryEnd >= dayStartBoundary && entryEnd <= dayEndBoundary) ||
          (entryStart <= dayStartBoundary && entryEnd >= dayEndBoundary)
        );
      });

      if (input.kind === "open") {
        insertValues.push(
          ...handleOpenDaySlot({
            slotStart,
            slotEnd,
            dayEntries,
            doctorId,
            noteKind: input.noteKind,
            timestamp,
          })
        );
      } else if (input.kind === "block") {
        const { deleteIds: blockDeleteIds, insertValues: blockInsertValues } =
          handleBlockDaySlot({
            slotStart,
            slotEnd,
            dayEntries,
            doctorId,
            noteKind: null,
            timestamp,
          });
        deleteIds.push(...blockDeleteIds);
        insertValues.push(...blockInsertValues);
      }
    }

    if (deleteIds.length > 0) {
      await context.db
        .delete(doctorScheduleEntries)
        .where(
          and(
            eq(doctorScheduleEntries.doctorId, doctorId),
            inArray(doctorScheduleEntries.id, deleteIds)
          )
        );
    }

    if (insertValues.length > 0) {
      await context.db.insert(doctorScheduleEntries).values(insertValues);
    }

    return { ok: true, id: crypto.randomUUID() };
  });
