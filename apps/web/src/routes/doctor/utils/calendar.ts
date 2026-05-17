import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type { ScheduleEntry } from "./types";

export interface CalendarCell {
  currentMonth: boolean;
  date: Date;
  day: number;
}

export function getCalendarCells(date: Date): CalendarCell[] {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
  const totalDays = firstDayOfMonth + daysInMonth;

  const prevMonthCells = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    day: daysInPrevMonth - firstDayOfMonth + i + 1,
    currentMonth: false,
    date: new Date(
      currentYear,
      currentMonth - 1,
      daysInPrevMonth - firstDayOfMonth + i + 1
    ),
  }));

  const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true,
    date: new Date(currentYear, currentMonth, i + 1),
  }));

  const nextMonthCells = Array.from(
    { length: (7 - (totalDays % 7)) % 7 },
    (_, i) => ({
      day: i + 1,
      currentMonth: false,
      date: new Date(currentYear, currentMonth + 1, i + 1),
    })
  );

  return [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];
}

export function getCalendarMonthDays(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(date)),
    end: endOfWeek(endOfMonth(date)),
  });
}

export interface EventPosition {
  id: string;
  position: number;
}

export function calculateMonthEventPositions(
  entries: ScheduleEntry[],
  selectedDate: Date
): Map<string, number> {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const eventPositions = new Map<string, number>();
  const occupiedPositions = new Map<string, boolean[]>();

  eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((day) => {
    occupiedPositions.set(startOfDay(day).toISOString(), [false, false, false]);
  });

  const sortedEntries = [...entries].sort((a, b) => {
    const aStart = new Date(a.startAt).getTime();
    const bStart = new Date(b.startAt).getTime();
    return aStart - bStart;
  });

  for (const entry of sortedEntries) {
    const entryStart = parseISO(entry.startAt);
    const entryEnd = parseISO(entry.endAt);
    const entryDays = eachDayOfInterval({
      start: entryStart < monthStart ? monthStart : entryStart,
      end: entryEnd > monthEnd ? monthEnd : entryEnd,
    });

    let position = -1;

    for (let i = 0; i < 3; i++) {
      const canPlace = entryDays.every((day) => {
        const dayPositions = occupiedPositions.get(
          startOfDay(day).toISOString()
        );
        return dayPositions && !dayPositions[i];
      });

      if (canPlace) {
        position = i;
        break;
      }
    }

    if (position !== -1) {
      entryDays.forEach((day) => {
        const dayKey = startOfDay(day).toISOString();
        const positions = occupiedPositions.get(dayKey);
        if (positions) {
          positions[position] = true;
        }
      });
      eventPositions.set(entry.id, position);
    }
  }

  return eventPositions;
}

export function getEntriesForDate(
  entries: ScheduleEntry[],
  date: Date,
  eventPositions: Map<string, number>
): Array<ScheduleEntry & { position: number }> {
  return entries
    .filter((entry) => {
      const entryStart = parseISO(entry.startAt);
      const entryEnd = parseISO(entry.endAt);
      return date >= entryStart && date <= entryEnd;
    })
    .map((entry) => ({
      ...entry,
      position: eventPositions.get(entry.id) ?? -1,
    }))
    .sort((a, b) => a.position - b.position);
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getEntriesByDay(
  entries: ScheduleEntry[]
): Map<string, ScheduleEntry[]> {
  const map = new Map<string, ScheduleEntry[]>();

  for (const entry of entries) {
    const entryStart = parseISO(entry.startAt);
    const entryEnd = parseISO(entry.endAt);
    const days = eachDayOfInterval({
      start: startOfDay(entryStart),
      end: startOfDay(entryEnd),
    });

    for (const day of days) {
      const key = formatDateKey(day);
      const bucket = map.get(key) ?? [];
      bucket.push(entry);
      map.set(key, bucket);
    }
  }

  return map;
}
