"use client";

import type { ReactNode } from "react";
import Animated, {
  Easing,
  FadeIn,
  ReduceMotion,
} from "react-native-reanimated";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const nativeDelay = Math.min(delay, 100);

  return (
    <Animated.View
      className={className}
      entering={FadeIn.duration(220)
        .delay(nativeDelay)
        .easing(Easing.bezier(0.22, 1, 0.36, 1))
        .reduceMotion(ReduceMotion.System)}
    >
      {children}
    </Animated.View>
  );
}
