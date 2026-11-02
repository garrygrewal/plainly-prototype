"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { type BuyQuote, type Side, quoteBuy } from "@/lib/market/lmsr";
import { cents, shares, signedCents, usd } from "@/lib/format";
import { useDemo } from "@/lib/store";
import { AnimatedNumber } from "./AnimatedNumber";
import { useBalance, useMarketView } from "./hooks";
import { Button } from "./ui/Button";
import { KeyValueList, KeyValueRow } from "./ui/KeyValueRow";
import { Change } from "./ui/Pill";
import { SheetFooter } from "./ui/Sheet";

const PRESETS = [10, 25, 50, 100];
type Info = "shares" | "avg" | "impact";

export function TradeSheet({
  marketId,
  initialSide,
  titleId,
  onClose,
}: {
  marketId: string;
  initialSide: Side;
  titleId: string;
  onClose: () => void;
}) {
  const [done, setDone] = useState<BuyQuote | null>(null);
  return (
    <AnimatePresence mode="wait" initial={false}>
      {done ? (
        <Confirmation key="done" marketId={marketId} quote={done} titleId={titleId} onClose={onClose} />
      ) : (
        <motion.div key="form" className="flex flex-1 flex-col" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <TradeForm marketId={marketId} initialSide={initialSide} titleId={titleId} onDone={setDone} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TradeForm({
  marketId,
  initialSide,
  titleId,
  onDone,
}: {
  marketId: string;
  initialSide: Side;
  titleId: string;
  onDone: (q: BuyQuote) => void;
}) {
  const { m, lmsr, pYes, status } = useMarketView(marketId);
  const balance = useBalance();
  const buy = useDemo((s) => s.buy);
  const [side, setSide] = useState<Side>(initialSide);
  const [raw, setRaw] = useState("50");
  const [info, setInfo] = useState<Info | null>(null);
  const inputId = useId();

  const amount = Number.parseFloat(raw) || 0;
  const tooMuch = amount > balance + 1e-9;
  const tooLittle = amount < 1;
  const valid = !tooMuch && !tooLittle && status !== "final";
  const q = quoteBuy(lmsr, side, valid ? amount : Math.max(0, Math.min(amount, balance)));
  const outcome = side === "yes" ? m.yesLabel : m.noLabel;
  const priceNow = side === "yes" ? pYes : 1 - pYes;
  const toggle = (k: Info) => setInfo((cur) => (cur === k ? null : k));

  function onAmount(v: string) {
    // Dollars and cents only.
    const clean = v.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
    const [whole, frac] = clean.split(".");
    setRaw(frac !== undefined ? `${whole.slice(0, 6)}.${frac.slice(0, 2)}` : whole.slice(0, 6));
  }

  function confirm() {
    if (!valid) return;
    const result = buy(marketId, side, amount);
    if (result) onDone(result);
  }

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        confirm();
      }}
    >
      <p className="pr-12 text-footnote text-ink-2">{m.question}</p>
      {/* Focus lands on the title, not the input, so phones don't throw up a keyboard over the summary. */}
      <h2 id={titleId} data-autofocus tabIndex={-1} className="mt-0.5 text-title2 font-semibold outline-none">
        Buy {side === "yes" ? "Yes" : "No"}
      </h2>

      {/* iOS-style segmented control; the tint is a second cue next to the word. */}
      <div role="group" aria-label="Pick a side" className="mt-4 grid grid-cols-2 gap-1 rounded-tile bg-sheet-fill p-1">
        {(["yes", "no"] as const).map((s) => {
          const on = side === s;
          const p = s === "yes" ? pYes : 1 - pYes;
          const tint = s === "yes" ? "bg-yes-soft text-yes" : "bg-no-soft text-no";
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => setSide(s)}
              className={`pressable flex h-[52px] flex-col items-center justify-center rounded-[9px] transition-colors ${
                on ? tint : "text-ink-2"
              }`}
            >
              <span className="text-subhead font-semibold">
                {s === "yes" ? "Yes" : "No"} · {s === "yes" ? m.yesLabel : m.noLabel}
              </span>
              <span className={`num text-footnote ${on ? "" : "text-ink-3"}`}>
                <AnimatedNumber value={p} format={(v) => cents(v)} /> a share
              </span>
            </button>
          );
        })}
      </div>

      <label htmlFor={inputId} className="mt-6 block text-footnote text-ink-2">
        Amount
      </label>
      <div className="flex items-baseline">
        <span aria-hidden className="text-display font-semibold text-ink-3">
          $
        </span>
        <input
          id={inputId}
          inputMode="decimal"
          autoComplete="off"
          value={raw}
          onChange={(e) => onAmount(e.target.value)}
          aria-describedby={`${inputId}-hint`}
          aria-invalid={tooMuch || tooLittle}
          className="num w-full bg-transparent pl-0.5 text-display font-semibold outline-none"
        />
      </div>
      <p id={`${inputId}-hint`} className={`num text-footnote ${tooMuch ? "text-negative" : "text-ink-2"}`}>
        {tooMuch ? `More than your ${usd(balance)} balance` : tooLittle ? "At least $1" : `You have ${usd(balance)}`}
      </p>
      <div className="mt-3 flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={amount === p}
            onClick={() => setRaw(String(p))}
            className={`pressable hit-area num h-9 flex-1 rounded-pill text-subhead font-medium ${
              amount === p ? "bg-primary text-on-primary" : "bg-sheet-fill text-ink"
            }`}
          >
            ${p}
          </button>
        ))}
      </div>

      {/* The plain-words promise. Max loss is always visible. */}
      <p className="mt-6 text-body">
        You get{" "}
        <strong className="num font-semibold">
          <AnimatedNumber value={q.payoutIfRight} format={usd} />
        </strong>{" "}
        if {outcomeSentence(outcome)}. You can lose at most{" "}
        <strong className="num font-semibold">{usd(q.maxLoss)}</strong>.
      </p>

      <KeyValueList className="mt-2">
        <KeyValueRow label="You pay" value={usd(q.cost)} />
        <KeyValueRow
          label="Shares"
          value={<AnimatedNumber value={q.shares} format={shares} />}
          onInfo={() => toggle("shares")}
          infoExpanded={info === "shares"}
          infoLabel="What are shares?"
          explanation="Each share pays $1 if you’re right and $0 if you’re not."
        />
        <KeyValueRow
          label="Average price"
          value={<AnimatedNumber value={q.avgPrice} format={(v) => cents(v, 1)} />}
          sub={`Price now ${cents(priceNow, 1)}`}
          onInfo={() => toggle("avg")}
          infoExpanded={info === "avg"}
          infoLabel="Why is the average price higher?"
          explanation="Each share you buy nudges the price up a little, so you pay slightly more on average than the price right now. Bigger trades pay more."
        />
        <KeyValueRow
          label="Your trade moves the price"
          value={signedCents(q.impactPts)}
          sub={`${cents(q.priceBefore, 1)} → ${cents(q.priceAfter, 1)}`}
          onInfo={() => toggle("impact")}
          infoExpanded={info === "impact"}
          infoLabel="Why does my trade move the price?"
          explanation="Buying shares pushes the price up for the next person. Busy markets barely move. Quiet ones move more."
        />
        <KeyValueRow
          label="Profit if right"
          value={
            <Change value={q.profitIfRight}>
              <AnimatedNumber value={q.profitIfRight} format={(v) => `+${usd(v)}`} />
            </Change>
          }
        />
      </KeyValueList>

      {q.impactPts > 4 && (
        <p className="mt-2 rounded-tile bg-sheet-fill px-3 py-2.5 text-footnote text-ink-2">
          This is a big trade for this market. It moves the price {Math.round(q.impactPts)}¢, so
          your average price is worse. Smaller trades get closer to {cents(priceNow)}.
        </p>
      )}
      {status === "live" && (
        <p className="mt-3 text-footnote text-ink-3">
          The game is live, so prices change as it plays. You pay the price at the moment you confirm.
        </p>
      )}

      <SheetFooter>
        <Button type="submit" full disabled={!valid}>
          Buy {side === "yes" ? "Yes" : "No"} for {usd(valid ? amount : 0)}
        </Button>
        <p className="mt-2 text-center text-caption text-ink-3">Demo money. No fees.</p>
      </SheetFooter>
    </form>
  );
}

