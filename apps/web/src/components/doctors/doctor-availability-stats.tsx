"use client";

import { Card } from "@heroui/react";
import {
  CalendarDaysIcon,
  Clock3Icon,
  ClockIcon,
  InboxIcon,
} from "lucide-react";

export function DoctorAvailabilityStats({
  activeDays,
  pendingSessions,
  slots,
  totalHours,
}: {
  activeDays: number;
  pendingSessions: number;
  slots: number;
  totalHours: number;
}) {
  const items = [
    {
      icon: CalendarDaysIcon,
      label: "Active days",
      value: `${activeDays} of 7`,
    },
    {
      icon: Clock3Icon,
      label: "Weekly hours",
      value: totalHours.toFixed(1),
    },
    {
      icon: ClockIcon,
      label: "Total slots",
      value: slots,
    },
    {
      icon: InboxIcon,
      label: "Pending",
      value: pendingSessions,
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
