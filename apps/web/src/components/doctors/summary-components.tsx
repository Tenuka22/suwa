import { cn } from "@zen-doc/ui/lib/utils";
import type { ReactNode } from "react";

export function SummaryItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon && <div className="shrink-0">{icon}</div>}
      <div className="space-y-0.5 overflow-hidden">
        <p className="font-bold text-[9px] text-muted-foreground/60 uppercase tracking-widest leading-none">
          {label}
        </p>
        <p className="font-bold text-foreground/80 text-xs truncate leading-tight">{value}</p>
      </div>
    </div>
  );
}

const summaryThemes = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary text-secondary-foreground border-border",
  accent: "bg-accent text-accent-foreground border-border",
  muted: "bg-muted text-muted-foreground border-border",
};

type SummaryTheme = keyof typeof summaryThemes;

export function SummaryBlock<T extends string>({
  label,
  labels,
  values,
  colorTheme = "primary",
}: {
  label: string;
  labels: Record<T, string>;
  values: T[];
  colorTheme?: SummaryTheme;
}) {
  return (
    <div className="space-y-2.5">
      <p className="font-bold text-[9px] text-muted-foreground/60 uppercase tracking-widest leading-none">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {values.length > 0 ? (
          values.map((value) => (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 font-bold text-[10px] tracking-tight uppercase transition-all hover:scale-105",
                summaryThemes[colorTheme]
              )}
              key={value}
            >
              {labels[value] ?? value}
            </span>
          ))
        ) : (
          <span className="font-bold text-muted-foreground/30 text-[10px] uppercase tracking-tighter italic">
            Null Set
          </span>
        )}
      </div>
    </div>
  );
}
