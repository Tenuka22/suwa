import { z } from "zod";

export const scheduleEntrySchema = z.object({
  id: z.string(),
  kind: z.enum(["open", "block", "session"]),
  noteKind: z
    .enum(["home", "work", "pharmacy", "after_gym", "other"])
    .nullable(),
  startAt: z.string(),
  endAt: z.string(),
  sessionId: z.string().nullable(),
  session: z
    .object({
      id: z.string(),
      patientId: z.string(),
      startAt: z.string(),
      endAt: z.string(),
      status: z.string(),
    })
    .nullable(),
});

export type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;

export const schedulePageSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
});

export const scheduleKinds = ["open", "block"] as const;
export type ScheduleKind = (typeof scheduleKinds)[number];

export const scheduleNotes = [
  ["home", "Home"],
  ["work", "Work"],
  ["pharmacy", "Pharmacy"],
  ["after_gym", "After gym"],
  ["other", "Other"],
] as const;

export const timeOptions = [
  "00:00",
  "00:30",
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
  "04:00",
  "04:30",
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
] as const;

export const WEEK_DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;
