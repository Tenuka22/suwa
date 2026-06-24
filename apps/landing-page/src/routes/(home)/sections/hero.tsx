import { ArrowRight, CirclePlay, ShieldCheck } from "lucide-react";
import { OptimizedImage } from "../../../components/optimized-image";
import { Button, playCircle, RoundArrow } from "../helpers/button";
import { MOBILE_WEB_URL } from "../helpers/mobile-web-url";
import { H1 } from "../helpers/typography";

export function Hero() {
  return (
    <section
      className="grid h-[550px] grid-cols-[45.5%_54.5%] max-landing-lg:h-auto max-landing-lg:grid-cols-1"
      id="top"
    >
      <div className="relative  z-[2] pt-[48px] pl-[28px] max-landing-md:pt-[41px] max-landing-lg:px-[26px] max-landing-xl:pl-[10px]">
        <span className="mb-[13px] block font-medium text-[11px] text-accent uppercase tracking-[0.12em] max-landing-md:text-[9px]">
          Hospital operations, made calmer
        </span>
        <H1>
          Manage hospitals, doctors, and <em>patient sessions.</em>
        </H1>
          <p className="mx-0 mt-[24px] mb-0 text-[17px] text-foreground-secondary leading-[1.65] max-landing-md:mt-[27px] max-landing-md:text-[15px]">
            Suwa gives hospitals a single place to register tenants, invite
            doctors, manage attendance, and keep care moving.
            <br />
            Bring the native experience to your team.
          </p>
        <div className="mt-[24px] flex items-center gap-[25px] max-landing-md:mt-[27px] max-landing-md:flex-col max-landing-md:items-start max-landing-md:gap-[16px]">
          <Button href={MOBILE_WEB_URL} variant="primary">
            <span>Open the native app</span>
            <RoundArrow size="sm">
              <ArrowRight aria-hidden="true" size={20} strokeWidth={1.7} />
            </RoundArrow>
          </Button>
          <a
            className="group flex items-center gap-[13px] font-medium text-[14px]"
            href="#how-it-works"
          >
            <span className={playCircle}>
              <CirclePlay aria-hidden="true" size={23} strokeWidth={1.5} />
            </span>
            <span>See how it works</span>
          </a>
        </div>
        <div className="mt-[22px] flex items-center gap-[10px] text-[#273c36] text-[12px] max-landing-md:mt-[24px] max-landing-md:flex-wrap max-landing-md:leading-[1.5]">
          <ShieldCheck aria-hidden="true" size={19} strokeWidth={1.6} />
          <strong className="font-medium">Built for hospital teams</strong>
          <span
            aria-hidden="true"
            className="mx-[2px] size-[3px] rounded-full bg-accent max-landing-md:hidden"
          />
          <span className="max-landing-md:basis-full max-landing-md:pl-[29px]">
            Tenants, clinics, schedules, sessions, and notifications in one
            flow.
          </span>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none relative z-[1] after:absolute after:inset-x-[-20px] after:bottom-[-5px] after:h-[48px] after:bg-gradient-to-b after:from-transparent after:to-background max-landing-lg:h-[480px] max-landing-md:h-[360px]"
      >
        <OptimizedImage
          alt=""
          height={1024}
          priority
          src="/images/gen/suwa-hero-watercolor.png"
          style={{ height: "100%", aspectRatio: undefined, opacity: 0.98 }}
          width={1536}
        />
      </div>
    </section>
  );
}
