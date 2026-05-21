"use client";

import { format } from "date-fns";

import { cn } from "@/lib/utils";

import type { ScheduleEntry } from "@/utils/doctor/types";

interface MonthEventBadgeProps {
  className?: string;
  entry: ScheduleEntry;
}

const badgeVariants = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  block:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
  session:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
};

export function MonthEventBadge({ entry, className }: MonthEventBadgeProps) {
  const variant = badgeVariants[entry.kind] ?? badgeVariants.open;

  return (
    <div
      className={cn(
        "mx-1 flex h-6 select-none items-center truncate whitespace-nowrap rounded-md border px-2 text-xs",
        variant,
        className
      )}
    >
      <div className="flex items-center gap-1.5 truncate">
        <span className="truncate font-semibold">
          {format(new Date(entry.startAt), "h:mm a")} -{" "}
          {format(new Date(entry.endAt), "h:mm a")}
        </span>
      </div>
      <span className="ml-1 truncate opacity-80">
        {entry.noteKind ?? (entry.session ? "Session" : entry.kind)}
      </span>
    </div>
  );
}
