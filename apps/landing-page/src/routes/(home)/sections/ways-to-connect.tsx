import { MapPin, MessageSquare, Video } from "lucide-react";
import { Appear } from "../animations/appear";
import { SectionHeading } from "../helpers/section-heading";

const connectModes = [
  {
    description:
      "Message back and forth on your schedule. No rush, no pressure.",
    icon: MessageSquare,
    title: "Chat",
  },
  {
    description: "Face to face from wherever you are. Same care, less travel.",
    icon: Video,
    title: "Video",
  },
  {
    description: "Meet in person when you need that extra layer of connection.",
    icon: MapPin,
    title: "In person",
  },
] as const;

const iconStyles = [
  "bg-[#e8f0ec] text-[#42695d]",
  "bg-[#f5ebe6] text-[#b76f3f]",
  "bg-[#eeeaf5] text-[#8c78aa]",
] as const;

export function WaysToConnect() {
  return (
    <Appear>
      <section
        className="bg-background pt-[92px] pb-[100px] max-xl:pt-[72px]"
        id="ways-to-connect"
      >
        <div className="page-shell">
          <SectionHeading
            description="Every session is built around anonymity, so you can focus on what matters."
            eyebrow="Flexible by design"
            title="Choose how you connect."
          />
          <div className="mx-auto flex flex-row flex-wrap gap-8 items-center justify-center">
            {connectModes.map(({ description, icon: Icon, title }, i) => (
              <article
                className="min-h-[220px] rounded-[24px] border border-[rgb(225_224_210_/_80%)] bg-[rgb(255_253_248_/_75%)] p-[36px] max-xl:p-[26px]"
                key={title}
              >
                <span
                  className={`mb-[22px] grid size-[52px] place-items-center rounded-full ${iconStyles[i]}`}
                >
                  <Icon aria-hidden="true" size={26} strokeWidth={1.4} />
                </span>
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
