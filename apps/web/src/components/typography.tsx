import { cn } from "@zen-doc/ui/lib/utils";
import type { ComponentProps } from "react";

type HeadingProps = ComponentProps<"h1">;

export function PageTitle({ className, children, ...props }: HeadingProps) {
  return (
    <h1
      className={cn("font-semibold text-lg tracking-tight", className)}
      {...props}
    >
      {children}
    </h1>
  );
}

type SectionLabelProps = ComponentProps<"p">;

export function SectionLabel({
  className,
  children,
  ...props
}: SectionLabelProps) {
  return (
    <p
      className={cn(
        "font-medium text-muted-foreground text-xs uppercase tracking-wide",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

type BodyTextProps = ComponentProps<"p">;

export function BodyText({ className, children, ...props }: BodyTextProps) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props}>
      {children}
    </p>
  );
}

type StatValueProps = ComponentProps<"span">;

export function StatValue({ className, children, ...props }: StatValueProps) {
  return (
    <span className={cn("font-semibold text-2xl", className)} {...props}>
      {children}
    </span>
  );
}

type SubtitleProps = ComponentProps<"h2">;

export function Subtitle({ className, children, ...props }: SubtitleProps) {
  return (
    <h2 className={cn("font-medium text-sm", className)} {...props}>
      {children}
    </h2>
  );
}

type CaptionProps = ComponentProps<"span">;

export function Caption({ className, children, ...props }: CaptionProps) {
  return (
    <span className={cn("text-muted-foreground text-xs", className)} {...props}>
      {children}
    </span>
  );
}
