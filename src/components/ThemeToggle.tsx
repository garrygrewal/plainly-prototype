"use client";

import { Moon, Sun } from "./icons";

/** Flips between light and dark. Starts from the system setting. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const current =
      root.getAttribute("data-theme") ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch light or dark theme"
      className={`grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink ${className}`}
    >
      {/* Both icons render; CSS shows the one that matches the theme. */}
      <Moon className="block dark-hide" />
      <Sun className="hidden dark-show" />
    </button>
  );
}
