import type { ReactNode } from "react";

import { Card, CardContent } from "@suwa/ui/components/card";

type AuthCardProps = {
  children: ReactNode;
  imagePosition?: "left" | "right";
};

export function AuthCard({ children, imagePosition = "right" }: AuthCardProps) {
  const image = (
    <div className="relative hidden bg-muted md:block">
      <img
        src="/placeholder.svg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
      />
    </div>
  );

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="grid p-0 md:grid-cols-2">
        {imagePosition === "left" ? image : null}
        {children}
        {imagePosition === "right" ? image : null}
      </CardContent>
    </Card>
  );
}
