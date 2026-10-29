import { describe, expect, it } from "vitest";
import { HERO_ID, getMarket } from "@/lib/data/markets";
import type { LedgerEntry, LiveMarket } from "@/lib/data/types";
import { quoteBuy } from "@/lib/market/lmsr";
import { STEP, eventMove, simPrice, simulateTo } from "./engine";
import { nextRandom, randomWalk } from "./rng";
import { homeWinProbability, initialGame } from "./winProb";

const hero = getMarket(HERO_ID) as LiveMarket;

describe("rng", () => {
  it("is deterministic for a seed", () => {
    const a = nextRandom(42);
    const b = nextRandom(42);
    expect(a).toEqual(b);
    expect(a[0]).toBeGreaterThanOrEqual(0);
    expect(a[0]).toBeLessThan(1);
  });

  it("random walks end on the price you ask for", () => {
    const walk = randomWalk(7, 30, 0.41, 0.05);
    expect(walk).toHaveLength(30);
    expect(walk[walk.length - 1]).toBe(0.41);
  });
});

describe("win probability", () => {
  const rates = { home: 3.2, away: 2.9 };

  it("favours the better home team slightly before the game", () => {
    const p = homeWinProbability(initialGame(), rates);
    expect(p).toBeGreaterThan(0.5);
    expect(p).toBeLessThan(0.6);
  });

  it("a goal helps, and the same lead is worth more later on", () => {
    const early = { ...initialGame(), elapsed: 400, score: { home: 1, away: 0 } };
    const late = { ...early, elapsed: 3300 };
    const p0 = homeWinProbability(initialGame(), rates);
    expect(homeWinProbability(early, rates)).toBeGreaterThan(p0);
    expect(homeWinProbability(late, rates)).toBeGreaterThan(
      homeWinProbability(early, rates),
    );
  });

  it("is certain once the game is final", () => {
    const g = { ...initialGame(), final: true, score: { home: 2, away: 3 } };
    expect(homeWinProbability(g, rates)).toBe(0);
  });
});

describe("simulation", () => {
  it("plays out identically every time", () => {
    const a = simulateTo(hero, 2000);
    const b = simulateTo(hero, 2000);
    expect(a.history).toEqual(b.history);
    expect(simPrice(a)).toBe(simPrice(b));
  });

  it("records a price every step", () => {
    const s = simulateTo(hero, 600);
    expect(s.history).toHaveLength(600 / STEP + 1);
    expect(s.clock).toBe(600);
  });

  it("the first goal moves the price up, the Lynx lead moves it down", () => {
    const s = simulateTo(hero, 2400);
    const g1 = hero.script.find((e) => e.id === "g1")!;
    const g3 = hero.script.find((e) => e.id === "g3")!;
    const m1 = eventMove(s.history, g1);
    const m3 = eventMove(s.history, g3);
    expect(m1.after - m1.before).toBeGreaterThan(0.05);
    expect(m3.after - m3.before).toBeLessThan(-0.08);
  });

  it("resolves Yes when the Gulls win", () => {
    const s = simulateTo(hero, 3700);
    expect(s.game.score).toEqual({ home: 4, away: 2 });
    expect(s.resolved).toBe("yes");
    expect(simPrice(s)).toBe(1);
  });

  it("replays the user's trades at the time they made them", () => {
    const before = simulateTo(hero, 500);
    const q = quoteBuy(before.lmsr, "yes", 500);
    const trade: LedgerEntry = {
      id: "t1",
      marketId: hero.id,
      t: 500,
      kind: "buy",
      side: "yes",
      amount: 500,
      shares: q.shares,
    };
    // A sim that never saw the trade vs. one rebuilt with it in the ledger.
    const without = simulateTo(hero, 510);
    const withTrade = simulateTo(hero, 510, [trade]);
    expect(simPrice(withTrade)).toBeGreaterThan(simPrice(without));
  });

  it("the crowd pulls a trade's price impact back toward fair value", () => {
    const at = simulateTo(hero, 500);
    const q = quoteBuy(at.lmsr, "yes", 2000);
    const trade: LedgerEntry = {
      id: "t1",
      marketId: hero.id,
      t: 500,
      kind: "buy",
      side: "yes",
      amount: 2000,
      shares: q.shares,
    };
    const later = simulateTo(hero, 700, [trade]);
    const baseline = simulateTo(hero, 700);
    expect(Math.abs(simPrice(later) - simPrice(baseline))).toBeLessThan(0.01);
  });
});
