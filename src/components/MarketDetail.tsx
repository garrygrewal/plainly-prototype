"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GameEvent, LiveMarket } from "@/lib/data/types";
import {
  cents,
  eventClock,
  frequencyPhrase,
  hockeyClock,
  likelihoodWord,
  ordinal,
  pct,
  signedPts,
} from "@/lib/format";
import { eventMove } from "@/lib/sim/engine";
import { eventSide, markerEvents } from "@/lib/selectors";
import { useDemo } from "@/lib/store";
import { AnimatedNumber } from "./AnimatedNumber";
import { Delta, Screen, SectionTitle, StatusBadge, TopBar } from "./bits";
import { HowItWorks } from "./HowItWorks";
import { type MarketView, useMarketView } from "./hooks";
import { ChevronLeft, ChevronRight } from "./icons";
import { LiquidityNote } from "./LiquidityNote";
import { PositionCard, ResultCard } from "./PositionCard";
import { type ChartEvent, ProbabilityChart } from "./ProbabilityChart";

export function MarketDetail({ id }: { id: string }) {
  const view = useMarketView(id);
  const { m, sim, pYes, status } = view;
  const live = m.kind === "live" ? m : null;

  return (
    <Screen>
      <TopBar back />
      <main className="space-y-4 px-4 pb-36">
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[13px] text-ink-3">{m.category}</span>
          <StatusBadge
            status={status}
            when={m.kind === "static" ? m.when : undefined}
            clock={sim && status === "live" ? hockeyClock(sim.game.elapsed) : undefined}
          />
        </div>

        {live && sim && <Scoreboard m={live} view={view} />}

        <h1 className="text-[26px] font-semibold leading-[1.15] tracking-tight text-balance">
          {m.question}
        </h1>

        <ProbabilityHero view={view} />

        <AnimatePresence initial={false}>
          {view.position && <PositionCard key="pos" view={view} />}
        </AnimatePresence>
        <ResultCard view={view} />

        <ChartSection view={view} />

        {status !== "final" && <LiquidityNote lmsr={view.lmsr} />}
        <HowItWorks yesLabel={m.yesLabel} />

        <section aria-labelledby="rules" className="px-1 pt-1">
          <SectionTitle id="rules">How it settles</SectionTitle>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{m.resolves}</p>
        </section>
      </main>
      <TradeBar view={view} pYes={pYes} />
    </Screen>
  );
}

