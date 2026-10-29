"use client";

import { motion, useReducedMotion } from "motion/react";
import { shares, signedPct, signedUsd, usd } from "@/lib/format";
import { ifEndedNow, realized } from "@/lib/selectors";
import { useDemo } from "@/lib/store";
import { AnimatedNumber } from "./AnimatedNumber";
import type { MarketView } from "./hooks";
import { Arrow } from "./icons";

/** The user's live position: what it's worth, what they'd get, and the way out. */
export function PositionCard({ view }: { view: MarketView }) {
  const reduce = useReducedMotion();
  const open = useDemo((s) => s.openSheet);
  const { m, sim, position, status } = view;
  if (!position) return null;

  const h = position.holdings;
  const lines = (["yes", "no"] as const)
    .filter((s) => h[s] > 0)
    .map((s) => `${shares(h[s])} ${s === "yes" ? "Yes" : "No"} shares · ${s === "yes" ? m.yesLabel : m.noLabel}`);
  const up = position.pnl >= 0;
  const ended = m.kind === "live" && sim ? ifEndedNow(m, sim.game, h) : null;

  return (
    <motion.section
      aria-label="Your position"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="rounded-3xl border border-line bg-surface p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Your position</h2>
          {lines.map((l) => (
            <p key={l} className="num text-sm text-ink-2">
              {l}
            </p>
          ))}
        </div>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-ink-2">Demo money</span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-ink-3">Worth now</p>
          <AnimatedNumber value={position.worthNow} format={usd} className="text-[32px] font-semibold leading-tight tracking-tight" />
        </div>
        <p className="num mb-1 flex items-center gap-1 text-sm">
          <Arrow up={up} />
          <AnimatedNumber value={position.pnl} format={signedUsd} className="font-medium" />
          <span className="text-ink-2">({signedPct(position.pnlPct)})</span>
        </p>
      </div>
      <p className="num text-xs text-ink-3">You paid {usd(position.cost)}</p>

      <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
        {ended ? (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-ink-2">
              If it ended now
              <span className="block text-xs text-ink-3">{ended.line}</span>
            </dt>
            <dd className="num text-right font-medium">
              {ended.payout === null ? "Not settled yet" : `You’d get ${usd(ended.payout)}`}
            </dd>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-ink-2">If it settles</dt>
            <dd className="num text-right font-medium">
              Yes: {usd(position.payoutIfYes)} · No: {usd(position.payoutIfNo)}
            </dd>
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <dt className="text-ink-2">Most you can still lose</dt>
          <dd className="num text-right font-medium">{usd(position.cost)}</dd>
        </div>
      </dl>

      {status !== "final" && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-surface-2 p-3 pl-4">
          <p className="text-sm">
            <span className="block text-ink-2">Cash out now</span>
            <AnimatedNumber value={position.cashOut} format={usd} className="text-[17px] font-semibold" />
          </p>
          <button
            type="button"
            onClick={() => open({ kind: "cashout", marketId: m.id })}
            className="h-11 rounded-xl bg-ink px-4 text-[15px] font-semibold text-bg active:scale-[0.98]"
          >
            Cash out…
          </button>
        </div>
      )}
    </motion.section>
  );
}

/** Shown once a position is closed: what went in, what came back. */
export function ResultCard({ view }: { view: MarketView }) {
  const ledger = useDemo((s) => s.ledger);
  const r = realized(ledger, view.m.id);
  if (!r.any || view.position) return null;
  return (
    <section aria-label="Your result" className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="text-[15px] font-semibold tracking-tight">
        {r.settled ? "Your result" : "You cashed out"}
      </h2>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-ink-3">Put in</dt>
          <dd className="num font-medium">{usd(r.paid)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-3">Got back</dt>
          <dd className="num font-medium">{usd(r.got)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-3">{r.pnl >= 0 ? "Gain" : "Loss"}</dt>
          <dd className="num flex items-center gap-1 font-medium">
            <Arrow up={r.pnl >= 0} />
            {signedUsd(r.pnl)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
