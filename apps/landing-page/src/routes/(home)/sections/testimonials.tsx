import { Appear } from "../animations/appear";
import { StoryLabel } from "../helpers/typography";

const testimonials = [
  {
    context: "First consultation",
    quote:
      "I could ask for help without feeling like everyone would know my story.",
  },
  {
    context: "Doctor trust",
    quote:
      "Seeing doctor details helped me feel safe enough to start privately.",
  },
  {
    context: "Ongoing care",
    quote:
      "Starting anonymous made it easier to continue care when I was ready.",
  },
] as const;

export function Testimonials() {
  return (
    <Appear>
      <section
        className="pt-[105px] pb-[112px] max-landing-md:pt-[75px] max-landing-md:pb-[82px]"
        id="stories"
      >
        <div className="page-shell">
          <div className="mx-auto mb-[47px] max-w-[620px] text-center">
            <span className="block font-medium text-[12px] text-accent uppercase tracking-[0.12em]">
              The outcome Suwa is built for
            </span>
            <h2 className="mt-[11px] mb-[13px] font-normal font-serif text-[clamp(38px,4vw,54px)] leading-[1.08] tracking-[-0.04em]">
              "Finally. Asking for help feels safer."
            </h2>
            <p className="m-0 text-[14px] text-foreground-muted leading-[1.75]">
              People get a private way to begin consultation, while doctors and
              hospitals provide the trusted care network behind it.
            </p>
          </div>
          <div className="mx-auto grid max-w-[1100px] grid-cols-3 gap-[18px] max-landing-md:max-w-[410px] max-landing-md:grid-cols-1 max-landing-lg:gap-[12px]">
            {testimonials.map(({ context, quote }) => (
              <figure
                className="m-0 min-h-[250px] rounded-[22px] border border-border bg-[rgb(255_253_248_/_72%)] p-[32px] max-landing-lg:p-[26px]"
                key={context}
              >
                <StoryLabel>Illustrative care story</StoryLabel>
                <blockquote className="mx-0 my-[26px] mb-[30px] font-serif text-[20px] leading-[1.45]">
                  "{quote}"
                </blockquote>
                <figcaption className="flex flex-col gap-[4px] text-[9px] text-foreground-muted uppercase tracking-[0.08em]">
                  <span className="font-medium text-[10px] text-foreground normal-case">
                    Anonymous care scenario
                  </span>
                  {context}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </Appear>
  );
}
