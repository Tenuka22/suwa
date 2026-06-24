import { Appear } from "../animations/appear";
import { SectionKicker } from "../helpers/section-heading";

const faqItems = [
  {
    answer:
      "Suwa helps people begin online consultation anonymously, then connect with doctors through chat, video, or in-person care when they are ready.",
    question: "What problem does Suwa solve?",
  },
  {
    answer:
      "Hospitals and clinics provide trusted care infrastructure, doctor affiliation, scheduling, and continuity. They support the experience, but stigma-free consultation is the main goal.",
    question: "Where do hospitals fit in?",
  },
  {
    answer:
      "People can start with a private online path and choose how much they share as the consultation continues.",
    question: "Can patients stay anonymous?",
  },
  {
    answer:
      "The platform is built for people who fear stigma, plus the doctors and hospital teams who support safe consultation and follow-up.",
    question: "Who is Suwa for?",
  },
] as const;

export function Faq() {
  return (
    <Appear>
      <section
        className="page-shell grid max-w-[1120px] grid-cols-[0.8fr_1.2fr] gap-[110px] border-border border-t pt-[95px] pb-[115px] max-landing-md:grid-cols-1 max-landing-lg:gap-[55px] max-landing-md:gap-[42px] max-landing-md:pt-[72px] max-landing-md:pb-[82px]"
        id="faq"
      >
        <div className="max-w-[370px]">
          <SectionKicker>Questions are welcome</SectionKicker>
          <h2 className="mt-[13px] mb-[18px] font-normal font-serif text-[clamp(38px,3.6vw,52px)] leading-[1.08] tracking-[-0.04em]">
            Know the workflow.
          </h2>
          <p className="m-0 text-[13px] text-foreground-muted leading-[1.8]">
            Clear answers, because trust starts before the first login.
          </p>
        </div>
        <div className="border-border border-t">
          {faqItems.map(({ answer, question }) => (
            <details className="group border-border border-b" key={question}>
              <summary className="relative cursor-pointer list-none py-[22px] pr-[43px] font-serif text-[19px] marker:hidden after:absolute after:top-[19px] after:right-[3px] after:grid after:size-[28px] after:place-items-center after:rounded-full after:bg-[#eceee4] after:font-sans after:text-[17px] after:text-foreground after:transition-transform after:duration-180 after:ease-default after:content-['+'] group-open:after:rotate-45 [&::-webkit-details-marker]:hidden">
                {question}
              </summary>
              <p className="mx-0 mt-0 max-w-[590px] pr-[43px] pb-[23px] text-[12px] text-foreground-muted leading-[1.75]">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </Appear>
  );
}
