"use client";

import { cn } from "@suwa/ui/lib/utils";
import type * as React from "react";

interface WellnessActionCardProps extends React.ComponentProps<"div"> {
  actionHref?: string;
  completed?: boolean;
  credits: number;
  description: string;
  icon: string;
  timeSlot: "morning" | "evening" | "night";
  title: string;
}

const timeSlotBadge = {
  morning: "bg-blue-100 text-blue-800",
  evening: "bg-purple-100 text-purple-800",
  night: "bg-indigo-100 text-indigo-800",
};

function WellnessActionCard({
  className,
  icon,
  title,
  description,
  timeSlot,
  credits,
  completed,
  ...props
}: WellnessActionCardProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-xl border-2 border-border bg-card p-4 ring-1 ring-foreground/10 transition-all hover:shadow-md",
        completed && "opacity-60",
        className
      )}
      data-slot="wellness-action-card"
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-primary font-black text-lg text-primary-foreground">
        {icon}
      </div>
      <div className="flex-1 gap-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider",
              timeSlotBadge[timeSlot]
            )}
          >
            {timeSlot}
          </span>
          {completed && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 font-bold text-[10px] text-green-800 uppercase tracking-wider">
              Done
            </span>
          )}
        </div>
        <div className="font-extrabold text-2xl text-foreground tracking-tight">
          {title}
        </div>
        <div className="mt-1 font-normal text-muted-foreground text-sm leading-6">
          {description}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
          Earn
        </span>
        <span className="font-black text-foreground text-xl">+{credits}</span>
        <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
          credits
        </span>
      </div>
    </div>
  );
}

export type { WellnessActionCardProps };
export { WellnessActionCard };
