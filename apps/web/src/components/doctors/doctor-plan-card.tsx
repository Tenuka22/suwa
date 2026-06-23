"use client";

import { Card, Chip } from "@heroui/react";
import { CheckIcon, ClockIcon, CoinsIcon } from "lucide-react";

interface DoctorPlan {
  description: string | null;
  durationMinutes: number;
  features: string | null;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  name: string;
  parsedFeatures: string[];
  priceCents: number;
  sortOrder: number;
}

export function DoctorPlanCard({ plan }: { plan: DoctorPlan }) {
  return (
    <Card className={plan.isDefault ? "ring-1 ring-primary/20" : ""}>
      <Card.Content className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-light text-sm">{plan.name}</span>
            {plan.isDefault && (
              <Chip
                className="border-primary/20 bg-primary/10 text-[10px] text-primary"
                variant="tertiary"
              >
                Default
              </Chip>
            )}
          </div>
        </div>

        {plan.description && (
          <p className="font-light text-foreground/60 text-xs leading-relaxed">
            {plan.description}
          </p>
        )}

        <div className="flex items-center gap-4 border-border/50 border-t pt-3">
          <div className="flex items-center gap-1.5">
            <CoinsIcon className="size-4 text-foreground/50" />
            <span className="font-medium text-lg">
              ${(plan.priceCents / 100).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <ClockIcon className="size-4 text-foreground/50" />
            <span className="font-medium text-lg">{plan.durationMinutes}</span>
            <span className="text-foreground/60 text-xs">min</span>
          </div>
        </div>

        {plan.parsedFeatures.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {plan.parsedFeatures.slice(0, 3).map((feature) => (
              <div className="flex items-start gap-2" key={feature}>
                <CheckIcon className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                <span className="text-foreground/60 text-xs">{feature}</span>
              </div>
            ))}
            {plan.parsedFeatures.length > 3 && (
              <p className="pl-5 text-[10px] text-foreground/60">
                +{plan.parsedFeatures.length - 3} more
              </p>
            )}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
