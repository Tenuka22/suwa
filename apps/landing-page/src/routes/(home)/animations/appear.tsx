"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";
import { gsap, pageAppearFrom, pageAppearTo } from "./gsap";
import { useInView } from "../../../lib/use-in-view";

interface AppearProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "top";
}

export function Appear({
  children,
  className,
  delay = 0,
  from = "bottom",
}: AppearProps) {
  const target = useRef<HTMLDivElement | null>(null);
  const [inViewRef, inView] = useInView<HTMLDivElement>({ once: true });

  useLayoutEffect(() => {
    const element = target.current;

    if (!element || !inView) {
      return;
    }

    const fromVars =
      from === "top" ? { ...pageAppearFrom, y: -14 } : pageAppearFrom;

    gsap.fromTo(element, fromVars, { ...pageAppearTo, delay });
  }, [delay, from, inView]);

  return (
    <div className={className} ref={(node) => {
      target.current = node;
      inViewRef.current = node;
    }}>
      {children}
    </div>
  );
}
