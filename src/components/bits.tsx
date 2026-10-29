"use client";

import Link from "next/link";
import type { MarketStatus } from "@/lib/selectors";
import { usd } from "@/lib/format";
import { AnimatedNumber } from "./AnimatedNumber";
import { useBalance } from "./hooks";
import { Arrow, ChevronLeft } from "./icons";
import { ThemeToggle } from "./ThemeToggle";

/** A screen inside the phone. Each one scrolls on its own, so scroll position survives navigation. */
export function Screen({ children }: { children: React.ReactNode }) {
  return <div className="no-scrollbar h-full overflow-y-auto overscroll-contain">{children}</div>;
}

export function TopBar({ back }: { back?: boolean }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 bg-bg/90 px-4 backdrop-blur">
      {back ? (
        <Link
          href="/"
          className="-ml-2 flex h-10 items-center gap-0.5 rounded-full pr-3 pl-1 text-[15px] font-medium text-ink"
        >
          <ChevronLeft />
          Markets
        </Link>
      ) : (
        <span className="text-[17px] font-semibold tracking-tight">Plainly</span>
      )}
      <div className="flex items-center gap-1">
        <BalancePill />
        <ThemeToggle />
      </div>
    </header>
  );
}

function BalancePill() {
  const balance = useBalance();
  return (
    <span className="flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-sm shadow-card">
      <span className="sr-only">Balance: {usd(balance)} in demo money</span>
      <span aria-hidden className="flex items-center gap-1.5">
        <span className="text-ink-3">Balance</span>
        <AnimatedNumber value={balance} format={usd} className="font-medium" />
      </span>
    </span>
  );
}

export function StatusBadge({
  status,
  when,
  clock,
}: {
  status: MarketStatus;
  when?: string;
  clock?: string;
}) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-live">
        <span aria-hidden className="relative flex size-2">
          <span className="absolute inset-0 rounded-full bg-live opacity-30 [transform:scale(1.9)]" />
          <span className="relative size-2 rounded-full bg-live" />
        </span>
        Live
        {clock && <span className="num font-normal text-ink-2">· {clock}</span>}
      </span>
    );
  }
  if (status === "final") {
    return <span className="text-[13px] font-medium text-ink-2">Final</span>;
  }
  if (status === "upcoming") {
    return <span className="text-[13px] text-ink-2">Starts {when ?? "soon"}</span>;
  }
  return <span className="text-[13px] text-ink-3">Open</span>;
}

/** "▲ 9 pts" with an arrow and sign, never colour alone. */
export function Delta({ pts, suffix }: { pts: number; suffix?: string }) {
  const r = Math.round(pts);
  if (r === 0) return <span className="text-sm text-ink-3">No change {suffix}</span>;
  return (
    <span className="num inline-flex items-center gap-1 text-sm text-ink-2">
      <Arrow up={r > 0} className="text-ink" />
      <span>
        {r > 0 ? "Up" : "Down"} {Math.abs(r)} {Math.abs(r) === 1 ? "pt" : "pts"} {suffix}
      </span>
    </span>
  );
}

export function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-[15px] font-semibold tracking-tight">
      {children}
    </h2>
  );
}
