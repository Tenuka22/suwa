import { ArrowRight, ChevronRight, ShieldCheck } from "lucide-react";
import { SectionNumber, TextLink } from "../helpers/section-heading";
import { SIGN_UP_URL } from "../helpers/sign-up-url";

export function Services() {
  return (
    <section
      aria-label="Suwa services"
      className="page-shell grid max-w-[1335px] grid-cols-2 gap-[62px] border-border border-t pt-[48px] pb-[95px] max-landing-lg:grid-cols-1 max-landing-lg:gap-[46px] max-landing-xl:gap-[36px] max-landing-md:pt-[50px] max-landing-md:pb-[70px]"
    >
      <article
        className="grid min-w-0 grid-cols-[220px_1fr] items-center gap-[38px] max-landing-lg:grid-cols-[240px_1fr] max-landing-md:grid-cols-1 max-landing-xl:grid-cols-[180px_1fr] max-landing-md:gap-[25px] max-landing-xl:gap-[24px]"
        id="hospital-management"
      >
        <div className="self-center max-landing-md:max-w-[300px]">
          <SectionNumber>01</SectionNumber>
          <h2 className="m-0 mb-[12px] font-normal font-serif text-[25px] tracking-[-0.03em]">
            Hospital management
          </h2>
          <p className="m-0 text-[#31423d] text-[13px] leading-[1.65]">
            Register hospitals, configure clinics, and keep operational details
            organized.
          </p>
          <TextLink href={SIGN_UP_URL}>
            Register a hospital
            <ArrowRight
              aria-hidden="true"
              className="transition-transform duration-160 ease-default group-hover:translate-x-1"
              size={18}
            />
          </TextLink>
        </div>

        <section
          aria-label="Hospital management preview"
          className="relative h-[242px] overflow-hidden rounded-[15px] border border-[rgb(225_218_208_/_72%)] bg-[linear-gradient(38deg,transparent_44%,rgb(242_208_174_/_70%)_45%_63%,transparent_64%)_100%_0_/_74%_85%_no-repeat,linear-gradient(134deg,rgb(218_227_215_/_74%),transparent_43%),#f8f5ed] shadow-[0_5px_18px_rgb(57_67_61_/_7%)] max-landing-lg:h-[280px] max-landing-md:h-[250px]"
        >
          <span className="absolute top-[13px] right-[16px] z-[2] flex items-center gap-[5px] rounded-full bg-[rgb(240_240_227_/_84%)] px-[11px] py-[6px] text-[8px]">
            <ShieldCheck aria-hidden="true" size={12} />
            Operations
          </span>
          <div className="absolute right-[37px] -bottom-[22px] z-[3] min-h-[188px] w-[258px] rounded-[15px] border border-[rgb(228_222_212_/_82%)] bg-[rgb(255_253_248_/_88%)] p-[20px] shadow-[0_8px_20px_rgb(62_69_64_/_10%)] backdrop-blur-[8px] max-landing-md:right-[18px] max-landing-xl:right-[18px] max-landing-md:w-[min(258px,calc(100%-36px))]">
            <h3 className="m-0 font-normal font-serif text-[24px] leading-[1.05] tracking-[-0.035em]">
              Manage care teams.
              <br />
              Keep everything in sync.
            </h3>
            <a
              className="mt-[20px] flex h-[36px] items-center justify-between rounded-full bg-[#426156] px-[22px] pr-[7px] pl-[22px] text-[9px] text-white"
              href={SIGN_UP_URL}
            >
              Open the hospital portal
              <span className="box-content rounded-full bg-white p-[5px] text-foreground">
                <ChevronRight aria-hidden="true" size={15} />
              </span>
            </a>
            <p className="mx-0 mt-[8px] mb-0 flex items-center gap-[7px] text-[8px]">
              <ShieldCheck aria-hidden="true" size={13} />
              Hospitals, doctors, and attendance stay connected.
            </p>
          </div>
        </section>
      </article>

      <article
        className="grid min-w-0 grid-cols-[220px_1fr] items-center gap-[38px] max-landing-lg:grid-cols-[240px_1fr] max-landing-md:grid-cols-1 max-landing-xl:grid-cols-[180px_1fr] max-landing-md:gap-[25px] max-landing-xl:gap-[24px]"
        id="library"
      >
        <div className="self-center max-landing-md:max-w-[300px]">
          <SectionNumber>02</SectionNumber>
          <h2 className="m-0 mb-[12px] font-normal font-serif text-[25px] tracking-[-0.03em]">
            Doctor profiles
          </h2>
          <p className="m-0 text-[#31423d] text-[13px] leading-[1.65]">
            Store specialties, education, languages, focus areas, and care
            modes.
          </p>
          <TextLink href="#about">
            Explore doctors
            <ArrowRight
              aria-hidden="true"
              className="transition-transform duration-160 ease-default group-hover:translate-x-1"
              size={18}
            />
          </TextLink>
        </div>

        <section
          aria-label="Doctor profile preview"
          className="relative h-[242px] overflow-hidden rounded-[15px] border border-[rgb(225_218_208_/_72%)] bg-[radial-gradient(ellipse_at_97%_62%,#ead0b6_0_26%,transparent_26.5%),radial-gradient(ellipse_at_78%_100%,rgb(223_207_187_/_70%)_0_24%,transparent_24.5%),linear-gradient(134deg,#fffdf8,#f5f0e7)] px-[24px] pt-[62px] pb-[22px] shadow-[0_5px_18px_rgb(57_67_61_/_7%)] max-landing-lg:h-[280px] max-landing-md:h-[250px]"
        >
          <span className="absolute top-[13px] right-[16px] z-[2] flex items-center gap-[5px] rounded-full bg-[rgb(253_237_220_/_82%)] px-[11px] py-[6px] text-[#a96940] text-[8px]">
            <ShieldCheck aria-hidden="true" size={12} />
            Verified
          </span>

          <div className="absolute inset-x-[22px] top-[48px] bottom-[22px] grid gap-[10px]">
            <div className="rounded-[18px] border border-[rgb(226_219_208_/_86%)] bg-[rgb(255_255_255_/_78%)] px-[16px] py-[14px] shadow-[0_10px_26px_rgb(61_72_64_/_8%)] backdrop-blur-[8px]">
              <div className="flex items-start justify-between gap-[12px]">
                <div>
                  <h3 className="m-0 font-normal font-serif text-[22px] leading-[1.05] tracking-[-0.03em]">
                    Dr. A. Silva
                  </h3>
                  <p className="m-0 mt-[4px] text-[10px] text-foreground-muted uppercase tracking-[0.08em]">
                    Psychiatry · English · Video
                  </p>
                </div>
                <span className="rounded-full bg-[#426156] px-[9px] py-[5px] text-[8px] text-white">
                  Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-[10px]">
              <div className="rounded-[18px] border border-[rgb(226_219_208_/_86%)] bg-[rgb(255_255_255_/_72%)] px-[14px] py-[13px] shadow-[0_8px_20px_rgb(61_72_64_/_7%)] backdrop-blur-[8px]">
                <p className="m-0 text-[9px] text-foreground-muted uppercase tracking-[0.08em]">
                  Focus areas
                </p>
                <p className="mt-[7px] mb-0 font-medium text-[12px] text-foreground leading-[1.4]">
                  Stress, sleep, burnout
                </p>
              </div>
              <div className="rounded-[18px] border border-[rgb(226_219_208_/_86%)] bg-[rgb(255_255_255_/_72%)] px-[14px] py-[13px] shadow-[0_8px_20px_rgb(61_72_64_/_7%)] backdrop-blur-[8px]">
                <p className="m-0 text-[9px] text-foreground-muted uppercase tracking-[0.08em]">
                  Availability
                </p>
                <p className="mt-[7px] mb-0 font-medium text-[12px] text-foreground leading-[1.4]">
                  Mon - Fri, 9 AM - 5 PM
                </p>
              </div>
            </div>

            <div className="rounded-[18px] border border-[rgb(226_219_208_/_86%)] bg-[rgb(255_255_255_/_82%)] px-[14px] py-[13px] shadow-[0_8px_20px_rgb(61_72_64_/_7%)] backdrop-blur-[8px]">
              <div className="flex items-center justify-between gap-[12px]">
                <div>
                  <p className="m-0 text-[9px] text-foreground-muted uppercase tracking-[0.08em]">
                    Profile completeness
                  </p>
                  <p className="mt-[7px] mb-0 font-medium text-[12px] text-foreground">
                    Education, language, and approach ready
                  </p>
                </div>
                <span className="rounded-full bg-[#a96940]/15 px-[10px] py-[5px] text-[8px] text-[#a96940]">
                  92%
                </span>
              </div>
            </div>
          </div>
        </section>
      </article>
    </section>
  );
}
