"use client";

import { useEffect, useState } from "react";
import { gsap } from "../animations/gsap";
import { useInView } from "../../../lib/use-in-view";

const proofItems: Array<{
  label: string;
  suffix?: string;
  value: number;
}> = [
  { label: "identity required publicly", value: 0 },
  { label: "ways to consult", value: 3 },
  { label: "care roles supported", value: 3 },
  { label: "session length", value: 60, suffix: "min" },
];

function Stat({
  label,
  suffix,
  value,
}: {
  label: string;
  suffix?: string;
  value: number;
}) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView<HTMLDivElement>({ once: true });

  useEffect(() => {
    if (!inView) return;

    const obj = { value: 0 };
    const tween = gsap.to(obj, {
      value,
      duration: 2,
      ease: "power2.out",
      onUpdate: () => setCount(Math.round(obj.value)),
    });

    return () => { tween.kill(); };
  }, [inView, value]);

  return (
    <div
      ref={ref}
      className="flex min-w-0 items-center justify-center gap-[15px] border-border border-r last:border-r-0 max-xl:min-h-[64px] max-xl:justify-start max-xl:border-border max-xl:border-b max-xl:[&:nth-child(2)]:border-r-0 max-xl:[&:nth-last-child(-n+2)]:border-b-0"
    >
      <strong className="font-normal font-serif text-[40px] leading-none tracking-[-0.04em] whitespace-nowrap max-xl:text-[36px]">
        {count}
        {suffix && (
          <span className="ml-[4px] text-[13px] align-[0.15em] max-xl:text-[12px]">
            {suffix}
          </span>
        )}
      </strong>
      <span className="max-w-[120px] text-[13px] text-foreground-muted uppercase leading-[1.4] tracking-[0.05em] max-xl:text-[12px]">
        {label}
      </span>
    </div>
  );
}

export function ProofBar() {
  return (
    <section
      aria-label="Suwa by the numbers"
      className="page-shell grid max-w-[1060px] grid-cols-4 pt-[35px] pb-[21px] max-xl:max-w-[800px] max-xl:grid-cols-2 max-xl:pt-[28px]"
    >
      {proofItems.map(({ label, suffix, value }) => (
        <Stat key={label} label={label} suffix={suffix} value={value} />
      ))}
    </section>
  );
}
