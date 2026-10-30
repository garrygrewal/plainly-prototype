"use client";

import { motion, useReducedMotion } from "motion/react";
import { shares, signedPct, signedUsd, usd } from "@/lib/format";
import { ifEndedNow, realized } from "@/lib/selectors";
import { useDemo } from "@/lib/store";
import { AnimatedNumber } from "./AnimatedNumber";
import type { MarketView } from "./hooks";
import { Arrow } from "./icons";
import { Button } from "./ui/Button";
import { Change } from "./ui/Pill";
import { SectionHeader, Tile } from "./ui/Surface";

/** A stat tile like the ones on a perps position: label, value, quiet sub-line. */
function Stat({
  label,
  value,
  sub,
  small = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  /** For three-across rows, where title-size numbers won't fit. */
  small?: boolean;
}) {
  return (
    <Tile className="min-w-0">
      <dt className="text-footnote text-ink-2">{label}</dt>
      <dd className={`num mt-0.5 truncate font-semibold ${small ? "text-body" : "text-title3"}`}>{value}</dd>
      {sub && <dd className="num truncate text-footnote text-ink-3">{sub}</dd>}
    </Tile>
  );
}

/** The user's live position: what it's worth, what they'd get, and the way out. */
export function PositionCard({ view }: { view: MarketView }) {
  const reduce = useReducedMotion();
  const open = useDemo((s) => s.openSheet);
  const { m, sim, position, status } = view;
  if (!position) return null;

  const h = position.holdings;
  const held = (["yes", "no"] as const)
    .filter((s) => h[s] > 0)
    .map((s) => `${shares(h[s])} ${s === "yes" ? "Yes" : "No"} shares · ${s === "yes" ? m.yesLabel : m.noLabel}`)
    .join(", ");
  const ended = m.kind === "live" && sim ? ifEndedNow(m, sim.game, h) : null;

  return (
    <motion.section
      aria-labelledby="pos-title"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="space-y-3"
    >
      <div>
        <SectionHeader id="pos-title">Your position</SectionHeader>
        <p className="num text-footnote text-ink-2">{held}</p>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <Stat
          label="Worth now"
          value={<AnimatedNumber value={position.worthNow} format={usd} />}
          sub={`You paid ${usd(position.cost)}`}
        />
        <Stat
          label="P&L"
          value={
            <Change value={position.pnl} className="inline-flex items-center gap-1">
              <Arrow up={position.pnl >= 0} />
              <AnimatedNumber value={position.pnl} format={signedUsd} />
            </Change>
          }
          sub={signedPct(position.pnlPct)}
        />
        {ended ? (
          <Stat
            label="If it ended now"
            value={ended.payout === null ? "Overtime" : usd(ended.payout)}
            sub={ended.payout === null ? ended.line.replace(", so it would go to overtime.", "") : ended.line}
          />
        ) : (
          <Stat
            label="If it settles Yes"
            value={usd(position.payoutIfYes)}
            sub={`If No: ${usd(position.payoutIfNo)}`}
          />
        )}
        <Stat label="Most you can lose" value={usd(position.cost)} sub="What you put in" />
      </dl>

      {status !== "final" && (
        <Tile className="flex items-center justify-between gap-3">
          <p>
            <span className="block text-footnote text-ink-2">Cash out now</span>
            <AnimatedNumber value={position.cashOut} format={usd} className="text-body font-semibold" />
          </p>
          <Button variant="secondary" size="md" onClick={() => open({ kind: "cashout", marketId: m.id })}>
            Cash out
          </Button>
        </Tile>
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
    <section aria-labelledby="result-title" className="space-y-3">
      <SectionHeader id="result-title">{r.settled ? "Your result" : "You cashed out"}</SectionHeader>
      <dl className="grid grid-cols-3 gap-2">
        <Stat small label="Put in" value={usd(r.paid)} />
        <Stat small label="Got back" value={usd(r.got)} />
        <Stat
          small
          label={r.pnl >= 0 ? "Gain" : "Loss"}
          value={
            <Change value={r.pnl} className="inline-flex items-center gap-1">
              <Arrow up={r.pnl >= 0} />
              {signedUsd(r.pnl)}
            </Change>
          }
        />
      </dl>
    </section>
  );
}