function Scoreboard({ m, view }: { m: LiveMarket; view: MarketView }) {
  const game = view.sim!.game;
  const pp = game.powerPlay;
  const rows = (["home", "away"] as const).map((team) => ({ team, info: m.teams[team] }));
  return (
    <section
      aria-label={`Score: ${m.teams.home.name} ${game.score.home}, ${m.teams.away.name} ${game.score.away}`}
      className="rounded-3xl border border-line bg-surface p-4"
    >
      <ul className="space-y-2">
        {rows.map(({ team, info }) => (
          <li key={team} className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid h-7 w-11 place-items-center rounded-lg bg-surface-2 text-[11px] font-semibold tracking-wide text-ink-2"
            >
              {info.abbr}
            </span>
            <span className="flex-1 text-[15px]">
              <span className="text-ink-2">{info.city}</span>{" "}
              <span className="font-medium">{info.name}</span>
              {team === m.yesTeam && (
                <span className="ml-1.5 text-xs text-ink-3">(Yes)</span>
              )}
            </span>
            <motion.span
              key={game.score[team]}
              initial={{ scale: 1.35, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="num w-6 text-right text-xl font-semibold"
            >
              {game.score[team]}
            </motion.span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-2">
        {game.final
          ? "Game over."
          : pp
            ? `Power play: ${m.teams[pp.team].name} have an extra skater.`
            : game.emptyNet
              ? `${m.teams[game.emptyNet].name} have pulled their goalie.`
              : `${ordinal(Math.min(3, Math.floor(game.elapsed / 1200) + 1))} period, even strength.`}
      </p>
    </section>
  );
}

function ProbabilityHero({ view }: { view: MarketView }) {
  const { m, pYes, history, status, sim } = view;
  const start = history[0]?.p ?? pYes;
  const label =
    m.kind === "live" ? `Chance the ${m.yesLabel.replace(" win", "")} win` : `Chance of “${m.yesLabel}”`;

  if (status === "final" && sim?.resolved) {
    const won = sim.resolved === "yes";
    return (
      <section aria-label="Result" className="rounded-3xl bg-ink p-5 text-bg">
        <p className="text-sm opacity-70">Settled</p>
        <p className="mt-1 text-[28px] font-semibold tracking-tight">
          {won ? m.yesLabel : m.noLabel}
        </p>
        <p className="mt-1 text-[15px] opacity-80">
          {won ? "Yes" : "No"} shares paid $1 each. {won ? "No" : "Yes"} shares paid nothing.
        </p>
      </section>
    );
  }

  return (
    <section aria-label={`${label}: ${pct(pYes)}. ${likelihoodWord(pYes)}.`}>
      <p className="text-sm text-ink-2">{label}</p>
      <div className="mt-0.5 flex items-end gap-3" aria-hidden>
        <span className="text-[64px] font-semibold leading-none tracking-[-0.04em]">
          <AnimatedNumber value={pYes * 100} format={(v) => `${Math.round(v)}`} />
          <span className="text-[36px] tracking-tight">%</span>
        </span>
        <span className="mb-2">
          <Delta
            pts={(pYes - start) * 100}
            suffix={m.kind === "live" ? "since puck drop" : "in 30 days"}
          />
        </span>
      </div>
      <p className="mt-3 text-[17px] leading-snug text-pretty">
        <strong className="font-semibold">{likelihoodWord(pYes)}.</strong>{" "}
        <span className="text-ink-2">The market thinks this happens {frequencyPhrase(pYes)}.</span>
      </p>
    </section>
  );
}

function ChartSection({ view }: { view: MarketView }) {
  const { m, sim, history, pYes } = view;
  const live = m.kind === "live" ? m : null;
  const ref = useRef<HTMLElement>(null);
  const focus = useDemo((s) => s.focusEvent);
  const [manual, setManual] = useState<{ id: string; at: number } | null>(null);

  const events = useMemo(
    () => (live && sim ? markerEvents(live, sim.fired) : []),
    [live, sim],
  );
  const count = events.length;

  // Follow the newest moment unless the user (or a notification) picked one
  // since the last event fired.
  let selectedId = events[count - 1]?.id ?? null;
  if (focus && focus.marketId === m.id && focus.at === count) selectedId = focus.eventId;
  if (manual && manual.at === count) selectedId = manual.id;
  if (!events.some((e) => e.id === selectedId)) selectedId = events[count - 1]?.id ?? null;
  const selected = events.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    if (focus?.marketId === m.id) ref.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [focus, m.id]);

  const chartEvents: ChartEvent[] = live
    ? events.map((e) => {
        const mv = eventMove(history, e);
        return {
          id: e.id,
          x: e.t,
          type: e.type,
          side: eventSide(live, e),
          label: `${e.title}, ${eventClock(e.t)}. Moved from ${pct(mv.before)} to ${pct(mv.after)}.`,
        };
      })
    : [];

  const select = (id: string) => setManual({ id, at: count });
  const step = (dir: -1 | 1) => {
    const i = events.findIndex((e) => e.id === selectedId);
    const next = events[i + dir];
    if (next) select(next.id);
  };

  return (
    <section ref={ref} aria-labelledby="chart-title" className="scroll-mt-16 rounded-3xl border border-line bg-surface p-4 pb-3">
      <div className="flex items-baseline justify-between px-1">
        <SectionTitle id="chart-title">Chance over time</SectionTitle>
        {live && <span className="text-xs text-ink-3">Tap a dot to see why it moved</span>}
      </div>
      <figure className="mt-2">
        <ProbabilityChart
          points={history}
          head={pYes}
          domain={live ? [0, 3600] : [0, history.length - 1]}
          dividers={live ? [1200, 2400] : []}
          xLabels={
            live
              ? [
                  { x: 600, label: "1st" },
                  { x: 1800, label: "2nd" },
                  { x: 3000, label: "3rd" },
                ]
              : [
                  { x: 0, label: "30 days ago" },
                  { x: history.length - 1, label: "Today" },
                ]
          }
          events={chartEvents}
          live={view.status === "live"}
          selectedId={selectedId}
          onSelect={select}
        />
        <figcaption className="mt-2 px-1 text-[13px] leading-relaxed text-ink-3">
          {chartSummary(view, events)}
        </figcaption>
      </figure>

      {live && (
        <div className="mt-3">
          {selected ? (
            <EventExplainer
              m={live}
              ev={selected}
              view={view}
              onPrev={events[0]?.id !== selectedId ? () => step(-1) : undefined}
              onNext={events[count - 1]?.id !== selectedId ? () => step(1) : undefined}
            />
          ) : (
            <p className="rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-ink-2">
              No big moments yet. Goals, penalties and injuries appear on the line as
              they happen, with what each one did to the price.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function EventExplainer({
  m,
  ev,
  view,
  onPrev,
  onNext,
}: {
  m: LiveMarket;
  ev: GameEvent;
  view: MarketView;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const reduce = useReducedMotion();
  const mv = eventMove(view.history, ev);
  const side = eventSide(m, ev);
  const moved = (mv.after - mv.before) * 100;

  return (
    <div className="rounded-2xl bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-ink-3">{eventClock(ev.t)}</p>
          <p className="mt-0.5 text-[15px] font-semibold">
            {ev.title}
            {side && (
              <span className={`ml-2 text-xs font-medium ${side === "yes" ? "text-yes" : "text-no"}`}>
                Helps {side === "yes" ? "Yes" : "No"}
              </span>
            )}
          </p>
        </div>
        <div className="-mr-1 -mt-1 flex">
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            aria-label="Previous moment"
            className="grid size-8 place-items-center rounded-full text-ink-2 hover:bg-surface disabled:opacity-30"
          >
            <ChevronLeft width={18} height={18} />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            aria-label="Next moment"
            className="grid size-8 place-items-center rounded-full text-ink-2 hover:bg-surface disabled:opacity-30"
          >
            <ChevronRight width={18} height={18} />
          </button>
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={ev.id}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <p className="mt-1 text-sm text-ink-2">{ev.detail}</p>
          <p className="num mt-3 flex items-center gap-2 text-sm">
            <span className="rounded-full bg-surface px-2.5 py-1 font-medium">
              {pct(mv.before)} → {pct(mv.after)}
            </span>
            <span className="text-ink-2">
              {signedPts(moved, 0)}
              {!mv.settled && " so far"}
            </span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink">
            <span className="font-medium">Why: </span>
            {ev.why}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function chartSummary(view: MarketView, events: GameEvent[]): string {
  const { m, history, pYes } = view;
  if (m.kind === "static") {
    const ps = history.map((h) => h.p);
    return `Over the last 30 days the chance ranged from ${pct(Math.min(...ps))} to ${pct(Math.max(...ps))}. It’s ${pct(pYes)} now.`;
  }
  const start = history[0]?.p ?? pYes;
  let biggest: { ev: GameEvent; d: number } | null = null;
  for (const ev of events) {
    const mv = eventMove(history, ev);
    const d = mv.after - mv.before;
    if (!biggest || Math.abs(d) > Math.abs(biggest.d)) biggest = { ev, d };
  }
  const who = m.yesLabel.replace(" win", "");
  const base = `The ${who}’ chance was ${pct(start)} at puck drop and is ${pct(pYes)} now.`;
  return biggest
    ? `${base} Biggest move so far: ${biggest.ev.title} in the ${eventClock(biggest.ev.t).split(",")[0]} (${signedPts(biggest.d * 100, 0)}).`
    : base;
}

function TradeBar({ view, pYes }: { view: MarketView; pYes: number }) {
  const { m, status } = view;
  const open = useDemo((s) => s.openSheet);

  if (status === "final") {
    return (
      <div className="sticky bottom-0 z-10 border-t border-line bg-bg/95 px-4 py-4 text-center text-sm text-ink-2 backdrop-blur">
        This market has settled. Trading is closed.
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 z-10 border-t border-line bg-bg/95 px-4 pt-3 pb-4 backdrop-blur">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => open({ kind: "trade", marketId: m.id, side: "yes" })}
          className="flex h-14 flex-col items-start justify-center rounded-2xl bg-yes px-4 text-left text-bg transition-transform active:scale-[0.98]"
        >
          <span className="text-[15px] font-semibold leading-tight">Yes · {m.yesLabel}</span>
          <span className="num text-[13px] opacity-85">
            <AnimatedNumber value={pYes} format={(v) => cents(v)} /> a share
          </span>
        </button>
        <button
          type="button"
          onClick={() => open({ kind: "trade", marketId: m.id, side: "no" })}
          className="flex h-14 flex-col items-start justify-center rounded-2xl bg-no px-4 text-left text-bg transition-transform active:scale-[0.98]"
        >
          <span className="text-[15px] font-semibold leading-tight">No · {m.noLabel}</span>
          <span className="num text-[13px] opacity-85">
            <AnimatedNumber value={1 - pYes} format={(v) => cents(v)} /> a share
          </span>
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-ink-3">
        Each share pays $1 if you’re right. You can never lose more than you put in.
      </p>
    </div>
  );
}
