"use client";

import { create } from "zustand";
import {
  DEMO_START,
  LIVE_MARKETS,
  MARKETS,
  STARTING_BALANCE,
  getMarket,
} from "@/lib/data/markets";
import type { GameEvent, LedgerEntry, LiveMarket } from "@/lib/data/types";
import {
  type BuyQuote,
  type LmsrState,
  type SellQuote,
  type Side,
  marketAtPrice,
  quoteBuy,
  quoteSell,
} from "@/lib/market/lmsr";
import {
  type LiveSim,
  STEP,
  advanceSim,
  applyTrade,
  eventMove,
  simPrice,
  simulateTo,
} from "@/lib/sim/engine";
import { GAME_LENGTH } from "@/lib/sim/winProb";
import { pct, signedPct, signedUsd, usd } from "@/lib/format";
import { holdings, scoreLine } from "@/lib/selectors";

/** Demo clock time when every game is over. */
export const DEMO_END = Math.max(...LIVE_MARKETS.map((m) => GAME_LENGTH - m.clockOffset));
/** Wait this long after an event before telling the user how it moved them. */
const NOTICE_DELAY = 40;

export type Sheet =
  | { kind: "trade"; marketId: string; side: Side }
  | { kind: "cashout"; marketId: string };

export interface Notice {
  id: string;
  marketId: string;
  eventId: string;
  title: string;
  body: string;
}

interface PendingNotice {
  marketId: string;
  eventId: string;
  fireAt: number;
}

interface DemoData {
  /** Demo clock, in game seconds. Moves continuously; sims step every 5s. */
  clock: number;
  playing: boolean;
  speed: number;
  sims: Record<string, LiveSim>;
  statics: Record<string, LmsrState>;
  ledger: LedgerEntry[];
  pending: PendingNotice[];
  notice: Notice | null;
  sheet: Sheet | null;
  /** Set by a notification tap: which moment the market screen should open on. */
  focusEvent: { marketId: string; eventId: string; at: number } | null;
  seq: number;
}

