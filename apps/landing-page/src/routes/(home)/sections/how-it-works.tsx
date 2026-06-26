import { ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { Appear } from "../animations/appear";
import { SectionHeading } from "../helpers/section-heading";

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
      "Move from chat to video or in-person care when trust is established.",
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
          <SectionHeading
            description="No public waiting room. No pressure to explain yourself before you are ready. Just a quieter path into care."
            eyebrow="A safer first step"
            title="Getting help should not feel exposing."
          />
          <div className="mx-auto grid max-w-[1000px] grid-cols-3 gap-[18px] max-xl:max-w-[410px] max-xl:grid-cols-1 max-xl:gap-[12px]">
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
