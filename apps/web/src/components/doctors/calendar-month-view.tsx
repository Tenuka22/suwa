"use client";

import { useMemo } from "react";
import {
  formatDateKey,
  getCalendarCells,
  getEntriesByDay,
} from "@/utils/doctor/calendar";
import type { ScheduleEntry } from "@/utils/doctor/types";
import { DayCell } from "./day-cell";

interface CalendarMonthViewProps {
  currentMonth: Date;
  entries: ScheduleEntry[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

export function CalendarMonthView({
  entries,
  currentMonth,
  selectedDate,
  onSelectDate,
}: CalendarMonthViewProps) {
  const cells = useMemo(() => getCalendarCells(currentMonth), [currentMonth]);
  const entriesByDay = useMemo(() => getEntriesByDay(entries), [entries]);

  return (
    <div>
      <div className="grid grid-cols-7 divide-x divide-border border-b">
        {(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const).map(
          (day) => (
            <div className="flex items-center justify-center py-2" key={day}>
              <span className="font-medium text-muted-foreground text-xs">
                {day}
              </span>
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-7 overflow-hidden">
        {cells.map((cell) => {
          const dayKey = formatDateKey(cell.date);
          const dayEntries = entriesByDay.get(dayKey) ?? [];

          return (
            <DayCell
              cell={cell}
              entries={dayEntries}
              key={dayKey}
              onSelectDate={onSelectDate}
              selectedDate={selectedDate}
            />
          );
        })}
      </div>
    </div>
  );
}
