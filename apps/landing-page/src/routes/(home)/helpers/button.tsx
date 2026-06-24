import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

const button = cva(
  "inline-flex cursor-pointer items-center gap-[--btn-gap] rounded-full font-medium transition-all duration-180 ease-default focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4",
  {
    variants: {
      variant: {
        primary: [
          "h-[53px] w-[288px] justify-between py-[5px] pr-[6px] pl-[42px] font-medium text-[13px] text-white",
          "bg-gradient-to-br from-[#29493f] to-[#3d6357]",
          "shadow-[0_8px_24px_rgb(37_70_60_/_10%)]",
          "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgb(34_64_56_/_20%)]",
        ].join(" "),
        secondary: ["gap-[13px] font-medium text-[14px]"].join(" "),
        outline: [
          "gap-[36px] border border-foreground px-[22px] py-[14px] font-medium text-[13px] text-foreground",
          "hover:bg-foreground hover:text-white",
        ].join(" "),
        light: [
          "gap-[26px] bg-white px-[22px] py-[14px] font-medium text-[12px] text-foreground",
          "shadow-[0_8px_24px_rgb(45_62_53_/_0.08)]",
          "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgb(34_64_56_/_20%)]",
        ].join(" "),
        headerCta: [
          "px-[29px] py-[17px] text-[13px] text-white",
          "bg-gradient-to-br from-[#294a40] to-[#3f6256]",
          "shadow-[0_8px_22px_rgb(34_64_56_/_12%)]",
          "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgb(34_64_56_/_20%)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

type ButtonVariants = VariantProps<typeof button>;

export function Button({
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

const roundArrow = cva("grid flex-none place-items-center rounded-full", {
  variants: {
    size: {
      sm: "size-[42px]",
      md: "size-[53px]",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

interface RoundArrowProps extends VariantProps<typeof roundArrow> {
  children: ReactNode;
}

export function RoundArrow({ size, children }: RoundArrowProps) {
  return <span className={roundArrow({ size })}>{children}</span>;
}

export const playCircle =
  "grid place-items-center size-[53px] rounded-full bg-[rgb(255_255_255_/_42%)] border border-border shadow-[inset_0_0_0_4px_rgb(255_255_255_/_28%)] transition-all duration-180 ease-default group-hover:bg-white group-hover:scale-104";
