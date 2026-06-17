"use client";

import { cn } from "@suwa/ui/lib/utils";
import type * as React from "react";

interface MoonlightCreditsDisplayProps extends React.ComponentProps<"div"> {
  balance: number;
  consistencyScore: number;
  totalEarned: number;
}

function MoonlightCreditsDisplay({
  className,
  balance,
  totalEarned,
  consistencyScore,
  ...props
}: MoonlightCreditsDisplayProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border-2 border-border bg-card p-4 ring-1 ring-foreground/10",
        className
      )}
      data-slot="moonlight-credits-display"
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-amber-400 font-black text-black text-lg">
        ☽
      </div>
      <div className="flex-1">
        <div className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
          Moonlight Credits
        </div>
        <div className="font-black text-3xl text-foreground tracking-tight">
          {balance}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="text-right">
          <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
            Total Earned
          </div>
          <div className="font-extrabold text-foreground text-lg">
            {totalEarned}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
            Consistency
          </div>
          <div className="font-extrabold text-foreground text-lg">
            {consistencyScore}%
          </div>
        </div>
      </div>
    </div>
  );
}

export type { MoonlightCreditsDisplayProps };
export { MoonlightCreditsDisplay };
