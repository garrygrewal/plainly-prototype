import type { HTMLAttributes } from "react";

/*
 * Surfaces carry hierarchy by fill alone: no borders, no shadows.
 * Card: a section on the page. Tile: a stat or item in a grid.
 * Anything nested inside either uses `bg-surface-2`, never another card.
 */

export function Card({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`rounded-card bg-surface p-4 ${className}`} {...props} />;
}

export function Tile({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-tile bg-surface px-4 py-3 ${className}`} {...props} />;
}

/** A section header like "Tokens ›" / "Position": title 3, bold, optional trailing slot. */
export function SectionHeader({
  id,
  children,
  trailing,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <h2 id={id} className="text-title3 font-bold">
        {children}
      </h2>
      {trailing}
    </div>
  );
}
