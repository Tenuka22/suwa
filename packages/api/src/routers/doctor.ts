import type {
  DoctorProfile,
  DoctorScheduleEntry,
  DoctorSession,
} from "@zen-doc/db";
import {
  doctorConsultationModeValues,
  doctorFocusAreaValues,
  doctorLanguageValues,
  doctorSpecialtyValues,
  parseJsonApproachSteps,
  stringifyJsonApproachSteps,
  parseJsonStringArray,
  stringifyJsonStringArray,
} from "@zen-doc/db";
import {
  doctorEducationEntries,
  doctorProfiles,
  doctorScheduleEntries,
  doctorSessions,
} from "@zen-doc/db";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

const scheduleKindSchema = z.enum(["open", "block", "session"]);
const scheduleNoteSchema = z.enum([
  "home",
  "work",
  "pharmacy",
  "after_gym",
  "other",
]);

const scheduleRangeSchema = z.object({
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
});

const doctorSpecialtySchema = z.enum(doctorSpecialtyValues);
const doctorLanguageSchema = z.enum(doctorLanguageValues);
const doctorConsultationModeSchema = z.enum(doctorConsultationModeValues);
const doctorApproachStepSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1).max(240),
});
const doctorEducationEntrySchema = z.object({
  id: z.string().min(1),
  institution: z.string().trim().min(1).max(120),
  degree: z.string().trim().min(1).max(120),
  year: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
});

const createScheduleEntrySchema = z
  .object({
    kind: scheduleKindSchema,
    noteKind: scheduleNoteSchema.optional(),
    sessionId: z.string().uuid().nullable().optional(),
  })
  .and(scheduleRangeSchema)
  .superRefine((value, ctx) => {
    if (new Date(value.startAt) >= new Date(value.endAt)) {
      ctx.addIssue({
        code: "custom",
        message: "End time must be after start time",
        path: ["endAt"],
      });
    }

    if (value.kind !== "open" && value.noteKind) {
      ctx.addIssue({
        code: "custom",
        message: "Only open entries can have notes",
        path: ["noteKind"],
      });
    }
  });

const listScheduleEntriesSchema = z.object({
  from: z.iso.datetime(),
  to: z.iso.datetime(),
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce.number().int().positive().max(500).catch(100),
});

type ScheduleEntryRow = DoctorScheduleEntry & {
  session: DoctorSession | null;
};

interface TimeInterval {
  end: Date;
  start: Date;
}

