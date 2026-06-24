import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

const button = cva(
  "inline-flex items-center gap-[--btn-gap] rounded-full font-medium transition-all duration-180 ease-default focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4",
  {
    variants: {
      variant: {
        primary: [
          "h-[53px] bg-primary px-[29px] font-medium text-[13px] text-white shadow-md hover:bg-primary-hover",
        ],
        secondary: [
          "h-[44px] bg-background-subtle px-[22px] font-medium text-[13px] text-foreground hover:bg-muted",
        ],
        outline: [
          "h-[44px] border border-border px-[22px] font-medium text-[13px] text-foreground hover:bg-muted",
        ],
        ghost: [
          "h-[44px] px-[22px] font-medium text-[13px] text-foreground hover:bg-background-subtle",
        ],
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

type ButtonVariants = VariantProps<typeof button>;

export function UiButton({
  variant,
  className,
  children,
  ...props
}: ComponentProps<"a"> & ButtonVariants) {
  return (
    <a className={button({ variant, className })} {...props}>
      {children}
    </a>
  );
}

export function IconButton({
  children,
  className = "",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      className={`grid size-[40px] place-items-center rounded-full bg-background-subtle text-foreground transition-colors hover:bg-muted ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface PageHeadingProps {
  description?: string;
  title: string;
}

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <div className="max-w-[600px]">
      <h1 className="font-normal font-serif text-[clamp(32px,4vw,48px)] text-foreground leading-tight tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="mt-[12px] text-[15px] text-foreground-secondary leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

interface SectionProps {
  children: ReactNode;
  className?: string;
}

export function Section({ children, className = "" }: SectionProps) {
  return (
    <section className={`py-[48px] ${className}`}>
      <div className="page-shell">{children}</div>
    </section>
  );
}
