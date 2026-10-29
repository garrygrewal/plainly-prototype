import { beforeEach, describe, expect, it } from "vitest";
import { HERO_ID, STARTING_BALANCE } from "@/lib/data/markets";
import { holdings } from "@/lib/selectors";
import { DEMO_END, balanceOf, useDemo } from "./store";

const s = () => useDemo.getState();

beforeEach(() => s().replay());

describe("demo store", () => {
  it("buying spends demo money and creates a position", () => {
    const q = s().buy(HERO_ID, "yes", 50)!;
    expect(balanceOf(s().ledger)).toBeCloseTo(STARTING_BALANCE - 50, 10);
    expect(holdings(s().ledger, HERO_ID).yes).toBeCloseTo(q.shares, 10);
  });

  it("won't spend more than the balance", () => {
    expect(s().buy(HERO_ID, "yes", STARTING_BALANCE + 1)).toBeNull();
  });

  it("cashing out straight away returns what you paid", () => {
    s().buy(HERO_ID, "no", 120);
    const r = s().cashOut(HERO_ID)!;
    expect(r.proceeds).toBeCloseTo(120, 8);
    expect(balanceOf(s().ledger)).toBeCloseTo(STARTING_BALANCE, 8);
    expect(holdings(s().ledger, HERO_ID).no).toBe(0);
  });

  it("pays $1 a share when the game resolves your way", () => {
    const q = s().buy(HERO_ID, "yes", 100)!;
    s().seek(DEMO_END + 10);
    expect(s().sims[HERO_ID].resolved).toBe("yes");
    expect(balanceOf(s().ledger)).toBeCloseTo(STARTING_BALANCE - 100 + q.shares, 8);
  });

  it("rewinding undoes trades made after that point", () => {
    s().seek(600);
    s().buy(HERO_ID, "yes", 50);
    s().seek(500);
    expect(s().ledger).toHaveLength(0);
    expect(balanceOf(s().ledger)).toBe(STARTING_BALANCE);
  });

  it("rewinding keeps earlier trades and rebuilds the same prices", () => {
    s().seek(600);
    s().buy(HERO_ID, "yes", 300);
    s().seek(900);
    const at900 = s().sims[HERO_ID].history.at(-1)!.p;
    s().seek(800);
    s().seek(900);
    expect(s().sims[HERO_ID].history.at(-1)!.p).toBeCloseTo(at900, 12);
  });

  it("sends a come-back notice after a goal when you hold a position", () => {
    s().buy(HERO_ID, "yes", 50);
    // Tick through the first goal (t=372) and the settling delay.
    for (let i = 0; i < 30; i++) s().tick(500);
    expect(s().notice?.title).toMatch(/Goal, Gulls/);
    expect(s().notice?.body).toMatch(/moved your position up \d+%/);
    expect(s().notice?.body).toMatch(/overall/);
  });

  it("doesn't credit a goal for moves that happened before you bought", () => {
    s().seek(400); // after the first goal at 372
    s().buy(HERO_ID, "yes", 50);
    for (let i = 0; i < 4; i++) s().tick(500);
    expect(s().notice?.body ?? "").not.toMatch(/up 2\d%/);
  });
});
