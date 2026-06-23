"use client";

import { Card } from "@heroui/react";
import { ClockIcon, CoinsIcon, PackageIcon, StarIcon } from "lucide-react";

export function DoctorPlansStats({
  averageDurationMinutes,
  averagePriceCents,
  defaultPlanName,
  totalPlans,
}: {
  averageDurationMinutes: number;
  averagePriceCents: number;
  defaultPlanName: string | null;
  totalPlans: number;
}) {
  const items = [
    {
      icon: PackageIcon,
      label: "Total plans",
      value: totalPlans,
    },
    {
      icon: CoinsIcon,
      label: "Avg. price",
      value: `$${(averagePriceCents / 100).toFixed(2)}`,
    },
    {
      icon: ClockIcon,
      label: "Avg. duration",
      value: `${averageDurationMinutes} min`,
    },
    {
      icon: StarIcon,
      label: "Default",
      value: defaultPlanName ?? "None",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card className="border border-border/50 shadow-none" key={item.label}>
          <Card.Content className="flex flex-col gap-2">
            <div className="flex flex-row items-center justify-start gap-2">
              <item.icon className="size-5 text-muted-foreground opacity-60" />
              <p className="font-semibold text-2xl tabular-nums">
                {item.value}
              </p>
            </div>
            <p className="text-muted-foreground text-xs">{item.label}</p>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}
