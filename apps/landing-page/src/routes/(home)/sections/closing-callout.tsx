import { ArrowRight, ShieldCheck } from "lucide-react";
import { Appear } from "../animations/appear";
import { SIGN_UP_URL } from "../helpers/sign-up-url";

export function ClosingCallout() {
  return (
    <Appear>
      <section
        className="page-shell max-w-[1335px] rounded-[30px] bg-[radial-gradient(circle_at_15%_100%,rgb(232_202_135_/_22%),transparent_34%),linear-gradient(110deg,#294a40,#3f6458)] pt-[72px] pr-[30px] pb-[77px] pl-[30px] text-center text-white max-landing-md:rounded-[22px] max-landing-md:pt-[58px] max-landing-md:pr-[22px] max-landing-md:pb-[61px] max-landing-md:pl-[22px]"
        id="about"
      >
        <ShieldCheck aria-hidden="true" size={31} strokeWidth={1.3} />
        <p className="mx-0 mt-[15px] mb-0 text-[12px] text-[rgb(255_255_255_/_72%)] uppercase tracking-[0.08em]">
          Your next step can be organized
        </p>
        <h2 className="mt-[11px] mb-[13px] font-normal font-serif text-[clamp(38px,4vw,54px)] text-white leading-[1.08] tracking-[-0.04em] max-landing-md:text-[39px]">
          Bring your hospital workflow together.
        </h2>
        <a
          className="mt-[17px] inline-flex items-center gap-[26px] rounded-full bg-white px-[22px] py-[14px] font-medium text-[12px] text-foreground shadow-[0_8px_24px_rgb(45_62_53_/_0.08)] transition-all duration-180 ease-default hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgb(34_64_56_/_20%)]"
          href={SIGN_UP_URL}
        >
          Open the hospital portal
          <ArrowRight aria-hidden="true" size={18} />
        </a>
      </section>
    </Appear>
  );
}
