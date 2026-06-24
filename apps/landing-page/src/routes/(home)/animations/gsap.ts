import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export const revealFromBottom = {
  autoAlpha: 0,
  y: 24,
} as const;

export const revealToDefault = {
  autoAlpha: 1,
  duration: 0.8,
  ease: "power2.out",
  y: 0,
} as const;

export const pageAppearFrom = {
  autoAlpha: 0,
  scale: 0.985,
  y: 10,
} as const;

export const pageAppearTo = {
  autoAlpha: 1,
  duration: 0.55,
  ease: "power2.out",
  scale: 1,
  y: 0,
} as const;

export const staggerList = {
  duration: 0.7,
  ease: "power2.out",
  stagger: 0.1,
} as const;

export { gsap, useGSAP };
