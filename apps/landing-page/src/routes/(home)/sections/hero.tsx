import { ArrowRight, CirclePlay } from "lucide-react";
import { OptimizedImage } from "../../../components/optimized-image";
import { Button, playCircle, RoundArrow } from "../helpers/button";
import { MOBILE_WEB_URL } from "../helpers/mobile-web-url";
import { H1 } from "../helpers/typography";

export function Hero() {
  return (
    <section
      className="relative grid h-[525px] grid-cols-[45.5%_54.5%] max-xl:h-auto max-xl:min-h-[690px] max-xl:grid-cols-1"
      id="top"
    >
      <div className="relative z-[2] flex h-full flex-col justify-center max-xl:items-center max-xl:pt-[36px] max-xl:text-center">
        <span className="mb-[11px] block font-medium text-[11px] text-accent uppercase tracking-[0.12em] max-xl:text-[10px]">
          Private online care without stigma
        </span>
        <H1 className="max-w-[620px] text-[clamp(43px,3.4vw,52px)] max-sm:text-[clamp(32px,10vw,38px)] max-xl:text-[clamp(38px,9vw,48px)] xl:text-[46px]">
          Talk to a doctor anonymously, before fear stops you.
        </H1>
        <p className="mx-0 mt-[18px] mb-0 max-w-[520px] text-[16px] text-foreground-secondary leading-[1.6] max-xl:mt-[20px] max-xl:text-[15px]">
          Start privately, ask what feels difficult to say out loud, and move
          into trusted doctor backed care when you are ready.
        </p>
        <div className="mt-[22px] flex items-center gap-[22px] max-xl:mt-[24px] max-xl:flex-col max-xl:gap-[14px]">
          <Button href={MOBILE_WEB_URL} variant="primary">
            <span>Start anonymous consult</span>
            <RoundArrow size="sm">
              <ArrowRight aria-hidden="true" size={20} strokeWidth={1.7} />
            </RoundArrow>
          </Button>
          <a
            className="group flex cursor-pointer items-center gap-[13px] font-medium text-[14px]"
            href="#how-it-works"
          >
            <span className={playCircle}>
              <CirclePlay aria-hidden="true" size={23} strokeWidth={1.5} />
            </span>
            <span>See how it works</span>
          </a>
        </div>
        <div className="mt-[20px] flex max-w-[520px] flex-wrap gap-[8px] text-[11px] text-foreground-secondary uppercase tracking-[0.08em] max-xl:mt-[18px] max-xl:justify-center">
          <span className="rounded-full border border-border bg-[rgb(255_253_248_/_68%)] px-[11px] py-[6px]">
            Anonymous sessions
          </span>
          <span className="rounded-full border border-border bg-[rgb(255_253_248_/_68%)] px-[11px] py-[6px]">
            Verified doctors
          </span>
          <span className="rounded-full border border-border bg-[rgb(255_253_248_/_68%)] px-[11px] py-[6px]">
            Private by design
          </span>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none relative z-[1] -mr-4 sm:-mr-6 lg:-mr-8 after:absolute after:inset-x-[-20px] after:bottom-[-5px] after:h-[48px] after:bg-gradient-to-b after:from-transparent after:to-background max-xl:absolute max-xl:inset-x-0 max-xl:top-[165px] max-xl:h-[525px] max-xl:overflow-hidden"
      >
        <OptimizedImage
          alt=""
          className="max-xl:scale-[1.08] max-xl:opacity-60"
          height={1024}
          priority
          src="/images/gen/suwa-hero-watercolor.png"
          style={{ height: "100%", aspectRatio: undefined }}
          width={1536}
        />
      </div>
    </section>
  );
}
