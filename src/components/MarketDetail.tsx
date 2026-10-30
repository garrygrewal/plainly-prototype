"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { impactOf } from "@/lib/market/lmsr";
import { eventMove } from "@/lib/sim/engine";
import { eventSide, markerEvents, scoreLine } from "@/lib/selectors";
import { useDemo } from "@/lib/store";
import { AnimatedNumber } from "./AnimatedNumber";
import { Screen } from "./bits";
import { type MarketView, useMarketView } from "./hooks";
import { Arrow, ChevronLeft, ChevronRight, Settled } from "./icons";
import { MarketIcon } from "./MarketIcon";
import { PositionCard, ResultCard } from "./PositionCard";
import { type ChartEvent, ProbabilityChart } from "./ProbabilityChart";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/Button";
import { KeyValueList, KeyValueRow } from "./ui/KeyValueRow";
import { NavBar } from "./ui/NavBar";
import { Change } from "./ui/Pill";
import { type Detent, Sheet, SheetEnd } from "./ui/Sheet";
import { Card, SectionHeader, Tile } from "./ui/Surface";

type Topic = "chance" | "share" | "liquidity" | "how" | "settles";
const INFO_DETENTS: Detent[] = ["medium", "large"];

export function MarketDetail({ id }: { id: string }) {
  const view = useMarketView(id);
  const { m, sim, status } = view;
  const live = m.kind === "live" ? m : null;
  const [topic, setTopic] = useState<Topic | null>(null);
  const infoTitle = useId();

  // An explainer is transient: close it when this screen is hidden.
  useLayoutEffect(() => () => setTopic(null), []);

  return (
    <Screen>
      <NavBar back={{ href: "/", label: "Predictions" }} trailing={<ThemeToggle />} />
      <main className="space-y-6 px-4 pt-2 pb-8">
        <header className="flex items-start gap-3">
          <MarketIcon m={m} size={44} />
          <div className="min-w-0">
            <h1 className="text-title3 font-semibold text-pretty">{m.question}</h1>
            <MetaLine view={view} />
          </div>
        </header>

        {live && sim && <Scoreboard m={live} view={view} />}

        <ProbabilityHero view={view} />

        <AnimatePresence initial={false}>
          {view.position && <PositionCard key="pos" view={view} />}
        </AnimatePresence>
        <ResultCard view={view} />

        <ChartSection view={view} />

        <section aria-labelledby="about-title" className="space-y-3">
          <SectionHeader id="about-title">About this market</SectionHeader>
          <Card className="py-1">
            <KeyValueList>
              <KeyValueRow
                label="Chance now"
                value={status === "final" ? "Settled" : `${pct(view.pYes)} · ${cents(view.pYes)} a share`}
                onInfo={() => setTopic("chance")}
                infoLabel="Why the price is the chance"
              />
              <KeyValueRow
                label="A share pays"
                value="$1 if you’re right"
                onInfo={() => setTopic("share")}
                infoLabel="What a share is"
              />
              {status !== "final" && <LiquidityRows view={view} onInfo={() => setTopic("liquidity")} />}
              <KeyValueRow label="Traded so far" value={`$${(m.volume / 1000).toFixed(1)}k`} />
            </KeyValueList>
          </Card>
          <Card className="divide-y divide-line p-0">
            <NavRow label="How this works" onClick={() => setTopic("how")} />
            <NavRow label="How it settles" onClick={() => setTopic("settles")} />
          </Card>
        </section>
      </main>
      <TradeBar view={view} />

      <Sheet open={!!topic} onClose={() => setTopic(null)} labelledBy={infoTitle} detents={INFO_DETENTS}>
        {topic && <Explainer topic={topic} view={view} titleId={infoTitle} />}
        <SheetEnd />
      </Sheet>
    </Screen>
  );
}

