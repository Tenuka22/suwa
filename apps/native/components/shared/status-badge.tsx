'use client';

import { Tag } from "@/components/ui/tag";

const statusLabelMap: Record<string, string> = {
  attended: "Attended",
  approved: "Approved",
  requested: "Requested",
  rescheduled: "Rescheduled",
  timing_balance_failure: "Failed to Agree",
};

const statusVariantMap: Record<
  string,
  "success" | "warning" | "destructive" | "muted"
> = {
  attended: "success",
  approved: "success",
  requested: "warning",
  timing_balance_failure: "destructive",
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = statusVariantMap[status] ?? "muted";
  const label = statusLabelMap[status] ?? status;
  return (
    <Tag shape="pill" variant={variant}>
      {label}
    </Tag>
  );
}
