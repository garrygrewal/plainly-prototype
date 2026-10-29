"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { MARKETS } from "@/lib/data/markets";
import type { Market } from "@/lib/data/types";
import { hockeyClock, likelihoodWord, signedUsd } from "@/lib/format";
import { scoreLine } from "@/lib/selectors";
import { useDemo } from "@/lib/store";
import { AnimatedNumber } from "./AnimatedNumber";
import { Screen, StatusBadge, TopBar } from "./bits";
import { useMarketView } from "./hooks";
import { Sparkline } from "./Sparkline";

type Filter = "all" | "following" | "live";

export function Discover() {
  const [filter, setFilter] = useState<Filter>("all");
  const reduce = useReducedMotion();
  const sims = useDemo((s) => s.sims);
  const isLive = (m: Market) => m.kind === "live" && !sims[m.id]?.resolved;

  const counts = {
    all: MARKETS.length,
    following: MARKETS.filter((m) => m.followed).length,
    live: MARKETS.filter(isLive).length,
  };
  const shown = MARKETS.filter((m) =>
    filter === "following" ? m.followed : filter === "live" ? isLive(m) : true,
  );

  return (
    <Screen>
      <TopBar />
      <main className="px-4 pb-10">
        <div className="mb-5 rounded-2xl bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-ink-2 lg:hidden">
          A concept for prediction markets that explain themselves. Demo money
          only.{" "}
          <Link href="/about" className="font-medium text-ink underline underline-offset-2">
            Read the case study
          </Link>
        </div>

        <h1 className="text-[28px] font-semibold tracking-tight">Markets</h1>
        <p className="mt-0.5 text-[15px] text-ink-2">Tonight’s games, and a few other questions.</p>

        <div role="group" aria-label="Filter markets" className="mt-4 flex gap-2">
          {(["all", "following", "live"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`num h-9 rounded-full px-3.5 text-sm font-medium transition-colors ${
                filter === f ? "bg-ink text-bg" : "bg-surface text-ink-2 shadow-card hover:text-ink"
              }`}
            >
              {f === "all" ? "All" : f === "following" ? "Following" : "Live"}
              <span className={filter === f ? "ml-1.5 opacity-70" : "ml-1.5 text-ink-3"}>{counts[f]}</span>
            </button>
          ))}
        </div>
        {filter === "following" && (
          <p className="mt-3 text-[13px] text-ink-3">Markets about the team you follow: the Harbourview Gulls.</p>
        )}

        <ul aria-label="Markets" className="mt-4 space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((m) => (
              <motion.li
                key={m.id}
                layout={!reduce}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              >
                <MarketCard id={m.id} />
              </motion.li>
            ))}
          </AnimatePresence>
          {shown.length === 0 && (
            <li className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-ink-2">
              No games are live right now. Press replay in the demo controls to start again.
            </li>
          )}
        </ul>

        <Link
          href="/about"
          className="mt-8 block rounded-3xl border border-line p-5 text-[15px] hover:bg-surface"
        >
          <span className="font-semibold">Why it looks like this →</span>
          <span className="mt-1 block text-sm text-ink-2">
            The problem, the design principles, and what I’d test next.
          </span>
        </Link>
      </main>
    </Screen>
  );
}

function MarketCard({ id }: { id: string }) {
  const { m, sim, pYes, history, status, position } = useMarketView(id);
  const live = m.kind === "live" ? m : null;
  const settled = status === "final" && sim?.resolved;

  return (
    <Link
      href={`/m/${m.id}`}
      className="block rounded-3xl border border-line bg-surface p-4 shadow-card transition-transform active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] text-ink-3">{m.category}</span>
        <span className="shrink-0">
          <StatusBadge status={status} when={m.kind === "static" ? m.when : undefined} />
        </span>
      </div>

      <h2 className="mt-1.5 text-[17px] font-semibold leading-snug tracking-tight text-pretty">{m.question}</h2>
      {live && sim && (
        <p className="num mt-0.5 text-[13px] text-ink-2">
          {scoreLine(live, sim.game)}
          {status === "live" && ` · ${hockeyClock(sim.game.elapsed)}`}
        </p>
      )}

      <div className="mt-3 flex items-end justify-between gap-3">
        {settled ? (
          <p className="text-[15px]">
            <span className="font-semibold">Settled: {sim.resolved === "yes" ? m.yesLabel : m.noLabel}</span>
          </p>
        ) : (
          <p className="min-w-0">
            <span className="block text-[13px] text-ink-2">{m.yesLabel}</span>
            <span className="text-[22px] font-semibold tracking-tight">
              {likelihoodWord(pYes)}:{" "}
              <AnimatedNumber value={pYes * 100} format={(v) => `${Math.round(v)}%`} />
            </span>
            <span className="sr-only">
              {" "}
              chance of {m.yesLabel}
            </span>
          </p>
        )}
        <Sparkline points={history} domain={live ? [0, 3600] : [0, history.length - 1]} />
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs text-ink-3">
        <span className="num">${(m.volume / 1000).toFixed(1)}k traded</span>
        {m.followed && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-ink-2">Following</span>
        )}
        {position && (
          <span className="num ml-auto rounded-full bg-surface-2 px-2 py-0.5 font-medium text-ink">
            Your position: {signedUsd(position.pnl)}
          </span>
        )}
      </div>
    </Link>
  );
}
