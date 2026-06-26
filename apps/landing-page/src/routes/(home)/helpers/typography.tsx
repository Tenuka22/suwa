import type { ReactNode } from "react";

interface H1Props {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className = "" }: H1Props) {
  return (
    <h1
      className={`font-normal font-serif text-[clamp(49px,3.75vw,58px)] leading-[1.03] tracking-[-0.04em] max-xl:text-[clamp(39px,11vw,53px)] xl:text-[49px] ${className}`}
    >
      {children}
    </h1>
  );
}

interface H2Props {
  children: ReactNode;
  className?: string;
}

export function H2({ children, className = "" }: H2Props) {
  return (
    <h2
      className={`font-normal font-serif text-[clamp(38px,3.6vw,52px)] leading-[1.08] tracking-[-0.04em] ${className}`}
    >
      {children}
    </h2>
  );
}

interface H3Props {
  children: ReactNode;
  className?: string;
}

export function H3({ children, className = "" }: H3Props) {
  return (
    <h3 className={`font-normal font-serif text-[23px] ${className}`}>
      {children}
    </h3>
  );
}

interface BodyProps {
  children: ReactNode;
  className?: string;
}

export function Body({ children, className = "" }: BodyProps) {
  return (
    <p
      className={`text-[15px] text-foreground-secondary leading-relaxed ${className}`}
    >
      {children}
    </p>
  );
}

interface CaptionProps {
  children: ReactNode;
  className?: string;
}

export function Caption({ children, className = "" }: CaptionProps) {
  return (
    <p className={`text-[13px] text-foreground-muted ${className}`}>
      {children}
    </p>
  );
}

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

export function Eyebrow({ children, className = "" }: EyebrowProps) {
  return (
    <span
      className={`block font-medium text-[11px] text-accent uppercase tracking-[0.12em] ${className}`}
    >
      {children}
    </span>
  );
}

interface AccentEmProps {
  children: ReactNode;
}

export function AccentEm({ children }: AccentEmProps) {
  return <em>{children}</em>;
}

interface MicroLabelProps {
  children: ReactNode;
  className?: string;
}

export function MicroLabel({ children, className = "" }: MicroLabelProps) {
  return (
    <span
      className={`font-medium text-[11px] text-accent uppercase tracking-[0.08em] ${className}`}
    >
      {children}
    </span>
  );
}

interface StoryLabelProps {
  children: ReactNode;
}

export function StoryLabel({ children }: StoryLabelProps) {
  return (
    <span className="font-medium text-[9px] text-accent uppercase tracking-[0.09em]">
      {children}
    </span>
  );
}
