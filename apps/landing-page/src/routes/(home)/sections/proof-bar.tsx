import { Appear } from "../animations/appear";

const proofItems = [
  { label: "identity required publicly", value: "0" },
  { label: "ways to consult", value: "3" },
  { label: "care roles supported", value: "3" },
  { label: "session length", value: "50 min" },
] as const;

export function ProofBar() {
  return (
    <Appear>
      <section
        aria-label="Suwa by the numbers"
        className="page-shell grid max-w-[1060px] grid-cols-4 pt-[35px] pb-[21px] max-landing-lg:max-w-[800px] max-landing-md:grid-cols-2 max-landing-md:pt-[28px]"
      >
        {proofItems.map(({ label, value }, i) => (
          <div
            className={`flex min-w-0 items-center justify-center gap-[11px] border-border border-r last:border-r-0 max-landing-md:min-h-[64px] max-landing-md:justify-start max-landing-md:border-border max-landing-md:border-b max-landing-md:pl-[15px] max-landing-md:[&:nth-child(2)]:border-r-0 max-landing-md:[&:nth-last-child(-n+2)]:border-b-0 ${
              i >= 2 ? "max-landing-md:border-b-0" : ""
            }`}
            key={label}
          >
            <strong className="font-normal font-serif text-[29px] tracking-[-0.04em]">
              {value}
            </strong>
            <span className="max-w-[105px] text-[9px] text-foreground-muted uppercase leading-[1.45]">
              {label}
            </span>
          </div>
        ))}
      </section>
    </Appear>
  );
}
