import {
  BadgeCheck,
  HeartHandshake,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

const trustItems = [
  {
    description:
      "People can begin care without putting their identity at the center.",
    icon: LockKeyhole,
    theme: "green",
    title: "Anonymous first",
  },
  {
    description:
      "Doctors provide credible support through online sessions and profiles.",
    icon: BadgeCheck,
    theme: "peach",
    title: "Doctor-backed care",
  },
  {
    description:
      "Chat, video, and in-person paths let people choose their comfort level.",
    icon: HeartHandshake,
    theme: "lavender",
    title: "Flexible consultation",
  },
  {
    description:
      "Hospitals and clinics support the service without becoming the main story.",
    icon: ShieldCheck,
    theme: "gold",
    title: "Care infrastructure",
  },
] as const;

const themeStyles = {
  green: "text-[#42695d] bg-tint-green",
  peach: "text-[#b76f3f] bg-tint-beige",
  lavender: "text-[#8c78aa] bg-tint-purple",
  gold: "text-white bg-tint-yellow",
} as const;

export function TrustStrip() {
  return (
    <section
      aria-label="Why Suwa is useful"
      className="page-shell relative z-[4] grid min-h-[112px] max-w-[1335px] grid-cols-4 gap-3 rounded-xl border border-[rgb(235_229_218_/_72%)] bg-[rgb(255_253_248_/_68%)] p-[23px_32px] shadow-[0_14px_40px_rgb(52_66_59_/_3%)] backdrop-blur-[10px] max-landing-lg:grid-cols-2 max-landing-md:grid-cols-1 max-landing-lg:p-[24px] max-landing-md:p-[12px_19px]"
    >
      {trustItems.map(({ description, icon: Icon, theme, title }) => (
        <article
          className="flex min-w-0 items-center gap-[16px] border-border border-r px-[28px] py-4 first:pl-0 last:border-r-0 last:pr-0 max-landing-md:border-border max-landing-md:border-r-0 max-landing-md:border-b max-landing-lg:px-[22px] max-landing-md:px-0 max-landing-xl:px-[18px] max-landing-md:[&:first-child]:px-0 max-landing-lg:[&:first-child]:pl-[22px] max-landing-xl:[&:first-child]:pl-0 max-landing-md:[&:last-child]:border-b-0 max-landing-md:[&:last-child]:px-0 max-landing-lg:[&:last-child]:pr-[22px] max-landing-xl:[&:last-child]:pr-0 max-landing-lg:[&:nth-child(-n+2)]:border-border max-landing-lg:[&:nth-child(-n+2)]:border-b max-landing-lg:[&:nth-child(2)]:border-r-0"
          key={title}
        >
          <span
            className={`grid size-[57px] flex-none place-items-center rounded-full shadow-[inset_0_0_0_6px_rgb(255_255_255_/_32%)] max-landing-xl:size-[50px] ${themeStyles[theme]}`}
          >
            <Icon aria-hidden="true" size={27} strokeWidth={1.55} />
          </span>
          <div>
            <h2 className="m-0 mb-[4px] font-sans font-semibold text-[13px] tracking-[-0.01em]">
              {title}
            </h2>
            <p className="m-0 max-w-[190px] text-[#4b5753] text-[11.5px] leading-[1.65] max-landing-md:max-w-none">
              {description}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}
