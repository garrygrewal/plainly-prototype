"use client";

import { Moon, Sun } from "./icons";

/** Flips between dark (the default) and light. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    if (next === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch light or dark theme"
      className={`hit-area pressable grid size-9 place-items-center rounded-full text-ink-2 hover:text-ink ${className}`}
    >
      {/* Both icons render; CSS shows the one that matches the theme. */}
      <Moon className="block dark-hide" />
      <Sun className="hidden dark-show" />
    </button>
  );
}
