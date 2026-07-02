import { ArrowUpRight } from "lucide-react";
import { Appear } from "../animations/appear";

const team = [
  {
    name: "Hesandu Linal",
    avatarSeed: "/hesandu.jpeg",
    href: undefined,
    role: "Team Leader",
    stack: ["Entrepreneur", "n8n", "AI Engineer"],
  },
  {
    name: "Tenuka Omaljith",
    avatarSeed: "https://avatars.githubusercontent.com/u/135237290",
    href: "https://github.com/Tenuka22/",
    role: "Lead developer",
    stack: ["Website projects", "Rust", "Scalable apps"],
  },
  {
    name: "Sethun Thunder",
    avatarSeed: "/sethun.png",
    href: "https://github.com/sethunthunder111",
    role: "Web developer",
    stack: ["Entrepreneurship", "Open source", "Project shipping"],
  },
  {
    name: "Pasindu Mihiranga",
    avatarSeed: "/pasindu.jpeg",
    href: undefined,
    role: "Designer",
    stack: ["Python", "IoT", "Automation"],
  },
  {
    name: "Kavija Anusara",
    avatarSeed: "/kavija.jpeg",
    href: undefined,
    role: "IOT developer",
    stack: ["Python", "Website", "IoT"],
  },
] as const;

function avatarUrl(seed: string): string {
  if (seed.startsWith("/")) {
    return seed;
  }
  if (seed.startsWith("https://avatars.githubusercontent.com/")) {
    return seed;
  }
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f5ecd8,e2eae5,ece6f2&radius=50`;
}

export function Team() {
  return (
    <Appear>
      <section className="page-shell py-[96px] max-xl:py-[76px]" id="team">
        <div className="mx-auto max-w-[1120px]">
          <div className="mx-auto mb-[34px] max-w-[660px] text-center">
            <span className="block font-medium text-[12px] text-accent uppercase tracking-[0.12em]">
              Our team
            </span>
            <h2 className="mt-[12px] mb-[14px] font-normal font-serif text-[clamp(38px,4vw,54px)] leading-[1.08] tracking-[-0.04em]">
              The people building Suwa.
            </h2>
            <p className="m-0 text-[14px] text-foreground-muted leading-[1.8]">
              A small team focused on privacy, practical workflows, and helpful
              care experiences.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-[18px]">
            {team.map((member) => (
              <article
                className="max-w-[360px] flex-[1_1_300px] min-w-[280px] rounded-[22px] border border-border bg-[rgb(255_253_248_/_80%)] p-[20px] text-center shadow-[0_12px_30px_rgb(52_66_59_/_5%)]"
                key={member.name}
              >
                <div className="flex justify-center">
                  <img
                    alt={member.name}
                    className="size-[84px] rounded-full border border-border bg-background-subtle object-cover"
                    src={avatarUrl(member.avatarSeed)}
                  />
                </div>
                <h3 className="mt-[14px] mb-[6px] font-normal font-serif text-[22px] leading-[1.05] tracking-[-0.03em]">
                  {member.name}
                </h3>
                <p className="m-0 text-[11px] uppercase tracking-[0.08em] text-accent">
                  {member.role}
                </p>
                <div className="mt-[14px] flex flex-wrap justify-center gap-[8px]">
                  {member.stack.map((tag) => (
                    <span
                      className="rounded-full bg-[#edf2ed] px-[10px] py-[5px] text-[10px] text-[#31423d]"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {member.href ? (
                  <a
                    className="mt-[16px] inline-flex items-center gap-[8px] font-medium text-[12px] text-accent"
                    href={member.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View GitHub
                    <ArrowUpRight aria-hidden="true" size={15} />
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </Appear>
  );
}
