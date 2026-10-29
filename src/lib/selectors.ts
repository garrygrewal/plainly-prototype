import type { LedgerEntry, LiveMarket, Market, StaticMarket } from "@/lib/data/types";
import { type LmsrState, quoteSell } from "@/lib/market/lmsr";
import { type PricePoint, gameTime } from "@/lib/sim/engine";
import { randomWalk } from "@/lib/sim/rng";
import type { GameState, Team } from "@/lib/sim/winProb";

export interface Holdings {
  yes: number;
  no: number;
  /** What the user paid for the shares they still hold. */
  costYes: number;
  costNo: number;
}

/** Shares held and their cost, from the ledger. Selling or settling releases cost pro rata. */
export function holdings(ledger: LedgerEntry[], marketId: string): Holdings {
  const h: Holdings = { yes: 0, no: 0, costYes: 0, costNo: 0 };
  for (const e of ledger) {
    if (e.marketId !== marketId) continue;
    const key = e.side;
    const costKey = key === "yes" ? "costYes" : "costNo";
    if (e.kind === "buy") {
      h[key] += e.shares;
      h[costKey] += e.amount;
    } else {
      const frac = h[key] > 0 ? Math.min(1, e.shares / h[key]) : 1;
      h[costKey] -= h[costKey] * frac;
      h[key] = Math.max(0, h[key] - e.shares);
    }
  }
  if (h.yes < 1e-9) h.yes = 0;
  if (h.no < 1e-9) h.no = 0;
  return h;
}

export interface PositionSummary {
  holdings: Holdings;
  cost: number;
  /** Shares × current price. */
  worthNow: number;
  /** What selling everything right now would actually pay. */
  cashOut: number;
  pnl: number;
  pnlPct: number;
  /** Paid out if each outcome happens. */
  payoutIfYes: number;
  payoutIfNo: number;
}

export function positionSummary(
  h: Holdings,
  lmsr: LmsrState,
  pYes: number,
): PositionSummary | null {
  if (h.yes + h.no <= 0) return null;
  const cost = h.costYes + h.costNo;
  const worthNow = h.yes * pYes + h.no * (1 - pYes);
  let state = lmsr;
  let cashOut = 0;
  for (const side of ["yes", "no"] as const) {
    if (h[side] <= 0) continue;
    const q = quoteSell(state, side, h[side]);
    cashOut += q.proceeds;
    state = q.next;
  }
  return {
    holdings: h,
    cost,
    worthNow,
    cashOut,
    pnl: worthNow - cost,
    pnlPct: cost > 0 ? (worthNow - cost) / cost : 0,
    payoutIfYes: h.yes,
    payoutIfNo: h.no,
  };
}

/** Score after every goal up to game time `t`. */
export function scoreAt(m: LiveMarket, t: number): Record<Team, number> {
  const score = { home: 0, away: 0 };
  for (const ev of m.script) {
    if (ev.type === "goal" && ev.t <= t && ev.team) score[ev.team] += 1;
  }
  return score;
}

/** "Gulls lead 3–2", "Tied 2–2", "Gulls win 4–2". */
export function scoreLine(m: LiveMarket, game: GameState, atT?: number): string {
  const s = atT == null ? game.score : scoreAt(m, atT);
  if (s.home === s.away) return `Tied ${s.home}–${s.away}`;
  const lead: Team = s.home > s.away ? "home" : "away";
  const trail: Team = lead === "home" ? "away" : "home";
  const verb = game.final && atT == null ? "win" : "lead";
  return `${m.teams[lead].name} ${verb} ${s[lead]}–${s[trail]}`;
}

/** "If it ended now" for a live game. */
export function ifEndedNow(
  m: LiveMarket,
  game: GameState,
  h: Holdings,
): { line: string; payout: number | null } {
  const { home, away } = game.score;
  if (home === away) {
    return { line: `Tied ${home}–${away}, so it would go to overtime.`, payout: null };
  }
  const homeAhead = home > away;
  const yesAhead = m.yesTeam === "home" ? homeAhead : !homeAhead;
  const leader = m.teams[homeAhead ? "home" : "away"].name;
  const payout = yesAhead ? h.yes : h.no;
  return { line: `${leader} ${homeAhead ? home : away}–${homeAhead ? away : home}`, payout };
}

const staticCache = new Map<string, PricePoint[]>();

/** 30 days of made-up history for a market that isn't a live game. */
export function staticHistory(m: StaticMarket): PricePoint[] {
  let h = staticCache.get(m.id);
  if (!h) {
    h = randomWalk(m.historySeed, 31, m.pYes, m.volatility).map((p, i) => ({ t: i, p }));
    staticCache.set(m.id, h);
  }
  return h;
}

export type MarketStatus = "live" | "upcoming" | "open" | "final";

export function marketStatus(m: Market, clock: number, resolved: boolean): MarketStatus {
  if (m.kind === "static") return m.status;
  if (resolved) return "final";
  return gameTime(m, clock) > 0 ? "live" : "upcoming";
}