/** "Gulls win" → "the Gulls win"; "6+ goals" → "the answer is “6+ goals”" */
function outcomeSentence(label: string): string {
  if (/ win$/.test(label)) return `the ${label}`;
  return `the answer is “${label}”`;
}

/** A calm checkmark that draws itself. */
export function DoneMark({ tone }: { tone: "yes" | "no" | "neutral" }) {
  const reduce = useReducedMotion();
  const tint = tone === "yes" ? "bg-yes-soft text-yes" : tone === "no" ? "bg-no-soft text-no" : "bg-sheet-fill text-ink";
  return (
    <motion.span
      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className={`grid size-14 place-items-center rounded-full ${tint}`}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        />
      </svg>
    </motion.span>
  );
}

function Confirmation({
  marketId,
  quote,
  titleId,
  onClose,
}: {
  marketId: string;
  quote: BuyQuote;
  titleId: string;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const { m } = useMarketView(marketId);
  const label = quote.side === "yes" ? m.yesLabel : m.noLabel;

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="flex flex-1 flex-col"
    >
      <div className="flex flex-col items-center pt-4 text-center">
        <DoneMark tone={quote.side} />
        <h2 id={titleId} data-autofocus tabIndex={-1} className="mt-4 text-title2 font-semibold outline-none">
          You’re in
        </h2>
        <p className="num mt-1 text-subhead text-ink-2">
          {shares(quote.shares)} {quote.side === "yes" ? "Yes" : "No"} shares · {label}
        </p>
      </div>

      <KeyValueList className="mt-6">
        <KeyValueRow label="You paid" value={usd(quote.cost)} />
        <KeyValueRow label="Average price" value={cents(quote.avgPrice, 1)} />
        <KeyValueRow label={`If “${label}”`} value={`You get ${usd(quote.payoutIfRight)}`} emphasis />
        <KeyValueRow label="If not" value="You get $0" />
        <KeyValueRow label="Most you can lose" value={usd(quote.maxLoss)} />
      </KeyValueList>
      <p className="mt-3 text-footnote text-ink-3">
        You can sell any time before the end, at that moment’s price. We’ll let you know when
        something big happens.
      </p>

      <SheetFooter>
        <Button full onClick={onClose}>
          {m.kind === "live" ? "Watch the game" : "Done"}
        </Button>
      </SheetFooter>
    </motion.div>
  );
}
