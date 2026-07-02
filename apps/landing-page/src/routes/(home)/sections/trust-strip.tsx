import {
  BadgeCheck,
  HeartHandshake,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

const trustItems = [
  {
    description: "Start care privately, without making identity the focus.",
    icon: LockKeyhole,
    theme: "green",
    title: "Anonymous first",
  },
  {
    description: "Verified doctors add trust through sessions and profiles.",
    icon: BadgeCheck,
    theme: "peach",
    title: "Doctor backed care",
  },
  {
    description: "Choose chat, video, or in person care when ready.",
    icon: HeartHandshake,
    theme: "lavender",
    title: "Flexible consultation",
  },
  {
    description: "Clinics support care quietly in the background.",
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
      className="page-shell relative z-[4] grid max-w-[980px] grid-cols-2 gap-4 rounded-[24px] border border-[rgb(235_229_218_/_72%)] bg-[rgb(255_253_248_/_72%)] p-[26px] shadow-[0_14px_40px_rgb(52_66_59_/_3%)] backdrop-blur-[10px] max-md:grid-cols-1 max-md:p-[18px]"
    >
      {trustItems.map(({ description, icon: Icon, theme, title }) => (
        <article
          className="flex min-w-0 items-start gap-[18px] rounded-[18px] border border-border/70 bg-white/45 p-[22px] max-md:p-[18px]"
          key={title}
        >
          <span
            className={`grid size-[58px] flex-none place-items-center rounded-full shadow-[inset_0_0_0_6px_rgb(255_255_255_/_32%)] max-md:size-[52px] ${themeStyles[theme]}`}
          >
            <Icon aria-hidden="true" size={27} strokeWidth={1.55} />
          </span>
          <div>
            <h2 className="m-0 mb-[7px] font-sans font-semibold text-[17px] tracking-[-0.02em]">
              {title}
            </h2>
            <p className="m-0 max-w-[260px] text-[#4b5753] text-[14px] leading-[1.55] max-md:max-w-none">
              {description}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}
