import { ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { Appear } from "../animations/appear";
import { SectionKicker } from "../helpers/section-heading";

const steps = [
  {
    description:
      "Begin with a private profile and only share what is needed for care.",
    icon: Sparkles,
    number: "01",
    title: "Start anonymously",
  },
  {
    description:
      "Choose a doctor and the consultation mode that feels safest first.",
    icon: Stethoscope,
    number: "02",
    title: "Choose your care path",
  },
  {
    description:
      "Move from chat to video or in person care when trust is established.",
    icon: ShieldCheck,
    number: "03",
    title: "Continue with support",
  },
] as const;

export function HowItWorks() {
  return (
    <Appear>
      <section
        className="bg-background-subtle pt-[92px] pb-[100px] max-xl:pt-[72px]"
        id="how-it-works"
      >
        <div className="page-shell">
          <div className="mx-auto mb-[48px] max-w-[700px] text-center">
            <SectionKicker className="text-[12px]">A safer first step</SectionKicker>
            <div className="relative mx-auto mt-[14px] mb-[18px] inline-block">
              <div
                aria-hidden="true"
                className="absolute -top-[24px] left-[-18px] z-0 size-[80px] rounded-full bg-accent/10 max-md:size-[56px]"
              />
              <h2 className="relative z-[1] font-normal font-serif text-[clamp(32px,4vw,48px)] leading-[1.08] tracking-[-0.04em]">
                Getting help should
                <br />
                <span className="text-accent">not feel exposing.</span>
              </h2>
            </div>
            <p className="mx-auto max-w-[540px] text-[14px] text-foreground-muted leading-[1.75]">
              No public waiting room. No pressure to explain yourself before you
              are ready. Just a quieter path into care.
            </p>
          </div>

          <div className="flex flex-row flex-wrap gap-8 items-center justify-center">
            {steps.map(({ description, icon: Icon, number, title }) => (
              <article
                className="relative min-h-[250px] overflow-hidden rounded-[24px] border border-[rgb(225_224_210_/_80%)] bg-[rgb(255_253_248_/_75%)] p-[36px] max-xl:p-[26px]"
                key={number}
              >
                <span className="absolute top-[24px] right-[26px] font-serif text-[57px] text-[rgb(45_69_61_/_11%)] leading-none">
                  {number}
                </span>
                <Icon
                  aria-hidden="true"
                  className="mt-[25px] mb-[18px] text-accent"
                  size={30}
                  strokeWidth={1.35}
                />
                <h3 className="m-0 mb-[9px] font-normal font-serif text-[23px]">
                  {title}
                </h3>
                <p className="m-0 text-[12px] text-foreground-muted leading-[1.7]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Appear>
  );
}
