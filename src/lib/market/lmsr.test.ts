import { describe, expect, it } from "vitest";
import {
  cost,
  costToBuy,
  impactOf,
  marketAtPrice,
  moveToPrice,
  price,
  priceYes,
  proceedsFromSell,
  quoteBuy,
  quoteSell,
  sharesForAmount,
} from "./lmsr";

const market = marketAtPrice(2400, 0.58);

describe("prices", () => {
  it("starts at the requested price", () => {
    expect(priceYes(market)).toBeCloseTo(0.58, 10);
  });

  it("Yes and No always add up to $1", () => {
    for (const p of [0.02, 0.3, 0.5, 0.77, 0.98]) {
      const s = marketAtPrice(1000, p);
      expect(price(s, "yes") + price(s, "no")).toBeCloseTo(1, 12);
    }
  });

  it("a 50/50 market prices both sides at 50¢", () => {
    const s = { b: 500, qYes: 0, qNo: 0 };
    expect(priceYes(s)).toBe(0.5);
  });
});

describe("buying", () => {
  it("costs exactly the change in the cost function", () => {
    const shares = 120;
    const after = { ...market, qYes: market.qYes + shares };
    expect(costToBuy(market, "yes", shares)).toBeCloseTo(
      cost(after) - cost(market),
      8,
    );
  });

  it("sharesForAmount is the exact inverse of costToBuy", () => {
    for (const amount of [1, 50, 500, 5000]) {
      for (const side of ["yes", "no"] as const) {
        const n = sharesForAmount(market, side, amount);
        expect(costToBuy(market, side, n)).toBeCloseTo(amount, 8);
      }
    }
  });

  it("you get more than one share per dollar when the price is below $1", () => {
    const q = quoteBuy(market, "yes", 50);
    expect(q.shares).toBeGreaterThan(50);
    expect(q.payoutIfRight).toBe(q.shares);
    expect(q.profitIfRight).toBeCloseTo(q.shares - 50, 10);
  });

  it("you can never lose more than you put in", () => {
    const q = quoteBuy(market, "no", 75);
    expect(q.maxLoss).toBe(75);
    expect(q.cost).toBe(75);
  });

  it("the average price sits between the price before and after", () => {
    const q = quoteBuy(market, "yes", 500);
    expect(q.avgPrice).toBeGreaterThan(q.priceBefore);
    expect(q.avgPrice).toBeLessThan(q.priceAfter);
  });

  it("buying Yes pushes Yes up and No down by the same amount", () => {
    const q = quoteBuy(market, "yes", 200);
    expect(q.impactPts).toBeGreaterThan(0);
    expect(price(q.next, "no")).toBeCloseTo(1 - q.priceAfter, 12);
  });

  it("bigger trades move the price more, and cost more per share", () => {
    const amounts = [10, 50, 100, 500, 1000];
    const quotes = amounts.map((a) => quoteBuy(market, "yes", a));
    for (let i = 1; i < quotes.length; i++) {
      expect(quotes[i].impactPts).toBeGreaterThan(quotes[i - 1].impactPts);
      expect(quotes[i].avgPrice).toBeGreaterThan(quotes[i - 1].avgPrice);
    }
  });

  it("matches the liquidity copy: $50 moves ~1 pt, $500 moves several", () => {
    expect(impactOf(market, "yes", 50)).toBeGreaterThan(0.6);
    expect(impactOf(market, "yes", 50)).toBeLessThan(1.4);
    expect(impactOf(market, "yes", 500)).toBeGreaterThan(5);
    expect(impactOf(market, "yes", 500)).toBeLessThan(12);
  });

  it("zero dollars buys zero shares", () => {
    expect(sharesForAmount(market, "yes", 0)).toBe(0);
    expect(quoteBuy(market, "yes", 0).impactPts).toBe(0);
  });
});

describe("selling", () => {
  it("buying then selling straight away gives your money back (no fees)", () => {
    const buy = quoteBuy(market, "yes", 250);
    const sell = quoteSell(buy.next, "yes", buy.shares);
    expect(sell.proceeds).toBeCloseTo(250, 8);
    expect(priceYes(sell.next)).toBeCloseTo(priceYes(market), 12);
  });

  it("selling pays less than the current price per share (price impact)", () => {
    const buy = quoteBuy(market, "no", 400);
    const sell = quoteSell(buy.next, "no", buy.shares);
    expect(sell.avgPrice).toBeLessThan(sell.priceBefore);
    expect(sell.impactPts).toBeLessThan(0);
  });

  it("proceeds equal the drop in the cost function", () => {
    const s = { ...market, qYes: market.qYes + 300 };
    const after = { ...s, qYes: s.qYes - 300 };
    expect(proceedsFromSell(s, "yes", 300)).toBeCloseTo(cost(s) - cost(after), 8);
  });

  it("shares are worth $1 each when the price is near certain", () => {
    const s = marketAtPrice(2000, 0.99);
    const sell = quoteSell(s, "yes", 10);
    expect(sell.proceeds).toBeGreaterThan(9.85);
    expect(sell.proceeds).toBeLessThan(10);
  });
});

describe("moveToPrice", () => {
  it("lands exactly on the target", () => {
    for (const target of [0.1, 0.45, 0.62, 0.9]) {
      expect(priceYes(moveToPrice(market, target))).toBeCloseTo(target, 10);
    }
  });

  it("never pushes the market fully to 0 or 1", () => {
    expect(priceYes(moveToPrice(market, 1))).toBeLessThan(1);
    expect(priceYes(moveToPrice(market, 0))).toBeGreaterThan(0);
  });
});