function MetaLine({ view }: { view: MarketView }) {
  const { m, sim, status } = view;
  let content: React.ReactNode;
  if (status === "live" && sim) {
    content = (
      <>
        <span className="inline-flex items-center gap-1.5 font-medium text-live">
          <span aria-hidden className="size-1.5 rounded-full bg-live" />
          Live
        </span>
        <span aria-hidden>·</span>
        <span>{hockeyClock(sim.game.elapsed)}</span>
      </>
    );
  } else if (status === "final") {
    content = <span>Final</span>;
  } else if (m.kind === "static" && m.status === "upcoming") {
    content = <span>Starts {m.when}</span>;
  } else {
    content = <span>{m.category}</span>;
  }
  return <p className="num mt-0.5 flex flex-wrap items-center gap-x-1.5 text-footnote text-ink-2">{content}</p>;
}

function Scoreboard({ m, view }: { m: LiveMarket; view: MarketView }) {
  const game = view.sim!.game;
  const pp = game.powerPlay;
  return (
    <Tile
      aria-label={`Score: ${m.teams.home.name} ${game.score.home}, ${m.teams.away.name} ${game.score.away}`}
      className="py-2"
    >
      <ul>
        {(["home", "away"] as const).map((team) => (
          <li key={team} className="flex h-10 items-center gap-3">
            <span className="w-9 text-caption font-bold tracking-wide text-ink-2">{m.teams[team].abbr}</span>
            <span className="flex-1 text-body">
              {m.teams[team].city} <span className="font-semibold">{m.teams[team].name}</span>
            </span>
            {team === m.yesTeam && <span className="text-footnote text-ink-3">Yes</span>}
            <motion.span
              key={game.score[team]}
              initial={{ scale: 1.35, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="num w-6 text-right text-title3 font-semibold"
            >
              {game.score[team]}
            </motion.span>
          </li>
        ))}
      </ul>
      <p className="border-t border-line pt-2 pb-1 text-footnote text-ink-2">
        {game.final
          ? `Final. ${scoreLine(m, game)}.`
          : pp
            ? `Power play: ${m.teams[pp.team].name} have an extra skater`
            : game.emptyNet
              ? `${m.teams[game.emptyNet].name} have pulled their goalie`
              : `${ordinal(Math.min(3, Math.floor(game.elapsed / 1200) + 1))} period, even strength`}
      </p>
    </Tile>
  );
}

function ProbabilityHero({ view }: { view: MarketView }) {
  const { m, pYes, history, status, sim } = view;
  const start = history[0]?.p ?? pYes;
  const moved = Math.round((pYes - start) * 100);
  const label =
    m.kind === "live" ? `Chance the ${m.yesLabel.replace(" win", "")} win` : `Chance of “${m.yesLabel}”`;

  if (status === "final" && sim?.resolved) {
    const won = sim.resolved === "yes";
    return (
      <Tile aria-label="Result" className="flex items-start gap-3 py-4">
        <Settled size={24} className="mt-0.5 shrink-0 text-ink" />
        <div>
          <p className="text-footnote text-ink-2">Settled</p>
          <p className="text-title2 font-semibold">{won ? m.yesLabel : m.noLabel}</p>
          <p className="mt-1 text-subhead text-ink-2">
            {won ? "Yes" : "No"} shares paid $1 each. {won ? "No" : "Yes"} shares paid nothing.
          </p>
        </div>
      </Tile>
    );
  }

  return (
    <section aria-label={`${label}: ${pct(pYes)}. ${likelihoodWord(pYes)}.`}>
      <p className="text-subhead text-ink-2">{label}</p>
      <AnimatedNumber
        value={pYes * 100}
        format={(v) => `${Math.round(v)}%`}
        className="block text-display font-semibold"
      />
      <p className="num mt-0.5 flex items-center gap-1 text-subhead">
        {moved === 0 ? (
          <span className="text-ink-2">No change {m.kind === "live" ? "since puck drop" : "in 30 days"}</span>
        ) : (
          <Change value={moved} className="inline-flex items-center gap-1">
            <Arrow up={moved > 0} />
            {moved > 0 ? "+" : "−"}
            {Math.abs(moved)} {Math.abs(moved) === 1 ? "pt" : "pts"}
            <span className="text-ink-2">{m.kind === "live" ? "since puck drop" : "in 30 days"}</span>
          </Change>
        )}
      </p>
      <p className="mt-3 text-body text-pretty">
        <span className="font-semibold">{likelihoodWord(pYes)}.</span>{" "}
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

  const events = useMemo(() => (live && sim ? markerEvents(live, sim.fired) : []), [live, sim]);
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
    <section ref={ref} aria-labelledby="chart-title" className="scroll-mt-14 space-y-3">
      <SectionHeader
        id="chart-title"
        trailing={live && <span className="text-footnote text-ink-3">Tap a dot to see why</span>}
      >
        Chance over time
      </SectionHeader>
      <figure>
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
        <figcaption className="mt-2 text-footnote text-ink-3">{chartSummary(view, events)}</figcaption>
      </figure>

      {live &&
        (selected ? (
          <EventExplainer
            m={live}
            ev={selected}
            view={view}
            onPrev={events[0]?.id !== selectedId ? () => step(-1) : undefined}
            onNext={events[count - 1]?.id !== selectedId ? () => step(1) : undefined}
          />
        ) : (
          <Tile className="py-4 text-subhead text-ink-2">
            No big moments yet. Goals, penalties and injuries appear on the line as they
            happen, with what each one did to the price.
          </Tile>
        ))}
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
    <Tile className="py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-footnote text-ink-2">{eventClock(ev.t)}</p>
          <p className="mt-0.5 text-body font-semibold">
            {ev.title}
            {side && (
              <span className={`ml-2 text-footnote font-medium ${side === "yes" ? "text-yes" : "text-no"}`}>
                Helps {side === "yes" ? "Yes" : "No"}
              </span>
            )}
          </p>
        </div>
        <div className="-mt-2 -mr-2 flex">
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            aria-label="Previous moment"
            className="pressable grid size-11 place-items-center text-ink-2 disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            aria-label="Next moment"
            className="pressable grid size-11 place-items-center text-ink-2 disabled:opacity-30"
          >
            <ChevronRight size={20} />
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
          <p className="text-subhead text-ink-2">{ev.detail}</p>
          <p className="num mt-3 flex items-center gap-2 text-subhead">
            <span className="rounded-pill bg-surface-2 px-2.5 py-1 font-medium">
              {pct(mv.before)} → {pct(mv.after)}
            </span>
            <Change value={moved}>
              {signedPts(moved, 0)}
              {!mv.settled && " so far"}
            </Change>
          </p>
          <p className="mt-3 text-subhead text-ink">
            <span className="font-semibold">Why: </span>
            {ev.why}
          </p>
        </motion.div>
      </AnimatePresence>
    </Tile>
  );
}

function points(n: number): string {
  if (n < 0.5) return "<1 pt";
  const r = Math.round(n);
  return `~${r} ${r === 1 ? "pt" : "pts"}`;
}

function inWords(n: number): string {
  if (n < 0.5) return "less than 1 point";
  const r = Math.round(n);
  return `about ${r} ${r === 1 ? "point" : "points"}`;
}

/** Liquidity by consequence. Averages both sides so the answer doesn't depend on which you pick. */
function liquidity(view: MarketView) {
  return [50, 500].map((a) => (impactOf(view.lmsr, "yes", a) + impactOf(view.lmsr, "no", a)) / 2);
}

function LiquidityRows({ view, onInfo }: { view: MarketView; onInfo: () => void }) {
  const [small, big] = liquidity(view);
  return (
    <>
      <KeyValueRow
        label="A $50 trade moves it"
        value={points(small)}
        onInfo={onInfo}
        infoLabel="How much will my trade move the price?"
      />
      <KeyValueRow label="A $500 trade moves it" value={points(big)} />
    </>
  );
}

function NavRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable flex min-h-12 w-full items-center justify-between px-4 text-left text-body"
    >
      {label}
      <ChevronRight size={18} className="text-ink-3" />
    </button>
  );
}

