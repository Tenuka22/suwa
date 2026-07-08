import type { ComponentProps } from "react";

interface WordmarkProps extends ComponentProps<"a"> {
  size?: "default" | "footer";
}

export function Wordmark({
  className = "",
  ...props
}: WordmarkProps) {
  return (
    <a
      className={`block leading-none ${className}`}
      {...props}
    >
      <img
        alt="Suwa"
        className="h-[34px] w-auto max-sm:h-[26px]"
        src="/logo.png"
      />
    </a>
  );
}
