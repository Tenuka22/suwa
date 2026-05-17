"use client";

import { isSameDay, isToday, startOfDay } from "date-fns";

import { cn } from "@/lib/utils";
import type { CalendarCell } from "../utils/calendar";
import type { ScheduleEntry } from "../utils/types";

interface DayCellProps {
  cell: CalendarCell;
  entries: ScheduleEntry[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

const MAX_VISIBLE_EVENTS = 3;

function isBeforeToday(date: Date): boolean {
  return startOfDay(date).getTime() < startOfDay(new Date()).getTime();
}

export function DayCell({
  cell,
  entries,
  selectedDate,
  onSelectDate,
}: DayCellProps) {
  const { day, currentMonth, date } = cell;
  const isSunday = date.getDay() === 0;
  const isPast = isBeforeToday(date);
  const isSelected = isSameDay(date, selectedDate);

  const handleClick = () => {
    if (!isPast) {
      onSelectDate(date);
    }
  };

  return (
    <button
      className={cn(
        "flex h-full min-h-[8rem] flex-col gap-1 border-t border-l p-2 text-left transition-colors hover:bg-muted/40",
        isSunday && "border-l-0",
        !currentMonth && "text-muted-foreground/50",
        isSelected && "bg-muted/50",
        isPast && "cursor-not-allowed opacity-50"
      )}
      disabled={isPast}
      onClick={handleClick}
      type="button"
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "font-medium text-sm",
            isToday(date) &&
              "flex h-6 w-6 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground"
          )}
        >
          {day}
        </span>
        {entries.length > 0 && !isPast ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
            {entries.length}
          </span>
        ) : null}
      </div>
      <div className="space-y-1">
        {entries.slice(0, MAX_VISIBLE_EVENTS).map((entry) => (
          <div
            className={cn(
              "rounded-md border px-2 py-1 text-[11px]",
              entry.kind === "open" &&
                "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              entry.kind === "block" &&
                "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
              entry.kind === "session" &&
                "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
            )}
            key={entry.id}
          >
            <div className="truncate font-medium">
              {new Date(entry.startAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {new Date(entry.endAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="truncate opacity-80">
              {entry.noteKind ?? (entry.session ? "session" : entry.kind)}
            </div>
          </div>
        ))}
      </div>
      {entries.length > MAX_VISIBLE_EVENTS && (
        <p className="font-semibold text-muted-foreground text-xs">
          +{entries.length - MAX_VISIBLE_EVENTS} more
        </p>
      )}
    </button>
  );
}
