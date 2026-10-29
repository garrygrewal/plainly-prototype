"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { cents, shares, signedUsd, usd } from "@/lib/format";
import { quoteSell } from "@/lib/market/lmsr";
import { useDemo } from "@/lib/store";
import { AnimatedNumber } from "./AnimatedNumber";
import { useMarketView } from "./hooks";

/**
 * Cash out, explained: what you'd get now, why it's a bit less than
 * "worth now", and what holding would pay either way. No nudging.
 */
export function CashOutSheet({
  marketId,
  titleId,
  onClose,
}: {
  marketId: string;
  titleId: string;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const { m, lmsr, pYes, position, status } = useMarketView(marketId);
  const cashOut = useDemo((s) => s.cashOut);
  const [done, setDone] = useState<{ proceeds: number; cost: number } | null>(null);

  if (done) {
    const pnl = done.proceeds - done.cost;
    return (
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="pt-2 text-center"
      >
        <h2 id={titleId} data-autofocus tabIndex={-1} className="mt-2 text-[24px] font-semibold tracking-tight outline-none">
          Done. {usd(done.proceeds)} is back in your balance.
        </h2>
        <p className="num mt-2 text-[15px] text-ink-2">
          You put in {usd(done.cost)}, so that’s {signedUsd(pnl)} on this market.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-14 w-full rounded-2xl bg-ink text-[17px] font-semibold text-bg"
        >
          Done
        </button>
      </motion.div>
    );
  }

  if (!position || status === "final") {
    return (
      <div className="pt-2">
        <h2 id={titleId} data-autofocus tabIndex={-1} className="text-[22px] font-semibold outline-none">
          Nothing to cash out
        </h2>
        <p className="mt-2 text-ink-2">This market has settled, or you don’t hold any shares in it.</p>
      </div>
    );
  }

  const h = position.holdings;
  const side = h.yes >= h.no ? "yes" : "no";
  const q = quoteSell(lmsr, side, h[side]);
  const priceNow = side === "yes" ? pYes : 1 - pYes;
  const label = side === "yes" ? m.yesLabel : m.noLabel;
  const other = side === "yes" ? m.noLabel : m.yesLabel;
  const hold = side === "yes" ? position.payoutIfYes : position.payoutIfNo;
  const holdOther = side === "yes" ? position.payoutIfNo : position.payoutIfYes;

  function confirm() {
    const cost = position!.cost;
    const r = cashOut(marketId);
    if (r) setDone({ proceeds: r.proceeds, cost });
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key="form" exit={{ opacity: 0 }}>
        <h2 id={titleId} data-autofocus tabIndex={-1} className="pr-10 text-[22px] font-semibold tracking-tight outline-none">
          Cash out your position?
        </h2>
        <p className="mt-3 text-[17px] leading-snug">
          You’d get{" "}
          <strong className="font-semibold">
            <AnimatedNumber value={position.cashOut} format={usd} />
          </strong>{" "}
          right now.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          You’d sell {shares(h[side])} shares at an average of {cents(q.avgPrice, 1)}. The
          price is {cents(priceNow, 1)} right now, but selling everything at once
          pushes it down a little, so you get slightly less than “worth now”.
        </p>

        <dl className="mt-5 space-y-2.5 rounded-3xl bg-surface-2 p-4 text-sm">
          <Choice
            term="Cash out now"
            value={usd(position.cashOut)}
            delta={position.cashOut - position.cost}
          />
          <Choice term={`Hold, and it’s “${label}”`} value={usd(hold)} delta={hold - position.cost} />
          <Choice term={`Hold, and it’s “${other}”`} value={usd(holdOther)} delta={holdOther - position.cost} />
        </dl>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-3">
          Neither choice is wrong. Cashing out locks in what you have now. Holding
          keeps your chance at the full payout, and the risk of getting nothing.
        </p>

        <button
          type="button"
          onClick={confirm}
          className="mt-5 h-14 w-full rounded-2xl bg-ink text-[17px] font-semibold text-bg active:scale-[0.99]"
        >
          Cash out {usd(position.cashOut)}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 h-12 w-full rounded-2xl text-[15px] font-medium text-ink-2 hover:bg-surface-2"
        >
          Keep my position
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

function Choice({ term, value, delta }: { term: string; value: string; delta: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-2">{term}</dt>
      <dd className="num text-right">
        <span className="font-medium">{value}</span>{" "}
        <span className="text-ink-3">({signedUsd(delta)})</span>
      </dd>
    </div>
  );
}