interface DemoActions {
  tick: (realMs: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  seek: (clock: number) => void;
  nextEvent: () => void;
  replay: () => void;
  buy: (marketId: string, side: Side, amount: number) => BuyQuote | null;
  cashOut: (marketId: string) => { proceeds: number; quotes: SellQuote[] } | null;
  openSheet: (sheet: Sheet) => void;
  closeSheet: () => void;
  dismissNotice: () => void;
}

export type DemoState = DemoData & DemoActions;

const snap = (clock: number) => Math.floor(clock / STEP) * STEP;

function initialStatics(ledger: LedgerEntry[] = []): Record<string, LmsrState> {
  const out: Record<string, LmsrState> = {};
  for (const m of MARKETS) {
    if (m.kind !== "static") continue;
    out[m.id] = ledger
      .filter((e) => e.marketId === m.id)
      .reduce(applyTrade, marketAtPrice(m.b, m.pYes));
  }
  return out;
}

function initialData(): DemoData {
  return {
    clock: DEMO_START,
    playing: true,
    speed: 20,
    sims: Object.fromEntries(
      LIVE_MARKETS.map((m) => [m.id, simulateTo(m, DEMO_START)]),
    ),
    statics: initialStatics(),
    ledger: [],
    pending: [],
    notice: null,
    sheet: null,
    focusEvent: null,
    seq: 0,
  };
}

function priceBefore(history: { t: number; p: number }[], t: number): number {
  let p = history[0]?.p ?? 0.5;
  for (const pt of history) if (pt.t <= t) p = pt.p;
  return p;
}

/** Builds the come-back notification once the price has settled after an event. */
function buildNotice(
  data: DemoData,
  p: PendingNotice,
  id: string,
): Notice | null {
  const m = getMarket(p.marketId) as LiveMarket;
  const sim = data.sims[m.id];
  const ev = m.script.find((e) => e.id === p.eventId)!;
  const team = (t: GameEvent["team"]) => m.teams[t ?? "home"].name;

  if (ev.type === "final") {
    const paid = data.ledger
      .filter((e) => e.marketId === m.id && e.kind === "payout")
      .reduce((sum, e) => sum + e.amount, 0);
    const owned = data.ledger.some((e) => e.marketId === m.id && e.kind === "payout");
    return {
      id,
      marketId: m.id,
      eventId: ev.id,
      title: `Final. ${scoreLine(m, sim.game)}.`,
      body: owned
        ? paid > 0
          ? `Your shares paid out ${usd(paid)}. It’s in your balance.`
          : "Your shares didn’t pay out this time."
        : `The market has ended: ${sim.resolved === "yes" ? m.yesLabel : m.noLabel}.`,
    };
  }

  const title = `${ev.title}. ${scoreLine(m, sim.game, ev.t)}.`;
  const { before } = eventMove(sim.history, ev);
  const now = simPrice(sim);
  const held = holdings(data.ledger, m.id);

  if (held.yes + held.no > 0) {
    // Only credit the event with moves after both it and the user's last buy.
    const lastBuy = Math.max(
      -Infinity,
      ...data.ledger.filter((e) => e.marketId === m.id && e.kind === "buy").map((e) => e.t + m.clockOffset),
    );
    const from = lastBuy > ev.t ? priceBefore(sim.history, lastBuy) : before;
    const value = (py: number) => held.yes * py + held.no * (1 - py);
    const change = value(now) / value(from) - 1;
    const pnl = value(now) - held.costYes - held.costNo;
    const overall = `You’re ${signedUsd(pnl)} overall.`;
    return {
      id,
      marketId: m.id,
      eventId: ev.id,
      title,
      body:
        Math.abs(change) >= 0.01
          ? `That moved your position ${change > 0 ? "up" : "down"} ${signedPct(change).replace(/^[+−]/, "")}. ${overall}`
          : overall,
    };
  }
  if (!m.followed) return null;
  return {
    id,
    marketId: m.id,
    eventId: ev.id,
    title,
    body: `${team(m.yesTeam)} now ${pct(now)} to win, from ${pct(before)}.`,
  };
}

/** Steps every live game forward to `target`, settling payouts and queuing notices. */
function stepForward(data: DemoData, target: number, quiet = false): Partial<DemoData> {
  const sims = { ...data.sims };
  let ledger = data.ledger;
  let pending = data.pending;
  let seq = data.seq;

  for (const m of LIVE_MARKETS) {
    const prev = sims[m.id];
    const { sim, fired } = advanceSim(prev, m, snap(target));
    sims[m.id] = sim;

    for (const ev of fired) {
      if (ev.type !== "goal" && ev.type !== "final") continue;
      const held = holdings(ledger, m.id);
      if (!m.followed && held.yes + held.no === 0) continue;
      const at = ev.t - m.clockOffset;
      pending = [
        ...pending,
        { marketId: m.id, eventId: ev.id, fireAt: at + (ev.type === "final" ? 5 : NOTICE_DELAY) },
      ];
    }

    // Settle: winning shares pay $1 each; losing shares close at $0.
    if (!prev.resolved && sim.resolved) {
      const held = holdings(ledger, m.id);
      for (const side of ["yes", "no"] as const) {
        if (held[side] <= 0) continue;
        ledger = [
          ...ledger,
          {
            id: `l${++seq}`,
            marketId: m.id,
            t: sim.clock,
            kind: "payout",
            side,
            shares: held[side],
            amount: side === sim.resolved ? held[side] : 0,
          },
        ];
      }
    }
  }

  const draft = { ...data, sims, ledger, seq };
  const due = pending.filter((p) => p.fireAt <= target);
  let notice = data.notice;
  for (const p of due) {
    const n = buildNotice(draft, p, `n${++seq}`);
    if (n) notice = n;
  }
  if (quiet && due.length) notice = data.notice;

  return {
    clock: target,
    sims,
    ledger,
    seq,
    pending: pending.filter((p) => p.fireAt > target),
    notice,
  };
}

export const useDemo = create<DemoState>()((set, get) => ({
  ...initialData(),

  tick(realMs) {
    const s = get();
    if (!s.playing) return;
    const target = Math.min(DEMO_END + 10, s.clock + (realMs / 1000) * s.speed);
    const next = stepForward(s, target);
    set({ ...next, playing: target < DEMO_END + 10 });
  },

  setPlaying(playing) {
    const s = get();
    // Pressing play at the end starts again.
    if (playing && s.clock >= DEMO_END + 10) return get().replay();
    set({ playing });
  },

  setSpeed(speed) {
    set({ speed });
  },

  seek(clock) {
    const s = get();
    const target = Math.max(0, Math.min(DEMO_END + 10, clock));
    if (target >= s.clock) {
      set(stepForward(s, target, true));
      return;
    }
    // Rewinding: forget anything after `target`, then rebuild every market
    // by replaying the script and the user's remaining trades.
    const ledger = s.ledger.filter((e) => e.t <= target);
    set({
      clock: target,
      ledger,
      sims: Object.fromEntries(
        LIVE_MARKETS.map((m) => [m.id, simulateTo(m, snap(target), ledger)]),
      ),
      statics: initialStatics(ledger),
      pending: [],
      notice: null,
    });
  },

  nextEvent() {
    const s = get();
    const upcoming = LIVE_MARKETS.flatMap((m) =>
      m.script
        .filter((e) => e.type !== "period_end")
        .map((e) => e.t - m.clockOffset),
    )
      .filter((t) => t > s.clock + 6)
      .sort((a, b) => a - b);
    if (upcoming.length) {
      // Land just before it, so the move plays out on screen.
      get().seek(upcoming[0] - 5);
      set({ playing: true });
    }
  },

  replay() {
    set({ ...initialData() });
  },

  buy(marketId, side, amount) {
    const s = get();
    const m = getMarket(marketId);
    if (!m || amount <= 0) return null;
    if (amount > balanceOf(s.ledger) + 1e-9) return null;

    const lmsr = m.kind === "live" ? s.sims[m.id] : null;
    if (lmsr?.resolved) return null;
    const state = lmsr ? lmsr.lmsr : s.statics[m.id];
    const q = quoteBuy(state, side, amount);
    const entry: LedgerEntry = {
      id: `l${s.seq + 1}`,
      marketId,
      t: s.clock,
      kind: "buy",
      side,
      amount,
      shares: q.shares,
    };
    set({
      seq: s.seq + 1,
      ledger: [...s.ledger, entry],
      ...(lmsr
        ? { sims: { ...s.sims, [m.id]: { ...lmsr, lmsr: q.next } } }
        : { statics: { ...s.statics, [m.id]: q.next } }),
    });
    return q;
  },

  cashOut(marketId) {
    const s = get();
    const m = getMarket(marketId);
    if (!m) return null;
    const sim = m.kind === "live" ? s.sims[m.id] : null;
    if (sim?.resolved) return null;

    const held = holdings(s.ledger, marketId);
    let state = sim ? sim.lmsr : s.statics[m.id];
    let seq = s.seq;
    const quotes: SellQuote[] = [];
    const entries: LedgerEntry[] = [];
    for (const side of ["yes", "no"] as const) {
      if (held[side] <= 1e-9) continue;
      const q = quoteSell(state, side, held[side]);
      state = q.next;
      quotes.push(q);
      entries.push({
        id: `l${++seq}`,
        marketId,
        t: s.clock,
        kind: "sell",
        side,
        amount: q.proceeds,
        shares: held[side],
      });
    }
    if (!quotes.length) return null;
    set({
      seq,
      ledger: [...s.ledger, ...entries],
      ...(sim
        ? { sims: { ...s.sims, [m.id]: { ...sim, lmsr: state } } }
        : { statics: { ...s.statics, [m.id]: state } }),
    });
    return { proceeds: quotes.reduce((a, q) => a + q.proceeds, 0), quotes };
  },

  openSheet(sheet) {
    set({ sheet });
  },
  closeSheet() {
    set({ sheet: null });
  },
  dismissNotice() {
    set({ notice: null });
  },
}));

/** Demo-money balance from the ledger. */
export function balanceOf(ledger: LedgerEntry[]): number {
  return ledger.reduce(
    (bal, e) => (e.kind === "buy" ? bal - e.amount : bal + e.amount),
    STARTING_BALANCE,
  );
}
