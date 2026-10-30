"use client";

/**
 * An inline script that runs during HTML parsing (before first paint).
 * On the client it renders as inert text/plain, so React doesn't warn
 * about rendering a <script>; suppressHydrationWarning covers the swap.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
