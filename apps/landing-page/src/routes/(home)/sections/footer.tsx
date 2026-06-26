import { Wordmark } from "../helpers/wordmark";

export function Footer() {
  return (
    <footer className="pt-[68px] pb-[38px]">
      <div className="page-shell grid grid-cols-[1.1fr_auto_1fr] items-end gap-[50px] max-xl:grid-cols-[1fr_auto] max-xl:grid-cols-1 max-xl:gap-[31px]">
        <div>
          <Wordmark aria-label="Back to Suwa home" href="#top" size="footer" />
          <p className="mx-0 mt-[12px] mb-0 text-[10px] text-foreground-muted">
            Anonymous consultation, doctor support, and stigma-free care in one
            private path.
          </p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex gap-[28px] text-[11px] max-xl:flex-wrap max-xl:gap-[14px_23px]"
        >
          <a href="#how-it-works">How it works</a>
          <a href="#why-suwa">Why Suwa</a>
          <a href="#stories">Stories</a>
          <a href="#faq">FAQ</a>
        </nav>
        <p className="m-0 justify-self-end text-[10px] text-foreground-muted max-xl:col-span-2 max-xl:col-auto max-xl:justify-self-start">
          &copy; 2026 Suwa. Built for private care without stigma.
        </p>
      </div>
    </footer>
  );
}