function subtractInterval(a: TimeInterval, b: TimeInterval): TimeInterval[] {
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

function subtractIntervals(
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

interface DaySlotInput {
  dayEntries: DoctorScheduleEntry[];
  doctorId: string;
  noteKind?: "home" | "work" | "pharmacy" | "after_gym" | "other" | null;
  slotEnd: Date;
  slotStart: Date;
  timestamp: string;
}

interface BlockDaySlotResult {
  deleteIds: string[];
  insertValues: (typeof doctorScheduleEntries.$inferInsert)[];
}

function handleOpenDaySlot(
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

function handleBlockDaySlot(input: DaySlotInput): BlockDaySlotResult {
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

export const doctorRouter = {
  doctorProfile: protectedProcedure.handler(async ({ context }) => {
    const userId = context.auth?.userId;
    if (!userId) {
      return { profile: null, role: null };
    }

    const [profile] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, userId))
      .limit(1);
    const role = context.auth?.sessionClaims?.metadata?.role ?? "user";

    return {
      profile: profile
        ? {
            ...profile,
            specialties: parseJsonStringArray(profile.specialties),
            languages: parseJsonStringArray(profile.languages),
            consultationModes: parseJsonStringArray(profile.consultationModes),
            focusAreas: parseJsonStringArray(profile.focusAreas),
            approachSteps: parseJsonApproachSteps(profile.approachSteps),
          }
        : null,
      role,
    };
  }),
  saveDoctorProfile: protectedProcedure
      .input(
        z.object({
        displayName: z.preprocess(
          (value) =>
            typeof value === "string" && value.trim() === ""
              ? undefined
              : value,
          z.string().trim().min(2).max(100).optional()
        ),
        headline: z.preprocess(
          (value) =>
            typeof value === "string" && value.trim() === ""
              ? undefined
              : value,
          z.string().trim().min(2).max(140).optional()
        ),
        bio: z.string().optional(),
        licenseNumber: z.string().optional(),
        location: z.preprocess(
          (value) =>
            typeof value === "string" && value.trim() === ""
              ? undefined
              : value,
          z.string().trim().max(120).optional()
        ),
        experienceStartYear: z.coerce.number().int().min(1900).max(2100).optional(),
        specialties: z.array(doctorSpecialtySchema).max(5).optional(),
        languages: z.array(doctorLanguageSchema).max(8).optional(),
        consultationModes: z.array(doctorConsultationModeSchema).max(3).optional(),
        focusAreas: z.array(z.enum(doctorFocusAreaValues)).max(10).optional(),
        approach: z.preprocess((value) => typeof value === "string" && value.trim() === "" ? undefined : value, z.string().trim().max(500).optional()),
        education: z.preprocess((value) => typeof value === "string" && value.trim() === "" ? undefined : value, z.string().trim().max(500).optional()),
        placeName: z.preprocess((value) => typeof value === "string" && value.trim() === "" ? undefined : value, z.string().trim().max(120).optional()),
        placeAddress: z.preprocess((value) => typeof value === "string" && value.trim() === "" ? undefined : value, z.string().trim().max(240).optional()),
        placeDescription: z.preprocess((value) => typeof value === "string" && value.trim() === "" ? undefined : value, z.string().trim().max(500).optional()),
        approachSteps: z.array(doctorApproachStepSchema).max(12).optional(),
        educationEntries: z.array(doctorEducationEntrySchema).max(12).optional(),
      })
    )
    .handler(async ({ context, input }) => {
      const userId = context.auth?.userId;
      if (!userId) {
        throw new Error("Missing user");
      }

      const currentRole = context.auth?.sessionClaims?.metadata?.role;
      const nextRole =
        currentRole === "admin" || currentRole === "doctor"
          ? currentRole
          : "pending-doctor";
      const timestamp = new Date().toISOString();
      const [existingProfile] = await context.db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.userId, userId))
        .limit(1);

      const profile: DoctorProfile = {
        userId,
        displayName: input.displayName ?? existingProfile?.displayName ?? null,
        headline: input.headline ?? existingProfile?.headline ?? null,
        bio: input.bio ?? null,
        licenseNumber: input.licenseNumber ?? null,
        location: input.location ?? existingProfile?.location ?? null,
        placeName: input.placeName ?? existingProfile?.placeName ?? null,
        placeAddress: input.placeAddress ?? existingProfile?.placeAddress ?? null,
        placeDescription: input.placeDescription ?? existingProfile?.placeDescription ?? null,
        experienceStartYear:
          input.experienceStartYear ?? existingProfile?.experienceStartYear ?? null,
        specialties: stringifyJsonStringArray(
          input.specialties ?? parseJsonStringArray(existingProfile?.specialties)
        ),
        languages: stringifyJsonStringArray(
          input.languages ?? parseJsonStringArray(existingProfile?.languages)
        ),
        consultationModes: stringifyJsonStringArray(
          input.consultationModes ??
            parseJsonStringArray(existingProfile?.consultationModes)
        ),
        focusAreas: stringifyJsonStringArray(
          input.focusAreas ?? parseJsonStringArray(existingProfile?.focusAreas)
        ),
        approachSteps: stringifyJsonApproachSteps(
          input.approachSteps ?? parseJsonApproachSteps(existingProfile?.approachSteps)
        ),
        approach: input.approach ?? existingProfile?.approach ?? null,
        education: input.education ?? existingProfile?.education ?? null,
        permanent: existingProfile?.permanent ?? false,
        stripeAccountId: existingProfile?.stripeAccountId ?? null,
        stripeAccountEnabled: existingProfile?.stripeAccountEnabled ?? false,
        createdAt: existingProfile?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };

      await context.db
        .insert(doctorProfiles)
        .values(profile)
        .onConflictDoUpdate({
          target: doctorProfiles.userId,
          set: profile,
        });

      if (input.educationEntries) {
        await context.db.delete(doctorEducationEntries).where(eq(doctorEducationEntries.doctorId, userId));
        if (input.educationEntries.length > 0) {
          await context.db.insert(doctorEducationEntries).values(
            input.educationEntries.map((entry) => ({
              id: entry.id,
              doctorId: userId,
              institution: entry.institution,
              degree: entry.degree,
              year: entry.year ?? null,
              createdAt: timestamp,
              updatedAt: timestamp,
            }))
          );
        }
      }

      await context.clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          role: nextRole,
        },
      });

      return { ok: true, role: nextRole, profile };
    }),
  listScheduleEntries: protectedProcedure
    .input(listScheduleEntriesSchema)
    .handler(async ({ context, input }) => {
      const doctorId = context.auth?.userId;
      if (!doctorId) {
        throw new Error("Missing user");
      }

      const rows = await context.db
        .select()
        .from(doctorScheduleEntries)
        .where(
          and(
            eq(doctorScheduleEntries.doctorId, doctorId),
            gte(doctorScheduleEntries.startAt, input.from),
            lte(doctorScheduleEntries.endAt, input.to)
          )
        )
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize);

      const sessions = await context.db
        .select()
        .from(doctorSessions)
        .where(eq(doctorSessions.doctorId, doctorId));

      const sessionById = new Map(
        sessions.map((session) => [session.id, session])
      );

      return {
        items: rows.map((entry) => ({
          ...entry,
          session: entry.sessionId
            ? (sessionById.get(entry.sessionId) ?? null)
            : null,
        })) as ScheduleEntryRow[],
      };
    }),
  createScheduleEntry: protectedProcedure
    .input(createScheduleEntrySchema)
    .handler(async ({ context, input }) => {
      const doctorId = context.auth?.userId;
      if (!doctorId) {
        throw new Error("Missing user");
      }

      const inputStart = new Date(input.startAt);
      const inputEnd = new Date(input.endAt);

      // Prevent past schedule modifications
      const now = new Date();
      if (inputStart < now) {
        throw new Error("Cannot modify schedules in the past");
      }

      // Generate all days between inputStart and inputEnd (day-by-day deconstruction)
      const daysMidnightUTC: Date[] = [];
      const currentMidnight = new Date(inputStart);
      currentMidnight.setUTCHours(0, 0, 0, 0);

      const endMidnight = new Date(inputEnd);
      endMidnight.setUTCHours(0, 0, 0, 0);

      while (currentMidnight.getTime() <= endMidnight.getTime()) {
        daysMidnightUTC.push(new Date(currentMidnight));
        currentMidnight.setUTCDate(currentMidnight.getUTCDate() + 1);
      }

      // Fetch all entries for this doctor that could potentially overlap with the expanded date range
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

        // Filter entries for this specific day
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

        const slotInput: DaySlotInput = {
          slotStart,
          slotEnd,
          dayEntries,
          doctorId,
          noteKind: input.noteKind,
          timestamp,
        };

        if (input.kind === "open") {
          insertValues.push(...handleOpenDaySlot(slotInput));
        } else if (input.kind === "block") {
          const { deleteIds: blockDeleteIds, insertValues: blockInsertValues } =
            handleBlockDaySlot(slotInput);
          deleteIds.push(...blockDeleteIds);
          insertValues.push(...blockInsertValues);
        }
      }

      // Execute deletions
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

      // Execute insertions in a single batch query!
      if (insertValues.length > 0) {
        await context.db.insert(doctorScheduleEntries).values(insertValues);
      }

      return { ok: true, id: crypto.randomUUID() };
    }),
  deleteScheduleEntry: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ context, input }) => {
      const doctorId = context.auth?.userId;
      if (!doctorId) {
        throw new Error("Missing user");
      }

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
    }),
};
