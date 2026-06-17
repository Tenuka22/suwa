import { cn } from "@suwa/ui/lib/utils";
import type { ReactNode } from "react";

import { SectionLabel } from "@/components/typography";

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
    <div className="flex items-start gap-2.5">
      {icon && <div className="shrink-0">{icon}</div>}
      <div className="flex flex-col gap-0.5">
        <SectionLabel>{label}</SectionLabel>
        <p className="font-medium text-foreground/80 text-sm">{value}</p>
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
    <div className="flex flex-col gap-2">
      <SectionLabel>{label}</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {values.length > 0 ? (
          values.map((value) => (
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 font-semibold text-xs transition-all hover:scale-105",
                summaryThemes[colorTheme]
              )}
              key={value}
            >
              {labels[value] ?? value}
            </span>
          ))
        ) : (
          <span className="font-medium text-muted-foreground text-xs italic">
            Not configured
          </span>
        )}
      </div>
    </div>
  );
}
