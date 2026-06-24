import { Check } from "lucide-react";
import { Appear } from "../animations/appear";
import { SectionKicker } from "../helpers/section-heading";
import { H2 } from "../helpers/typography";

export function ProblemSolution() {
  return (
    <Appear>
      <section
        className="page-shell grid max-w-[1120px] grid-cols-[1.08fr_0.92fr] items-center gap-[100px] pt-[105px] pb-[90px] max-landing-md:grid-cols-1 max-landing-lg:gap-[50px] max-landing-md:gap-[36px] max-landing-md:pt-[78px]"
        id="why-suwa"
      >
        <div className="problem-copy">
          <SectionKicker>For busy hospital ops</SectionKicker>
          <H2>Care teams should not have to manage everything in spreadsheets.</H2>
          <p className="m-0 text-[13px] text-foreground-muted leading-[1.8]">
            Suwa connects hospitals, doctors, and patients with a cleaner path
            from registration to attendance, sessions, and follow-up.
          </p>
        </div>
        <div className="rounded-[22px] border border-border bg-[radial-gradient(circle_at_100%_0,rgb(239_213_185_/_35%),transparent_38%),rgb(255_253_248_/_74%)] px-[36px] py-[34px] shadow-[0_16px_44px_rgb(50_69_61_/_5%)] max-landing-md:px-[24px] max-landing-md:py-[28px]">
          <span className="font-serif text-[22px]">
            Why Suwa feels different
          </span>
          <ul className="mt-[25px] mb-0 grid list-none gap-[17px] p-0">
            {[
              "Register and organize hospitals and clinics",
              "Invite doctors and manage their hospital affiliations",
              "Track attendance and availability windows",
              "Keep sessions, chats, and records in one system",
            ].map((text) => (
              <li
                className="grid grid-cols-[25px_1fr] items-start text-[12px] text-foreground-secondary leading-[1.55] gap-4"
                key={text}
              >
                <span className="box-content rounded-full bg-[#426156] p-[3px] text-white">
                  <Check aria-hidden="true" size={17} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Appear>
  );
}