function Explainer({ topic, view, titleId }: { topic: Topic; view: MarketView; titleId: string }) {
  const { m, pYes } = view;
  const title = (t: string) => (
    <h2 id={titleId} data-autofocus tabIndex={-1} className="pr-10 text-title2 font-semibold outline-none">
      {t}
    </h2>
  );
  const body = "mt-3 space-y-3 text-body text-ink-2";

  switch (topic) {
    case "chance":
      return (
        <>
          {title("The price is the chance")}
          <div className={body}>
            <p>
              A share that costs {cents(pYes)} means people trading here think “{m.yesLabel}” is
              about {pct(pYes)} likely. That’s {frequencyPhrase(pYes)}.
            </p>
            <p>When they change their minds, the price moves. That’s why it jumps when something happens.</p>
          </div>
        </>
      );
    case "share":
      return (
        <>
          {title("A share pays $1 if you’re right")}
          <div className={body}>
            <p>
              Buy a “{m.yesLabel}” share and it pays $1 if that happens, or $0 if it doesn’t. A
              “{m.noLabel}” share is the opposite.
            </p>
            <p>No share ever pays more than $1, so you can never lose more than you put in.</p>
          </div>
        </>
      );
    case "liquidity": {
      const [small, big] = liquidity(view);
      const lead =
        big < 6
          ? "Lots of people trade this, so prices are steady."
          : big < 12
            ? "Enough people trade this that small trades barely move the price."
            : "Not many people trade this, so bigger trades move the price a lot.";
      return (
        <>
          {title("How much will my trade move the price?")}
          <div className={body}>
            <p>
              {lead} A $50 trade moves the price {inWords(small)}. A $500 trade moves it {inWords(big)}.
            </p>
            <p>The bigger the trade, the worse your average price. You’ll see exactly how much before you buy.</p>
          </div>
        </>
      );
    }
    case "how":
      return (
        <>
          {title("How this works")}
          <ol className="mt-4 space-y-4">
            {[
              ["A share pays $1 if you’re right", `Buy a “${m.yesLabel}” share and it pays $1 if that happens, or $0 if it doesn’t.`],
              ["The price is the chance", "A share that costs 64¢ means people trading here think it’s about 64% likely."],
              ["It settles on its own", "Winning shares pay out to your balance automatically. You can also sell any time before then."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden className="num grid size-6 shrink-0 place-items-center rounded-full bg-sheet-fill text-footnote font-semibold">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-body font-semibold">{t}</span>
                  <span className="mt-0.5 block text-subhead text-ink-2">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </>
      );
    case "settles":
      return (
        <>
          {title("How it settles")}
          <div className={body}>
            <p>{m.resolves}</p>
            <p>When the result is known, winning shares pay out to your balance automatically.</p>
          </div>
        </>
      );
  }
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

function TradeBar({ view }: { view: MarketView }) {
  const { m, status, pYes } = view;
  const open = useDemo((s) => s.openSheet);

  if (status === "final") {
    return (
      <div className="sticky bottom-0 z-10 border-t border-line bg-bg/90 px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] text-center text-subhead text-ink-2 backdrop-blur-xl">
        This market has settled. Trading is closed.
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 z-10 border-t border-line bg-bg/90 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-xl">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="yes"
          aria-label={`Buy Yes: ${m.yesLabel}, ${cents(pYes)} a share`}
          onClick={() => open({ kind: "trade", marketId: m.id, side: "yes" })}
        >
          <span>
            Yes · <AnimatedNumber value={pYes} format={(v) => cents(v)} />
          </span>
        </Button>
        <Button
          variant="no"
          aria-label={`Buy No: ${m.noLabel}, ${cents(1 - pYes)} a share`}
          onClick={() => open({ kind: "trade", marketId: m.id, side: "no" })}
        >
          <span>
            No · <AnimatedNumber value={1 - pYes} format={(v) => cents(v)} />
          </span>
        </Button>
      </div>
      <p className="mt-2 text-center text-caption text-ink-3 text-balance">
        A share pays $1 if you’re right. You can’t lose more than you put in.
      </p>
    </div>
  );
}
