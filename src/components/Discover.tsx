"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { MARKETS } from "@/lib/data/markets";
import type { Market } from "@/lib/data/types";
import { hockeyClock, likelihoodWord, signedUsd, usd } from "@/lib/format";
import { scoreLine } from "@/lib/selectors";
import { useDemo } from "@/lib/store";
import { AnimatedNumber } from "./AnimatedNumber";
import { Screen } from "./bits";
import { useBalance, useMarketView, usePortfolio } from "./hooks";
import { ChevronRight, Search, Settled } from "./icons";
import { MarketIcon } from "./MarketIcon";
import { ThemeToggle } from "./ThemeToggle";
import { NavBar } from "./ui/NavBar";
import { Change, OutcomePill } from "./ui/Pill";
import { TabBar } from "./ui/TabBar";
import { toast } from "./ui/Toast";

type Filter = "all" | "following" | "live";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "following", label: "Following" },
  { key: "live", label: "Live" },
];

export function Discover() {
  const [filter, setFilter] = useState<Filter>("all");
  const reduce = useReducedMotion();
  const sims = useDemo((s) => s.sims);
  const isLive = (m: Market) => m.kind === "live" && !sims[m.id]?.resolved;
  const shown = MARKETS.filter((m) =>
    filter === "following" ? m.followed : filter === "live" ? isLive(m) : true,
  );

  return (
    <Screen>
      <NavBar
        title="Predictions"
        trailing={
          <>
            <button
              type="button"
              onClick={() => toast("Search isn’t part of this prototype")}
              aria-label="Search markets"
              className="hit-area pressable grid size-9 place-items-center text-ink"
            >
              <Search size={22} />
            </button>
            <ThemeToggle />
          </>
        }
      />

      {/* Text tabs with a sliding underline, like the host app's category tabs. */}
      <LayoutGroup>
        <div role="group" aria-label="Filter markets" className="sticky top-11 z-10 flex gap-6 bg-bg/85 px-4 backdrop-blur-xl">
          {FILTERS.map(({ key, label }) => {
            const on = filter === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(key)}
                className={`relative h-11 text-subhead font-medium transition-colors ${on ? "text-ink" : "text-ink-2"}`}
              >
                {label}
                {on && (
                  <motion.span
                    layoutId="feed-tab"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                    className="absolute inset-x-0 bottom-1.5 h-0.5 rounded-full bg-ink"
                  />
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <main className="px-4 pt-3 pb-6">
        <BalanceRow />

        {filter === "following" && (
          <p className="mt-4 text-footnote text-ink-2">Markets about the team you follow, the Harbourview Gulls.</p>
        )}

        <ul aria-label="Markets" className="mt-3 space-y-3">
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
            <li className="rounded-card bg-surface p-6 text-center text-subhead text-ink-2">
              No games are live right now. Replay the demo to watch again.
            </li>
          )}
        </ul>

        <Link
          href="/about"
          className="pressable mt-6 flex min-h-11 items-center justify-between gap-3 rounded-card bg-surface px-4 py-3"
        >
          <span>
            <span className="block text-body font-semibold">About this concept</span>
            <span className="block text-footnote text-ink-2">Why it looks like this, and what I’d test next</span>
          </span>
          <ChevronRight className="text-ink-3" />
        </Link>
      </main>

      <TabBar />
    </Screen>
  );
}

/** Demo balance, plus what's riding on open positions. */
function BalanceRow() {
  const balance = useBalance();
  const { worth, pnl, count } = usePortfolio();
  return (
    <section aria-label="Your demo money" className="flex items-end justify-between gap-3 px-1 py-2">
      <div>
        <p className="text-footnote text-ink-2">Demo balance</p>
        <AnimatedNumber value={balance} format={usd} className="text-title2 font-semibold" />
      </div>
      {count > 0 && (
        <div className="text-right">
          <p className="text-footnote text-ink-2">
            In {count} {count === 1 ? "prediction" : "predictions"}
          </p>
          <p className="num text-subhead">
            {usd(worth)}{" "}
            <Change value={pnl}>{signedUsd(pnl)}</Change>
          </p>
        </div>
      )}
    </section>
  );
}

function MarketCard({ id }: { id: string }) {
  const { m, sim, pYes, status, position } = useMarketView(id);
  const live = m.kind === "live" ? m : null;
  const open = useDemo((s) => s.openSheet);
  const settled = status === "final" && sim?.resolved;

  let meta: React.ReactNode;
  if (live && sim && status === "live") {
    meta = (
      <>
        <span className="inline-flex items-center gap-1.5 font-medium text-live">
          <span aria-hidden className="size-1.5 rounded-full bg-live" />
          Live
        </span>
        <span aria-hidden>·</span>
        <span>{scoreLine(live, sim.game)}</span>
        <span aria-hidden>·</span>
        <span>{hockeyClock(sim.game.elapsed)}</span>
      </>
    );
  } else if (live && sim) {
    meta = <span>Final · {scoreLine(live, sim.game)}</span>;
  } else if (m.kind === "static" && m.status === "upcoming") {
    meta = <span>Starts {m.when}</span>;
  } else {
    meta = <span>${(m.volume / 1000).toFixed(1)}k traded</span>;
  }

  return (
    <article className="relative rounded-card bg-surface p-4">
      <div className="flex items-start gap-3">
        <MarketIcon m={m} />
        <div className="min-w-0 flex-1">
          {/* The title's link covers the whole card; the pills sit above it. */}
          <h2 className="text-body font-semibold text-pretty">
            <Link href={`/m/${m.id}`} className="after:absolute after:inset-0 after:rounded-card">
              {m.question}
            </Link>
          </h2>
          <p className="num mt-0.5 flex flex-wrap items-center gap-x-1.5 text-footnote text-ink-2">{meta}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-subhead">{m.yesLabel}</p>
          {settled ? (
            <p className="flex items-center gap-1 text-footnote text-ink-2">
              <Settled size={14} /> Settled: {sim.resolved === "yes" ? m.yesLabel : m.noLabel}
            </p>
          ) : (
            <p className="num text-footnote text-ink-2">
              {likelihoodWord(pYes)} · <AnimatedNumber value={pYes * 100} format={(v) => `${Math.round(v)}%`} />
            </p>
          )}
        </div>
        {!settled && (
          <div className="relative z-10 flex gap-2">
            <OutcomePill
              side="yes"
              aria-label={`Buy Yes: ${m.yesLabel}`}
              onClick={() => open({ kind: "trade", marketId: m.id, side: "yes" })}
            />
            <OutcomePill
              side="no"
              aria-label={`Buy No: ${m.noLabel}`}
              onClick={() => open({ kind: "trade", marketId: m.id, side: "no" })}
            />
          </div>
        )}
      </div>

      {(position || m.followed) && (
        <div className="mt-3 flex items-center justify-between gap-3 text-footnote text-ink-2">
          <span>{m.followed ? "Following" : ""}</span>
          {position && (
            <span className="num">
              Your position <Change value={position.pnl}>{signedUsd(position.pnl)}</Change>
            </span>
          )}
        </div>
      )}
    </article>
  );
}
