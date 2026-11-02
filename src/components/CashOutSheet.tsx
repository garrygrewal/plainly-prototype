"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { cents, shares, signedUsd, usd } from "@/lib/format";
import { quoteSell } from "@/lib/market/lmsr";
import { useDemo } from "@/lib/store";
import { AnimatedNumber } from "./AnimatedNumber";
import { useMarketView } from "./hooks";
import { DoneMark } from "./TradeSheet";
import { Button } from "./ui/Button";
import { KeyValueList, KeyValueRow } from "./ui/KeyValueRow";
import { Change } from "./ui/Pill";
import { SheetEnd, SheetFooter } from "./ui/Sheet";

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
  const [whyLess, setWhyLess] = useState(false);

  if (done) {
    const pnl = done.proceeds - done.cost;
    return (
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="flex flex-1 flex-col"
      >
        <div className="flex flex-col items-center pt-4 text-center">
          <DoneMark tone="neutral" />
          <h2 id={titleId} data-autofocus tabIndex={-1} className="mt-4 text-title2 font-semibold outline-none">
            {usd(done.proceeds)} is back in your balance
          </h2>
        </div>
        <KeyValueList className="mt-6">
          <KeyValueRow label="You put in" value={usd(done.cost)} />
          <KeyValueRow label="You got back" value={usd(done.proceeds)} />
          <KeyValueRow label={pnl >= 0 ? "Gain" : "Loss"} value={<Change value={pnl}>{signedUsd(pnl)}</Change>} />
        </KeyValueList>
        <SheetFooter>
          <Button full onClick={onClose}>
            Done
          </Button>
        </SheetFooter>
      </motion.div>
    );
  }

  if (!position || status === "final") {
    return (
      <>
        <h2 id={titleId} data-autofocus tabIndex={-1} className="pr-12 text-title2 font-semibold outline-none">
          Nothing to cash out
        </h2>
        <p className="mt-2 text-body text-ink-2">This market has settled, or you don’t hold any shares in it.</p>
        <SheetEnd />
      </>
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
  const now = position.cashOut - position.cost;

  function confirm() {
    const cost = position!.cost;
    const r = cashOut(marketId);
    if (r) setDone({ proceeds: r.proceeds, cost });
  }

  return (
    <div className="flex flex-1 flex-col">
      <h2 id={titleId} data-autofocus tabIndex={-1} className="pr-12 text-title2 font-semibold outline-none">
        Cash out?
      </h2>
      <p className="num mt-0.5 text-subhead text-ink-2">
        Sell {shares(h[side])} {side === "yes" ? "Yes" : "No"} shares · {label}
      </p>

      <p className="mt-5 text-footnote text-ink-2">You’d get</p>
      <AnimatedNumber value={position.cashOut} format={usd} className="block text-display font-semibold" />
      <p className="num text-subhead">
        <Change value={now}>{signedUsd(now)}</Change> <span className="text-ink-2">on the {usd(position.cost)} you put in</span>
      </p>

      <KeyValueList className="mt-4">
        <KeyValueRow
          label="Average sale price"
          value={cents(q.avgPrice, 1)}
          sub={`Price now ${cents(priceNow, 1)}`}
          onInfo={() => setWhyLess((v) => !v)}
          infoExpanded={whyLess}
          infoLabel="Why is it less than the price now?"
          explanation="Selling everything at once pushes the price down a little as you go, so you get slightly less than shares × today’s price."
        />
        <KeyValueRow label="Cash out now" value={<Pair value={position.cashOut} delta={now} />} />
        <KeyValueRow label={`Hold: if “${label}”`} value={<Pair value={hold} delta={hold - position.cost} />} />
        <KeyValueRow label={`Hold: if “${other}”`} value={<Pair value={holdOther} delta={holdOther - position.cost} />} />
      </KeyValueList>
      <p className="mt-3 text-footnote text-ink-3">
        Neither choice is wrong. Cashing out locks in what you have now. Holding keeps your chance at
        the full payout, and the risk of getting nothing.
      </p>

      <SheetFooter>
        <Button full onClick={confirm}>
          Cash out {usd(position.cashOut)}
        </Button>
        <Button full variant="plain" size="md" className="mt-1" onClick={onClose}>
          Keep my shares
        </Button>
      </SheetFooter>
    </div>
  );
}

function Pair({ value, delta }: { value: number; delta: number }) {
  return (
    <>
      {usd(value)} <Change value={delta} className="text-footnote">({signedUsd(delta)})</Change>
    </>
  );
}
