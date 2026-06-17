"use client";

import { cn } from "@suwa/ui/lib/utils";
import type * as React from "react";

interface ConsistencyStreakProps extends React.ComponentProps<"div"> {
  health: number;
  mood: "idle" | "happy" | "sad" | "yawn" | "sleep";
  streakDays: number;
}

function ConsistencyStreak({
  className,
  streakDays,
  health,
  mood,
  ...props
}: ConsistencyStreakProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border-2 border-border bg-card p-4 ring-1 ring-foreground/10",
        className
      )}
      data-slot="consistency-streak"
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-primary font-black text-lg text-primary-foreground">
        {mood === "happy"
          ? "😊"
          : mood === "sad"
            ? "😢"
            : mood === "sleep"
              ? "😴"
              : "🤖"}
      </div>
      <div className="flex-1">
        <div className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
          Sprite Status
        </div>
        <div className="font-black text-foreground text-xl capitalize tracking-tight">
          {mood}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${health}%` }}
            />
          </div>
          <span className="font-bold text-muted-foreground text-xs">
            {health}%
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
          Streak
        </div>
        <div className="font-black text-2xl text-foreground">{streakDays}</div>
        <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
          days
        </div>
      </div>
    </div>
  );
}

export type { ConsistencyStreakProps };
export { ConsistencyStreak };
