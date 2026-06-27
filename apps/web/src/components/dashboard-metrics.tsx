import { Badge } from "@suwa/ui/components/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import { Skeleton } from "@suwa/ui/components/skeleton";
import { TrendingUpIcon } from "lucide-react";
import type { ReactNode } from "react";

import { gridMetricCards, metricCard, metricIconBox } from "@/lib/styles";
import { BodyText, StatValue, Subtitle } from "./typography";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-48 rounded-3xl" />

      <div className={gridMetricCards}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-36 rounded-2xl" key={index.toString()} />
        ))}
      </div>

      <Skeleton className="h-[400px] rounded-3xl" />
    </div>
  );
}

export function MetricCard({
  description,
  icon,
  title,
  trend,
  value,
}: {
  description: string;
  icon: ReactNode;
  title: string;
  trend?: string;
  value: string;
}) {
  return (
    <Card className={metricCard}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <CardDescription>{title}</CardDescription>
            <CardTitle>
              <StatValue>{value}</StatValue>
            </CardTitle>
          </div>

          <div className={metricIconBox}>{icon}</div>
        </div>
      </CardHeader>

      <CardFooter className="flex items-center justify-between">
        <BodyText>{description}</BodyText>

        {trend ? (
          <Badge className="gap-1" variant="secondary">
            <TrendingUpIcon className="size-3" />
            {trend}
          </Badge>
        ) : null}
      </CardFooter>
    </Card>
  );
}

export function SectionHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <Subtitle>{title}</Subtitle>
        <BodyText>{description}</BodyText>
      </div>

      {action}
    </div>
  );
}
