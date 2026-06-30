import { ShieldCheck } from "lucide-react";
import { Appear } from "../animations/appear";
import { Button } from "./button";
import { SIGN_UP_URL } from "./sign-up-url";
import { Wordmark } from "./wordmark";

const navLinks = [
  { href: "#top", label: "Home", active: true },
  { href: "#why-suwa", label: "Why Suwa" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#stories", label: "Stories" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  return (
    <Appear className="site-header" from="top">
      <header>
<nav
          aria-label="Main navigation"
          className="page-shell grid grid-cols-[1fr_auto_1fr] items-center py-[28px] max-xl:grid-cols-2 max-xl:justify-between max-xl:py-[22px] max-sm:py-[17px]"
        >
          <div className="justify-self-start">
            <Wordmark aria-label="Suwa home" href="#top" />
          </div>
          <div className="flex items-center justify-center gap-[clamp(24px,3vw,48px)] justify-self-center whitespace-nowrap text-[#172e29] text-[14px] max-xl:hidden">
            {navLinks.map(({ active, href, label }) => (
              <a
                className={`relative cursor-pointer pt-[9px] pb-[12px] after:absolute after:inset-x-0 after:bottom-[3px] after:h-px after:bg-accent after:transition-all after:duration-180 after:ease-default ${
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
          <div className="flex items-center justify-end gap-[34px] justify-self-end whitespace-nowrap text-[13px] max-xl:hidden">
            <span className="flex items-center gap-[9px]">
              <ShieldCheck aria-hidden="true" size={19} strokeWidth={1.7} />
              Private by design
            </span>
            <Button href={SIGN_UP_URL} variant="headerCta">
              Our app platform
            </Button>
          </div>
          <div className="justify-self-end max-xl:flex max-xl:items-center max-xl:gap-[12px] max-sm:gap-[8px] xl:hidden">
            <Button href={SIGN_UP_URL} variant="headerCta">
              Our app platform
            </Button>
          </div>
        </nav>
      </header>
    </Appear>
  );
}
