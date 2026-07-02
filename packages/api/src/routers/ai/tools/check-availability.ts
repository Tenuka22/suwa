import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ClerkRequestContext } from "../../../context";

function resolveDate(input?: string): Date | null {
  const text = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (!text) {
    return null;
  }

  const today = new Date();
  if (text === "today") {
    return today;
  }

  if (text === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  const parsed = new Date(input ?? "");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function timeToMinutes(time: string): number {
  const [hourText = "0", minuteText = "0"] = time.split(":");
  return Number(hourText) * 60 + Number(minuteText);
}

function minutesToDate(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return result;
}

const QUERY_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "availability",
  "available",
  "check",
  "doctor",
  "doctors",
  "for",
  "i",
  "in",
  "is",
  "me",
  "need",
  "of",
  "please",
  "the",
  "to",
  "want",
  "with",
]);

function normalizeDoctorQuery(value: string): string {
  const normalized = value.replace(/^dr\.?\s+/i, "").toLowerCase();
  const tokens = normalized
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !QUERY_STOP_WORDS.has(token));

  return tokens.join(" ").trim();
}

export function createCheckAvailabilityTool(context: ClerkRequestContext) {
  return tool(
    async ({ doctorId, date }: { doctorId?: string; date?: string }) => {
      if (!doctorId?.trim()) {
        return JSON.stringify({
          error:
            "I need a specific doctor before I can check availability. Ask me for doctors with open availability instead.",
        });
      }

      const hasExplicitDate = typeof date === "string" && date.trim().length > 0;
      const dayStart = hasExplicitDate ? resolveDate(date) : new Date();
      if (hasExplicitDate && !dayStart) {
        return JSON.stringify({
          doctorId,
          error: "I need a valid date like today, tomorrow, or an ISO date.",
        });
      }

      const db: any = await import("@suwa/db");
      const orm: any = await import("drizzle-orm");
      const {
        doctorHospitalAffiliations,
        doctorSessions,
        doctorProfiles,
        doctorWeeklyAvailability,
        hospitalAvailabilityOverrides,
      } = db;
      const { and, eq, gte, like, lte, ne, or } = orm;

      const doctorQuery = normalizeDoctorQuery(doctorId.trim()) || doctorId.trim();
      const [resolvedDoctor] = await context.db
        .select({
          displayName: doctorProfiles.displayName,
          userId: doctorProfiles.userId,
        })
        .from(doctorProfiles)
        .where(
          or(
            eq(doctorProfiles.userId, doctorId.trim()),
            like(doctorProfiles.displayName, `%${doctorQuery}%`),
            like(doctorProfiles.headline, `%${doctorQuery}%`),
            like(doctorProfiles.specialties, `%${doctorQuery}%`),
            like(doctorProfiles.focusAreas, `%${doctorQuery}%`),
            like(doctorProfiles.consultationModes, `%${doctorQuery}%`),
            like(doctorProfiles.location, `%${doctorQuery}%`),
            like(doctorProfiles.placeName, `%${doctorQuery}%`)
          )
        )
        .limit(1);

      const resolvedDoctorId = resolvedDoctor?.userId ?? doctorId.trim();
      const resolvedDoctorName = resolvedDoctor?.displayName ?? doctorId.trim();

      const windowStart = startOfDay(dayStart ?? new Date());
      const windowEnd = hasExplicitDate ? addDays(windowStart, 1) : addDays(windowStart, 7);

      const availability = await context.db
        .select()
        .from(doctorWeeklyAvailability)
        .where(
          and(
            eq(doctorWeeklyAvailability.doctorId, resolvedDoctorId),
            eq(doctorWeeklyAvailability.isAvailable, true)
          )
        );

      const bookedSessions = await context.db
        .select({
          startAt: doctorSessions.startAt,
          endAt: doctorSessions.endAt,
        })
        .from(doctorSessions)
        .where(
          and(
            eq(doctorSessions.doctorId, resolvedDoctorId),
            ne(doctorSessions.status, "timing_balance_failure"),
            ne(doctorSessions.status, "attended"),
            lte(doctorSessions.startAt, windowEnd.toISOString()),
            gte(doctorSessions.endAt, windowStart.toISOString())
          )
        );

      const bookedRanges = bookedSessions.map((s: { startAt: string; endAt: string }) => ({
        start: new Date(s.startAt).getTime(),
        end: new Date(s.endAt).getTime(),
      }));

      const affiliations = await context.db
        .select()
        .from(doctorHospitalAffiliations)
        .where(
          and(
            eq(doctorHospitalAffiliations.doctorId, resolvedDoctorId),
            eq(doctorHospitalAffiliations.status, "ACTIVE")
          )
        );

      const blockedRanges: Array<{ start: number; end: number }> = [];

      for (const aff of affiliations) {
        if (!aff.availabilityWindows) {
          continue;
        }

        const windows = JSON.parse(aff.availabilityWindows) as Array<{
          dayOfWeek: number;
          startTime: string;
          endTime: string;
        }>;

        const dateCursor = new Date(windowStart);
        while (dateCursor < windowEnd) {
          const dayOfWeek = dateCursor.getDay();
          for (const window of windows) {
            if (window.dayOfWeek !== dayOfWeek) {
              continue;
            }

            blockedRanges.push({
              start: minutesToDate(dateCursor, timeToMinutes(window.startTime)).getTime(),
              end: minutesToDate(dateCursor, timeToMinutes(window.endTime)).getTime(),
            });
          }
          dateCursor.setDate(dateCursor.getDate() + 1);
        }
      }

      const overrides = await context.db
        .select()
        .from(hospitalAvailabilityOverrides)
        .where(eq(hospitalAvailabilityOverrides.doctorId, resolvedDoctorId));

      for (const override of overrides) {
        const start = new Date(override.startAt).getTime();
        const end = new Date(override.endAt).getTime();
        if (end >= windowStart.getTime() && start <= windowEnd.getTime()) {
          blockedRanges.push({ start, end });
        }
      }

      const openSlots: Array<{ available: boolean; endAt: string; startAt: string }> = [];
      const currentDate = new Date(windowStart);
      const now = Date.now();
      const todayLabel = new Date().toDateString();
      const weeklyAvailability = availability as Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
      }>;

      while (currentDate < windowEnd) {
        const dayOfWeek = currentDate.getDay();
        const dayAvailability = weeklyAvailability.filter(
          (slot) => slot.dayOfWeek === dayOfWeek
        );

        for (const slot of dayAvailability) {
          const slotStart = minutesToDate(currentDate, timeToMinutes(slot.startTime));
          const slotEndBase = minutesToDate(currentDate, timeToMinutes(slot.endTime));

          let cursor = new Date(slotStart);
          while (cursor < slotEndBase) {
            const slotEnd = new Date(cursor.getTime() + 30 * 60 * 1000);
            if (slotEnd > slotEndBase) {
              break;
            }

            const cursorTime = cursor.getTime();
            const slotEndTime = slotEnd.getTime();
            if (currentDate.toDateString() === todayLabel && cursorTime < now) {
              cursor = slotEnd;
              continue;
            }
            const hasOverlap = bookedRanges.some(
              (range) => cursorTime < range.end && slotEndTime > range.start
            );
            const isBlocked = blockedRanges.some(
              (range) => cursorTime < range.end && slotEndTime > range.start
            );

            if (!(hasOverlap || isBlocked)) {
              openSlots.push({
                available: true,
                endAt: slotEnd.toISOString(),
                startAt: cursor.toISOString(),
              });
            }

            cursor = slotEnd;
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const response: Record<string, unknown> = {
        available: openSlots.length > 0,
        doctorId: resolvedDoctorId,
        doctorName: resolvedDoctorName,
        slots: openSlots.slice(0, 6),
      };

      if (hasExplicitDate) {
        response.date = windowStart.toISOString();
      }

      if (openSlots.length === 0) {
        response.message = hasExplicitDate
          ? "No open slots found on that date."
          : "No open slots found in the next 7 days.";
      }

      return JSON.stringify(response);
    },
    {
      name: "check_availability",
      description:
        "Check availability for a specific doctor on a date or show the next open slots",
      schema: z.object({
        doctorId: z.string().optional(),
        date: z.string().optional(),
      }),
    }
  );
}
