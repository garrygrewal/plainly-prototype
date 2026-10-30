import type { ButtonHTMLAttributes } from "react";

/**
 * Tinted Yes/No pill: dark olive with lime text for Yes, dark maroon with
 * pink text for No. The word is always there; the tint is a second cue.
 */
export function OutcomePill({
  side,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { side: "yes" | "no" }) {
  return (
    <button
      type="button"
      className={`pressable hit-area inline-flex h-9 min-w-16 items-center justify-center rounded-pill px-3.5 text-subhead font-medium ${
        side === "yes" ? "bg-yes-soft text-yes" : "bg-no-soft text-no"
      } ${className}`}
      {...props}
    >
      {children ?? (side === "yes" ? "Yes" : "No")}
    </button>
  );
}

/** Small neutral label, like "Stock" or "25x". */
export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex h-5 items-center rounded-[6px] bg-badge px-1.5 text-caption font-medium text-ink-2 ${className}`}>
      {children}
    </span>
  );
}

/** Lime/pink number with a sign, e.g. "+$12.40". Colour is the second cue, not the only one. */
export function Change({ value, children, className = "" }: { value: number; children: React.ReactNode; className?: string }) {
  const tone = value > 0.004 ? "text-positive" : value < -0.004 ? "text-negative" : "text-ink-2";
  return <span className={`num ${tone} ${className}`}>{children}</span>;
}
