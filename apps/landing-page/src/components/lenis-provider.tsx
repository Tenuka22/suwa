"use client";

import "lenis/dist/lenis.css";
import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

interface LenisProviderProps {
  children: ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps) {
  return (
    <ReactLenis root options={{ smoothWheel: true, lerp: 0.08 }}>
      {children}
    </ReactLenis>
  );
}
