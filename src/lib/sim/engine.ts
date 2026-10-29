/**
 * The live-game simulation.
 *
 * Each step (5 game seconds):
 *   1. Fire any scripted events (goals, penalties…) and update the game.
 *   2. Work out a fair price from the win-probability model.
 *   3. The crowd of other traders buys whichever side is cheap, closing part
 *      of the gap to the fair price, plus a little seeded noise (their mood).
 *
 * The script and the noise are both fixed, so a game plays out the same way
 * every time. A snapshot is plain data, so rewinding is just re-simulating
 * from the start and re-applying the user's trades at the times they made them.
 */

import type { GameEvent, LedgerEntry, LiveMarket } from "@/lib/data/types";
import {
  type LmsrState,
  type Side,
  _internal,
  marketAtPrice,
  moveToPrice,
  priceYes,
} from "@/lib/market/lmsr";
import { nextGaussian } from "./rng";
import {
  GAME_LENGTH,
  type GameState,
  homeWinProbability,
  initialGame,
} from "./winProb";

const { sigmoid, logit } = _internal;

/** Game seconds per simulation step. */
export const STEP = 5;
/** Share of the gap to the fair price the crowd closes each step. */
const CROWD_SPEED = 0.28;
/** How quickly the crowd's mood drifts back to neutral each step. */
const MOOD_DECAY = 0.1;

export interface PricePoint {
  /** Game seconds. */
  t: number;
  /** Probability of Yes, 0–1. */
  p: number;
}

export interface LiveSim {
  marketId: string;
  /** Demo clock time this snapshot is at. Always a multiple of STEP. */
  clock: number;
  rng: number;
  /** The crowd's mood, in log-odds, layered on top of the fair price. */
  mood: number;
  lmsr: LmsrState;
  game: GameState;
  history: PricePoint[];
  /** Ids of events that have happened. */
  fired: string[];
  /** Winning side once the game is over. */
  resolved: Side | null;
}

/** This game's clock (0–3600) at a given demo clock time. */
export function gameTime(m: LiveMarket, clock: number): number {
  return Math.min(GAME_LENGTH, Math.max(0, clock + m.clockOffset));
}

function yesProbability(m: LiveMarket, game: GameState): number {
  const home = homeWinProbability(game, m.rates);
  return m.yesTeam === "home" ? home : 1 - home;
}

/** A game at puck drop, priced at its fair value. */
export function createSim(m: LiveMarket): LiveSim {
  const game = initialGame();
  const p = yesProbability(m, game);
  return {
    marketId: m.id,
    clock: -m.clockOffset,
    rng: m.seed,
    mood: 0,
    lmsr: marketAtPrice(m.b, p),
    game,
    history: [{ t: 0, p }],
    fired: [],
    resolved: null,
  };
}

function applyEvent(game: GameState, ev: GameEvent): GameState {
  switch (ev.type) {
    case "goal": {
      const team = ev.team!;
      return {
        ...game,
        score: { ...game.score, [team]: game.score[team] + 1 },
        // A power-play goal ends the power play.
        powerPlay: game.powerPlay?.team === team ? null : game.powerPlay,
      };
    }
    case "penalty": {
      const team = ev.team === "home" ? "away" : "home";
      return { ...game, powerPlay: { team, until: ev.t + 120 } };
    }
    case "injury":
      return {
        ...game,
        strength: { ...game.strength, [ev.team!]: ev.strength ?? 0.85 },
      };
    case "goalie_pulled":
      return { ...game, emptyNet: ev.team! };
    case "final":
      return { ...game, final: true };
    default:
      return game;
  }
}

