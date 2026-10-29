"use client";

import { type LmsrState, impactOf } from "@/lib/market/lmsr";
import { SectionTitle } from "./bits";

const AMOUNTS = [50, 500];

function points(n: number): string {
  if (n < 0.5) return "less than 1 point";
  const r = Math.round(n);
  return `about ${r} ${r === 1 ? "point" : "points"}`;
}

/**
 * Liquidity explained by what it does to you, not what it is.
 * The numbers come from the live market maker, so they're always true.
 */
export function LiquidityNote({ lmsr }: { lmsr: LmsrState }) {
  // Average both sides so the answer doesn't depend on which one you pick.
  const impacts = AMOUNTS.map((a) => (impactOf(lmsr, "yes", a) + impactOf(lmsr, "no", a)) / 2);
  const big = impacts[1];
  const lead =
    big < 6
      ? "Lots of people trade this, so prices are steady."
      : big < 12
        ? "Enough people trade this that small trades barely move the price."
        : "Not many people trade this, so bigger trades move the price a lot.";
  const scale = Math.max(12, big * 1.15);

  return (
    <section aria-labelledby="liq" className="rounded-3xl border border-line bg-surface p-5">
      <SectionTitle id="liq">How much will my trade move the price?</SectionTitle>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">
        {lead} A $50 trade moves the price {points(impacts[0])}. A $500 trade
        moves it {points(impacts[1])}.
      </p>
      <dl className="mt-4 space-y-2.5">
        {AMOUNTS.map((a, i) => (
          <div key={a} className="grid grid-cols-[48px_1fr_56px] items-center gap-3">
            <dt className="num text-sm text-ink-2">${a}</dt>
            <dd className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
              <div
                className="h-full rounded-full bg-ink transition-[width] duration-500"
                style={{ width: `${Math.max(2, (impacts[i] / scale) * 100)}%` }}
              />
            </dd>
            <dd className="num text-right text-sm text-ink-2">
              {impacts[i] < 0.5 ? "<1" : `+${impacts[i].toFixed(1)}`} pts
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm leading-relaxed text-ink-3">
        The bigger the trade, the worse your average price. You’ll see exactly how
        much before you buy.
      </p>
    </section>
  );
}
