import { ShieldCheck } from "lucide-react";
import { Appear } from "../animations/appear";
import { Button } from "./button";
import { SIGN_UP_URL } from "./sign-up-url";
import { Wordmark } from "./wordmark";

const navLinks = [
  { href: "#top", label: "Home", active: true },
  { href: "#how-it-works", label: "How it works" },
  { href: "#why-suwa", label: "Why Suwa" },
  { href: "#stories", label: "Stories" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  return (
    <Appear className="site-header" from="top">
      <header>
        <nav
          aria-label="Main navigation"
          className="page-shell grid h-[104px] grid-cols-2 landing-lg:grid-cols-[1fr_auto_1fr] items-center max-landing-lg:h-[86px] max-landing-md:h-[76px] max-landing-lg:justify-between"
        >
          <div className="justify-self-start">
            <Wordmark aria-label="Suwa home" href="#top" />
          </div>
          <div className="flex items-center justify-center gap-[clamp(24px,3vw,48px)] justify-self-center whitespace-nowrap text-[#172e29] text-[14px] max-landing-lg:hidden">
            {navLinks.map(({ active, href, label }) => (
              <a
                className={`relative pt-[9px] pb-[12px] after:absolute after:inset-x-0 after:bottom-[3px] after:h-px after:bg-accent after:transition-all after:duration-180 after:ease-default ${
                  active
                    ? "after:scale-x-100 after:opacity-100"
                    : "after:scale-x-60 after:opacity-0 hover:after:scale-x-100 hover:after:opacity-100"
                }`}
                href={href}
                key={label}
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center justify-end gap-[34px] justify-self-end whitespace-nowrap text-[13px]">
            <span className="flex items-center gap-[9px] max-landing-xl:hidden">
              <ShieldCheck aria-hidden="true" size={19} strokeWidth={1.7} />
              100% Connected
            </span>
            <Button href={SIGN_UP_URL} variant="headerCta">
              Join with us
            </Button>
          </div>
        </nav>
      </header>
    </Appear>
  );
}