/** Advance one step. Returns the new snapshot and any events that fired. */
export function stepSim(
  sim: LiveSim,
  m: LiveMarket,
): { sim: LiveSim; fired: GameEvent[] } {
  const clock = sim.clock + STEP;
  if (sim.resolved) return { sim: { ...sim, clock }, fired: [] };

  const from = gameTime(m, sim.clock);
  const to = gameTime(m, clock);
  const fired = m.script.filter((ev) => ev.t > from && ev.t <= to);

  let game = fired.reduce(applyEvent, sim.game);
  game = { ...game, elapsed: to };
  if (game.powerPlay && game.powerPlay.until <= to) {
    game = { ...game, powerPlay: null };
  }

  const next: LiveSim = {
    ...sim,
    clock,
    game,
    fired: fired.length ? [...sim.fired, ...fired.map((e) => e.id)] : sim.fired,
  };

  if (game.final) {
    const homeWon = game.score.home > game.score.away;
    const yesWon = m.yesTeam === "home" ? homeWon : !homeWon;
    next.resolved = yesWon ? "yes" : "no";
    next.history = [...sim.history, { t: to, p: yesWon ? 1 : 0 }];
    return { sim: next, fired };
  }

  // The crowd's mood wanders a little, then the crowd trades toward
  // fair value + mood, closing part of the gap each step.
  const [z, rng] = nextGaussian(sim.rng);
  const mood = sim.mood * (1 - MOOD_DECAY) + z * m.noise;
  const target = logit(yesProbability(m, game)) + mood;
  const now = logit(priceYes(sim.lmsr));
  const lmsr = moveToPrice(sim.lmsr, sigmoid(now + CROWD_SPEED * (target - now)));

  next.rng = rng;
  next.mood = mood;
  next.lmsr = lmsr;
  next.history = [...sim.history, { t: to, p: priceYes(lmsr) }];
  return { sim: next, fired };
}

/** Apply one of the user's trades to the market maker. */
export function applyTrade(lmsr: LmsrState, entry: LedgerEntry): LmsrState {
  if (entry.kind === "payout") return lmsr;
  const delta = entry.kind === "buy" ? entry.shares : -entry.shares;
  return entry.side === "yes"
    ? { ...lmsr, qYes: lmsr.qYes + delta }
    : { ...lmsr, qNo: lmsr.qNo + delta };
}

/**
 * Step forward to `toClock`. When rebuilding after a rewind, pass the user's
 * ledger so their trades are replayed at the step they were made in.
 */
export function advanceSim(
  start: LiveSim,
  m: LiveMarket,
  toClock: number,
  ledger: LedgerEntry[] = [],
): { sim: LiveSim; fired: GameEvent[] } {
  const trades = ledger.filter((e) => e.marketId === m.id && e.kind !== "payout");
  const replay = (s: LiveSim) =>
    trades
      .filter((e) => e.t >= s.clock && e.t < s.clock + STEP)
      .reduce((acc, e) => ({ ...acc, lmsr: applyTrade(acc.lmsr, e) }), s);

  let sim = start;
  const fired: GameEvent[] = [];
  while (sim.clock + STEP <= toClock) {
    const r = stepSim(sim, m);
    sim = replay(r.sim);
    fired.push(...r.fired);
  }
  return { sim, fired };
}

/** A fresh snapshot of `m` at demo clock `toClock`. */
export function simulateTo(
  m: LiveMarket,
  toClock: number,
  ledger: LedgerEntry[] = [],
): LiveSim {
  return advanceSim(createSim(m), m, toClock, ledger).sim;
}

/** Current Yes probability, including the effect of the user's own trades. */
export function simPrice(sim: LiveSim): number {
  if (sim.resolved) return sim.resolved === "yes" ? 1 : 0;
  return priceYes(sim.lmsr);
}

/** How the price moved around an event: just before it, and a minute later. */
export function eventMove(
  history: PricePoint[],
  ev: GameEvent,
): { before: number; after: number; settled: boolean } {
  let before = history[0]?.p ?? 0.5;
  let after = before;
  const settleAt = ev.t + 60;
  for (const pt of history) {
    if (pt.t < ev.t) before = pt.p;
    if (pt.t <= settleAt) after = pt.p;
  }
  const last = history[history.length - 1];
  return { before, after, settled: !!last && last.t >= settleAt };
}
