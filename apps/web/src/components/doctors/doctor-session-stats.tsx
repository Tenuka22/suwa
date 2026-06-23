"use client";

import { Card } from "@heroui/react";
import {
  CalendarCheckIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  InboxIcon,
} from "lucide-react";

export function DoctorSessionStats({
  stats,
}: {
  stats?: {
    totalSessions?: number | null;
    todaySessions?: number | null;
    sessionsByStatus?: Record<string, number>;
  } | null;
}) {
  const totalSessions = stats?.totalSessions ?? 0;
  const todaySessions = stats?.todaySessions ?? 0;
  const sessionsByStatus = stats?.sessionsByStatus ?? {};
  const pendingCount =
    (sessionsByStatus.requested ?? 0) + (sessionsByStatus.rescheduled ?? 0);
  const attendedCount = sessionsByStatus.attended ?? 0;

  const items = [
    {
      icon: CalendarDaysIcon,
      label: "Total sessions",
      value: totalSessions,
    },
    {
      icon: CalendarCheckIcon,
      label: "Today",
      value: todaySessions,
    },
    {
      icon: InboxIcon,
      label: "Pending",
      value: pendingCount,
    },
    {
      icon: CheckCircle2Icon,
      label: "Completed",
      value: attendedCount,
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
