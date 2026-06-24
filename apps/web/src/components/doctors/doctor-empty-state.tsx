"use client";

import { Card, Skeleton } from "@heroui/react";
import type { ReactNode } from "react";

export function EmptyState({
  children,
  description,
  icon,
  title,
}: {
  children?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <Card className="border border-border/50 shadow-none">
      <Card.Content className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <p className="font-medium text-sm">{title}</p>
        <p className="max-w-xs font-light text-muted-foreground text-xs">
          {description}
        </p>
        {children}
      </Card.Content>
    </Card>
  );
}

export function EmptyStateSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton className="h-16 rounded-xl" key={index.toString()} />
      ))}
    </div>
  );
}
