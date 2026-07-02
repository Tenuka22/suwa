import type { ReactNode } from "react";

interface SectionHeadingProps {
  description?: string;
  eyebrow: string;
  title: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mx-auto mb-[47px] max-w-[620px] text-center max-sm:mb-[32px]">
      <span className="block font-medium text-[12px] text-accent uppercase tracking-[0.12em]">
        {eyebrow}
      </span>
      <h2 className="mt-[11px] mb-[13px] font-normal font-serif text-[clamp(38px,4vw,54px)] text-clamp leading-[1.08] tracking-[-0.04em] max-sm:text-[clamp(30px,9.5vw,36px)]">
        {title}
      </h2>
      {description ? (
        <p className="m-0 text-[14px] text-foreground-muted leading-[1.75]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

interface SectionKickerProps {
  children: ReactNode;
  className?: string;
}

export function SectionKicker({
  children,
  className = "",
}: SectionKickerProps) {
  return (
    <span
      className={`block font-medium text-[11px] text-accent uppercase tracking-[0.11em] ${className}`}
    >
      {children}
    </span>
  );
}

interface SectionNumberProps {
  children: ReactNode;
}

export function SectionNumber({ children }: SectionNumberProps) {
  return (
    <span className="mb-[11px] grid size-[38px] h-[28px] place-items-center rounded-[8px] bg-[#f1efe8] font-medium text-[#233833] text-[12px]">
      {children}
    </span>
  );
}

interface TextLinkProps {
  children: ReactNode;
  href: string;
}

export function TextLink({ href, children }: TextLinkProps) {
  return (
    <a
      className="group mt-[17px] inline-flex items-center gap-[8px] font-medium text-[13px] text-accent"
      href={href}
    >
      {children}
    </a>
  );
}
