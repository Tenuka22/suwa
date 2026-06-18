import { Card } from "@heroui/react";
import type { ReactNode } from "react";

export function StatCard({
  description,
  icon,
  title,
  value,
}: {
  description: string;
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <Card.Header>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Card.Description>{title}</Card.Description>
            <Card.Title>{value}</Card.Title>
          </div>
          <div className="rounded-xl bg-muted p-2">{icon}</div>
        </div>
      </Card.Header>
      <Card.Footer>
        <p className="text-muted-foreground text-sm">{description}</p>
      </Card.Footer>
    </Card>
  );
}
