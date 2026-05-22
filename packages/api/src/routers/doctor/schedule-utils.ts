import type { DoctorScheduleEntry } from "@zen-doc/db";
import { doctorScheduleEntries, doctorSessions } from "@zen-doc/db";
import { and, eq, gte, lte } from "drizzle-orm";
import type { Context } from "../../context";

export interface TimeInterval {
  end: Date;
  start: Date;
}

export function subtractInterval(
  a: TimeInterval,
  b: TimeInterval
): TimeInterval[] {
  if (b.start >= a.end || b.end <= a.start) {
    return [a];
  }
  const result: TimeInterval[] = [];
  if (a.start < b.start) {
    result.push({ start: a.start, end: b.start });
  }
  if (a.end > b.end) {
    result.push({ start: b.end, end: a.end });
  }
  return result;
}

export function subtractIntervals(
  as: TimeInterval[],
  bs: TimeInterval[]
): TimeInterval[] {
  let result = [...as];
  for (const b of bs) {
    const nextResult: TimeInterval[] = [];
    for (const a of result) {
      nextResult.push(...subtractInterval(a, b));
    }
    result = nextResult;
  }
  return result;
}

export interface DaySlotInput {
  dayEntries: DoctorScheduleEntry[];
  doctorId: string;
  noteKind?: "home" | "work" | "pharmacy" | "after_gym" | "other" | null;
  slotEnd: Date;
  slotStart: Date;
  timestamp: string;
}

export interface BlockDaySlotResult {
  deleteIds: string[];
  insertValues: (typeof doctorScheduleEntries.$inferInsert)[];
}

export function handleOpenDaySlot(
  input: DaySlotInput
): (typeof doctorScheduleEntries.$inferInsert)[] {
  const blockAndSessionIntervals = input.dayEntries
    .filter((e) => e.kind === "block" || e.kind === "session")
    .map((e) => ({ start: new Date(e.startAt), end: new Date(e.endAt) }));

  const existingOpenIntervals = input.dayEntries
    .filter((e) => e.kind === "open")
    .map((e) => ({ start: new Date(e.startAt), end: new Date(e.endAt) }));

  let activeIntervals = [{ start: input.slotStart, end: input.slotEnd }];

  activeIntervals = subtractIntervals(
    activeIntervals,
    blockAndSessionIntervals
  );
  activeIntervals = subtractIntervals(activeIntervals, existingOpenIntervals);

  const insertValues: (typeof doctorScheduleEntries.$inferInsert)[] = [];
  for (const interval of activeIntervals) {
    if (interval.end.getTime() - interval.start.getTime() < 60_000) {
      continue;
    }
    insertValues.push({
      id: crypto.randomUUID(),
      doctorId: input.doctorId,
      kind: "open",
      noteKind: input.noteKind ?? null,
      startAt: interval.start.toISOString(),
      endAt: interval.end.toISOString(),
      createdAt: input.timestamp,
      updatedAt: input.timestamp,
    });
  }
  return insertValues;
}

export function handleBlockDaySlot(input: DaySlotInput): BlockDaySlotResult {
  const targetBlock = { start: input.slotStart, end: input.slotEnd };
  const deleteIds: string[] = [];
  const insertValues: (typeof doctorScheduleEntries.$inferInsert)[] = [];

  const existingOpenEntries = input.dayEntries.filter((e) => e.kind === "open");

  for (const openEntry of existingOpenEntries) {
    const openStart = new Date(openEntry.startAt);
    const openEnd = new Date(openEntry.endAt);

    if (
      openStart.getTime() < targetBlock.end.getTime() &&
      openEnd.getTime() > targetBlock.start.getTime()
    ) {
      deleteIds.push(openEntry.id);

      const remainingOpenIntervals = subtractInterval(
        { start: openStart, end: openEnd },
        targetBlock
      );

      for (const interval of remainingOpenIntervals) {
        if (interval.end.getTime() - interval.start.getTime() < 60_000) {
          continue;
        }
        insertValues.push({
          id: crypto.randomUUID(),
          doctorId: input.doctorId,
          kind: "open",
          noteKind: openEntry.noteKind,
          startAt: interval.start.toISOString(),
          endAt: interval.end.toISOString(),
          createdAt: input.timestamp,
          updatedAt: input.timestamp,
        });
      }
    }
  }

  const existingBlockAndSessionIntervals = input.dayEntries
    .filter((e) => e.kind === "block" || e.kind === "session")
    .map((e) => ({ start: new Date(e.startAt), end: new Date(e.endAt) }));

  let activeBlockIntervals = [targetBlock];
  activeBlockIntervals = subtractIntervals(
    activeBlockIntervals,
    existingBlockAndSessionIntervals
  );

  for (const interval of activeBlockIntervals) {
    if (interval.end.getTime() - interval.start.getTime() < 60_000) {
      continue;
    }
    insertValues.push({
      id: crypto.randomUUID(),
      doctorId: input.doctorId,
      kind: "block",
      noteKind: null,
      startAt: interval.start.toISOString(),
      endAt: interval.end.toISOString(),
      createdAt: input.timestamp,
      updatedAt: input.timestamp,
    });
  }

  return { deleteIds, insertValues };
}

export async function getScheduleEntriesForDoctor(
  db: Context["db"],
  doctorId: string,
  from: string,
  to: string
) {
  const rows = await db
    .select()
    .from(doctorScheduleEntries)
    .where(
      and(
        eq(doctorScheduleEntries.doctorId, doctorId),
        gte(doctorScheduleEntries.startAt, from),
        lte(doctorScheduleEntries.endAt, to)
      )
    );

  const sessions = await db
    .select()
    .from(doctorSessions)
    .where(eq(doctorSessions.doctorId, doctorId));

  const sessionById = new Map(
    sessions.map((session: typeof doctorSessions.$inferSelect) => [
      session.id,
      session,
    ])
  );

  return rows.map((entry: typeof doctorScheduleEntries.$inferSelect) => ({
    ...entry,
    session: entry.sessionId
      ? (sessionById.get(entry.sessionId) ?? null)
      : null,
  }));
}

export async function getOpenScheduleSlotsForDoctor(
  db: Context["db"],
  doctorId: string,
  from: string,
  to: string
) {
  const openSlots = await db
    .select()
    .from(doctorScheduleEntries)
    .where(
      and(
        eq(doctorScheduleEntries.doctorId, doctorId),
        eq(doctorScheduleEntries.kind, "open"),
        gte(doctorScheduleEntries.startAt, from),
        lte(doctorScheduleEntries.endAt, to)
      )
    )
    .orderBy(doctorScheduleEntries.startAt);

  return openSlots;
}
