"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { type BuyQuote, type Side, quoteBuy } from "@/lib/market/lmsr";
import { cents, shares, signedPts, usd } from "@/lib/format";
import { useDemo } from "@/lib/store";
import { AnimatedNumber } from "./AnimatedNumber";
import { useBalance, useMarketView } from "./hooks";

const PRESETS = [10, 25, 50, 100];

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
        <motion.div key="form" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
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
  const inputId = useId();

  const amount = Number.parseFloat(raw) || 0;
  const tooMuch = amount > balance + 1e-9;
  const tooLittle = amount < 1;
  const valid = !tooMuch && !tooLittle && status !== "final";
  const q = quoteBuy(lmsr, side, valid ? amount : Math.max(0, Math.min(amount, balance)));
  const label = side === "yes" ? m.yesLabel : m.noLabel;
  const outcome = side === "yes" ? m.yesLabel : m.noLabel;
  const priceNow = side === "yes" ? pYes : 1 - pYes;

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
      onSubmit={(e) => {
        e.preventDefault();
        confirm();
      }}
    >
      <p className="pr-10 text-[13px] text-ink-3">{m.question}</p>
      {/* Focus lands on the title, not the input, so phones don't throw up a keyboard over the summary. */}
      <h2 id={titleId} data-autofocus tabIndex={-1} className="mt-1 text-[22px] font-semibold tracking-tight outline-none">
        Buy {side === "yes" ? "Yes" : "No"} · {label}
      </h2>

      <div role="radiogroup" aria-label="Pick a side" className="mt-4 grid grid-cols-2 gap-2">
        {(["yes", "no"] as const).map((s) => {
          const on = side === s;
          const p = s === "yes" ? pYes : 1 - pYes;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setSide(s)}
              className={`flex h-14 flex-col items-start justify-center rounded-2xl border-2 px-3.5 text-left transition-colors ${
                on
                  ? s === "yes"
                    ? "border-yes bg-yes-soft"
                    : "border-no bg-no-soft"
                  : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              <span className={`text-[15px] font-semibold leading-tight ${on ? (s === "yes" ? "text-yes" : "text-no") : ""}`}>
                {s === "yes" ? "Yes" : "No"} · {s === "yes" ? m.yesLabel : m.noLabel}
              </span>
              <span className="num text-[13px] text-ink-2">
                <AnimatedNumber value={p} format={(v) => cents(v)} /> a share
              </span>
            </button>
          );
        })}
      </div>

      <label htmlFor={inputId} className="mt-5 block text-sm text-ink-2">
        How much do you want to put in?
      </label>
      <div className="mt-1.5 flex items-center rounded-2xl border border-line bg-bg px-4 focus-within:border-ink">
        <span className="text-[32px] font-semibold text-ink-3">$</span>
        <input
          id={inputId}
          inputMode="decimal"
          autoComplete="off"
          value={raw}
          onChange={(e) => onAmount(e.target.value)}
          aria-describedby={`${inputId}-hint`}
          aria-invalid={tooMuch || tooLittle}
          className="num h-16 w-full bg-transparent pl-1 text-[32px] font-semibold tracking-tight outline-none"
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setRaw(String(p))}
              aria-pressed={amount === p}
              className={`num h-8 rounded-full px-3 text-sm transition-colors ${
                amount === p ? "bg-ink text-bg" : "bg-surface-2 text-ink-2 hover:text-ink"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
        <span id={`${inputId}-hint`} className={`num text-xs ${tooMuch ? "text-no" : "text-ink-3"}`}>
          {tooMuch ? "More than your balance" : tooLittle ? "At least $1" : `You have ${usd(balance)}`}
        </span>
      </div>

      {/* The plain-words summary. Max loss is always visible. */}
      <section aria-label="What you get" className="mt-5 rounded-3xl bg-surface-2 p-4">
        <p className="text-[17px] leading-snug">
          You get{" "}
          <strong className="font-semibold">
            <AnimatedNumber value={q.payoutIfRight} format={usd} />
          </strong>{" "}
          if {outcomeSentence(outcome)}.
        </p>
        <p className="mt-1 text-[17px] leading-snug">
          You can lose at most <strong className="font-semibold num">{usd(q.maxLoss)}</strong>.
        </p>

        <dl className="mt-4 space-y-2 border-t border-line pt-3 text-sm">
          <Row term="You pay" value={usd(q.cost)} />
          <Row
            term="Shares"
            value={<AnimatedNumber value={q.shares} format={shares} />}
            hint="Each pays $1 if you’re right"
          />
          <Row
            term="Average price"
            value={<AnimatedNumber value={q.avgPrice} format={(v) => cents(v, 1)} />}
            hint={`Now ${cents(priceNow, 1)}; bigger trades pay more per share`}
          />
          <Row
            term="Your trade moves the price"
            value={`${(q.priceBefore * 100).toFixed(1)}% → ${(q.priceAfter * 100).toFixed(1)}%`}
            hint={signedPts(q.impactPts)}
          />
          <Row
            term="Profit if right"
            value={<AnimatedNumber value={q.profitIfRight} format={(v) => `+${usd(v)}`} />}
          />
        </dl>
        {q.impactPts > 4 && (
          <p className="mt-3 rounded-xl bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink-2">
            This is a big trade for this market. It moves the price {Math.round(q.impactPts)} points,
            so your average price is worse. Smaller trades get closer to {cents(priceNow)}.
          </p>
        )}
      </section>

      {status === "live" && (
        <p className="mt-3 text-[13px] leading-relaxed text-ink-3">
          The game is live, so prices change as it plays. You pay the price at the
          moment you confirm.
        </p>
      )}

      <button
        type="submit"
        disabled={!valid}
        className={`mt-4 h-14 w-full rounded-2xl text-[17px] font-semibold text-bg transition-[transform,opacity] active:scale-[0.99] disabled:opacity-40 ${
          side === "yes" ? "bg-yes" : "bg-no"
        }`}
      >
        Buy {side === "yes" ? "Yes" : "No"} for {usd(valid ? amount : 0)}
      </button>
      <p className="mt-2 text-center text-xs text-ink-3">Demo money. Nothing real is spent.</p>
    </form>
  );
}

function Row({ term, value, hint }: { term: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-ink-2">
        {term}
        {hint && <span className="block text-xs text-ink-3">{hint}</span>}
      </dt>
      <dd className="num text-right font-medium">{value}</dd>
    </div>
  );
}

/** "Gulls win" → "the Gulls win"; "6+ goals" → "it’s 6+ goals" */
function outcomeSentence(label: string): string {
  if (/ win$/.test(label)) return `the ${label}`;
  return `the answer is “${label}”`;
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
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="pt-2"
    >
      <div className="flex flex-col items-center text-center">
        <motion.span
          initial={reduce ? false : { scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.05 }}
          className={`grid size-16 place-items-center rounded-full text-bg ${quote.side === "yes" ? "bg-yes" : "bg-no"}`}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            />
          </svg>
        </motion.span>
        <h2 id={titleId} data-autofocus tabIndex={-1} className="mt-4 text-[24px] font-semibold tracking-tight outline-none">
          You’re in.
        </h2>
        <p className="mt-1 text-[15px] text-ink-2">
          You own {shares(quote.shares)} {quote.side === "yes" ? "Yes" : "No"} shares · {label}
        </p>
      </div>

      {/* The receipt: a ticket that settles into place. */}
      <motion.dl
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 26 }}
        className="relative mt-6 space-y-2.5 rounded-3xl border border-dashed border-line bg-bg p-5 text-sm"
      >
        <Row term="You paid" value={usd(quote.cost)} />
        <Row term="Average price" value={cents(quote.avgPrice, 1)} />
        <Row term={`If the result is “${label}”`} value={`You get ${usd(quote.payoutIfRight)}`} />
        <Row term="If not" value="You get $0" />
        <Row term="Most you can lose" value={usd(quote.maxLoss)} />
      </motion.dl>

      <p className="mt-4 text-center text-[13px] leading-relaxed text-ink-3">
        You can sell any time before the end at that moment’s price. We’ll let
        you know when something big happens.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-5 h-14 w-full rounded-2xl bg-ink text-[17px] font-semibold text-bg active:scale-[0.99]"
      >
        {m.kind === "live" ? "Watch the game" : "Done"}
      </button>
    </motion.div>
  );
}
