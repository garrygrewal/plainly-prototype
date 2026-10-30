import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "yes" | "no" | "plain";
type Size = "lg" | "md" | "sm";

const variants: Record<Variant, string> = {
  // White on dark (black on light): the one main action on a screen.
  primary: "bg-primary text-on-primary",
  secondary: "bg-surface-2 text-ink",
  yes: "bg-yes-soft text-yes",
  no: "bg-no-soft text-no",
  plain: "bg-transparent text-ink-2",
};

const sizes: Record<Size, string> = {
  lg: "h-[50px] rounded-tile px-5 text-body font-semibold",
  md: "h-11 rounded-tile px-4 text-subhead font-semibold",
  // Visually compact, but the hit area still reaches 44pt.
  sm: "hit-area h-9 rounded-pill px-3.5 text-subhead font-medium",
};

export function buttonClass(variant: Variant = "primary", size: Size = "lg", full = false) {
  return `pressable inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${full ? "w-full" : ""}`;
}

export function Button({
  variant = "primary",
  size = "lg",
  full = false,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; full?: boolean }) {
  return <button type={type} className={`${buttonClass(variant, size, full)} ${className}`} {...props} />;
}
