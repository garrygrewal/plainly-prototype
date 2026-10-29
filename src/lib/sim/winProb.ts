/**
 * A deliberately simple hockey win-probability model.
 *
 * It gives the simulated crowd a "fair" price to trade towards, so the market
 * moves for reasons a viewer can follow: goals, power plays, injuries and the
 * clock running down.
 *
 * Model: each team's remaining goals are Poisson, with a rate set by its
 * scoring average and adjusted for the current situation. The home team wins
 * if it finishes ahead. If the game is tied, overtime goes to whichever team
 * scores more often.
 */

export type Team = "home" | "away";

export const GAME_LENGTH = 3600; // three 20-minute periods, in seconds
export const PERIOD_LENGTH = 1200;

export interface GameState {
  /** Seconds of game time played. */
  elapsed: number;
  score: Record<Team, number>;
  /** Team with the extra skater, and the game time it ends. */
  powerPlay: { team: Team; until: number } | null;
  /** Scoring multiplier per team (an injury to a top scorer lowers it). */
  strength: Record<Team, number>;
  /** Team that has pulled its goalie for an extra attacker. */
  emptyNet: Team | null;
  final: boolean;
}

export interface TeamRates {
  /** Average goals per 60 minutes. */
  home: number;
  away: number;
}

// Situation multipliers. Rough league-wide figures, good enough for a demo.
const POWER_PLAY_BOOST = 3.0;
const SHORTHANDED_FACTOR = 0.35;
const EMPTY_NET_ATTACK = 2.0;
const EMPTY_NET_CONCEDE = 5.0;

const other = (t: Team): Team => (t === "home" ? "away" : "home");

export function initialGame(): GameState {
  return {
    elapsed: 0,
    score: { home: 0, away: 0 },
    powerPlay: null,
    strength: { home: 1, away: 1 },
    emptyNet: null,
    final: false,
  };
}

/** Expected goals each team still scores, given the situation. */
export function expectedRemainingGoals(
  game: GameState,
  rates: TeamRates,
): Record<Team, number> {
  const remaining = Math.max(0, GAME_LENGTH - game.elapsed);
  const perSec = {
    home: (rates.home / GAME_LENGTH) * game.strength.home,
    away: (rates.away / GAME_LENGTH) * game.strength.away,
  };
  const goals = {
    home: perSec.home * remaining,
    away: perSec.away * remaining,
  };

  if (game.powerPlay && game.powerPlay.until > game.elapsed) {
    const left = Math.min(game.powerPlay.until, GAME_LENGTH) - game.elapsed;
    const pp = game.powerPlay.team;
    goals[pp] += perSec[pp] * (POWER_PLAY_BOOST - 1) * left;
    goals[other(pp)] += perSec[other(pp)] * (SHORTHANDED_FACTOR - 1) * left;
  }

  if (game.emptyNet) {
    const t = game.emptyNet;
    goals[t] += perSec[t] * (EMPTY_NET_ATTACK - 1) * remaining;
    goals[other(t)] += perSec[other(t)] * (EMPTY_NET_CONCEDE - 1) * remaining;
  }

  return goals;
}

function poissonPmf(lambda: number, max: number): number[] {
  const out: number[] = [];
  let p = Math.exp(-lambda);
  for (let k = 0; k <= max; k++) {
    out.push(p);
    p = (p * lambda) / (k + 1);
  }
  return out;
}

/** Probability the home team wins, from 0 to 1. */
export function homeWinProbability(game: GameState, rates: TeamRates): number {
  const lead = game.score.home - game.score.away;
  if (game.final) return lead > 0 ? 1 : 0;

  const goals = expectedRemainingGoals(game, rates);
  const MAX = 15;
  const h = poissonPmf(goals.home, MAX);
  const a = poissonPmf(goals.away, MAX);
  const overtimeHome = rates.home / (rates.home + rates.away);

  let win = 0;
  for (let i = 0; i <= MAX; i++) {
    for (let j = 0; j <= MAX; j++) {
      const d = lead + i - j;
      if (d > 0) win += h[i] * a[j];
      else if (d === 0) win += h[i] * a[j] * overtimeHome;
    }
  }
  // A live market never fully commits until the final whistle.
  return Math.min(0.99, Math.max(0.01, win));
}
