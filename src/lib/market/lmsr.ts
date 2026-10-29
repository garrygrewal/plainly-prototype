/**
 * Logarithmic Market Scoring Rule (LMSR) for a two-outcome market.
 *
 * This is the only place prices, payouts and price impact are computed, so
 * every number the UI shows is consistent with every other number.
 *
 * How it works
 * ------------
 * The market maker keeps a count of Yes shares and No shares that exist
 * (`qYes`, `qNo`). It charges traders the change in a cost function:
 *
 *   C(q) = b · ln( e^(qYes/b) + e^(qNo/b) )
 *
 * Every share pays $1 if its outcome happens and $0 otherwise, so the
 * instantaneous price of a share *is* the probability the market assigns to
 * that outcome:
 *
 *   price(Yes) = e^(qYes/b) / ( e^(qYes/b) + e^(qNo/b) )
 *   price(No)  = 1 − price(Yes)
 *
 * `b` is the liquidity parameter. A bigger `b` means it takes more money to
 * move the price. The market maker can lose at most b · ln(2).
 *
 * Units: dollars and shares. No fees. All functions are pure.
 */

export type Side = "yes" | "no";

export interface LmsrState {
  /** Liquidity parameter, in dollars. */
  b: number;
  /** Outstanding Yes shares. */
  qYes: number;
  /** Outstanding No shares. */
  qNo: number;
}

/** Result of buying a side with a dollar amount. */
export interface BuyQuote {
  side: Side;
  /** Dollars spent. Also the most you can lose. */
  cost: number;
  /** Shares received. Each pays $1 if you're right. */
  shares: number;
  /** cost / shares, in dollars per share (0–1). */
  avgPrice: number;
  /** Price of this side before / after the trade (0–1). */
  priceBefore: number;
  priceAfter: number;
  /** How far this trade moves the price, in percentage points. */
  impactPts: number;
  /** What you get back if you're right (shares × $1). */
  payoutIfRight: number;
  /** payoutIfRight − cost. */
  profitIfRight: number;
  /** Always equal to cost: you can't lose more than you put in. */
  maxLoss: number;
  /** Market state after the trade. */
  next: LmsrState;
}

/** Result of selling shares back to the market maker. */
export interface SellQuote {
  side: Side;
  shares: number;
  /** Dollars you receive. */
  proceeds: number;
  /** proceeds / shares. */
  avgPrice: number;
  priceBefore: number;
  priceAfter: number;
  /** Negative: selling pushes the price of your side down. */
  impactPts: number;
  next: LmsrState;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const logit = (p: number) => Math.log(p / (1 - p));

/** Probability of Yes, from 0 to 1. */
export function priceYes(s: LmsrState): number {
  return sigmoid((s.qYes - s.qNo) / s.b);
}

export function price(s: LmsrState, side: Side): number {
  const p = priceYes(s);
  return side === "yes" ? p : 1 - p;
}

/** The cost function C(q), computed with log-sum-exp so it never overflows. */
export function cost(s: LmsrState): number {
  const a = s.qYes / s.b;
  const c = s.qNo / s.b;
  const m = Math.max(a, c);
  return s.b * (m + Math.log(Math.exp(a - m) + Math.exp(c - m)));
}

function addShares(s: LmsrState, side: Side, shares: number): LmsrState {
  return side === "yes"
    ? { ...s, qYes: s.qYes + shares }
    : { ...s, qNo: s.qNo + shares };
}

/**
 * A market whose current Yes price is `pYes`.
 * Only the difference qYes − qNo sets the price, so we put it all in qYes.
 */
export function marketAtPrice(b: number, pYes: number): LmsrState {
  return { b, qYes: b * logit(pYes), qNo: 0 };
}

/**
 * Dollars needed to buy `shares` of `side`.
 *
 * Equal to C(after) − C(before), rewritten in terms of the current price p
 * so it stays numerically stable:  b · ln( p · e^(Δ/b) + (1 − p) )
 */
export function costToBuy(s: LmsrState, side: Side, shares: number): number {
  const p = price(s, side);
  return s.b * Math.log(p * Math.exp(shares / s.b) + (1 - p));
}

/**
 * Dollars received for selling `shares` of `side`: C(before) − C(after).
 *   −b · ln( p · e^(−Δ/b) + (1 − p) )
 */
export function proceedsFromSell(
  s: LmsrState,
  side: Side,
  shares: number,
): number {
  const p = price(s, side);
  return -s.b * Math.log(p * Math.exp(-shares / s.b) + (1 - p));
}

/**
 * Shares you get for spending `amount` dollars on `side`. This is the exact
 * inverse of `costToBuy`, solved in closed form:
 *
 *   Δ = b · ln( (e^(A/b) − (1 − p)) / p )
 */
export function sharesForAmount(
  s: LmsrState,
  side: Side,
  amount: number,
): number {
  if (amount <= 0) return 0;
  const p = price(s, side);
  return s.b * Math.log((Math.exp(amount / s.b) - (1 - p)) / p);
}

export function quoteBuy(s: LmsrState, side: Side, amount: number): BuyQuote {
  const shares = sharesForAmount(s, side, amount);
  const next = addShares(s, side, shares);
  const priceBefore = price(s, side);
  const priceAfter = price(next, side);
  return {
    side,
    cost: amount,
    shares,
    avgPrice: shares > 0 ? amount / shares : priceBefore,
    priceBefore,
    priceAfter,
    impactPts: (priceAfter - priceBefore) * 100,
    payoutIfRight: shares,
    profitIfRight: shares - amount,
    maxLoss: amount,
    next,
  };
}

export function quoteSell(s: LmsrState, side: Side, shares: number): SellQuote {
  const proceeds = shares > 0 ? proceedsFromSell(s, side, shares) : 0;
  const next = addShares(s, side, -shares);
  const priceBefore = price(s, side);
  const priceAfter = price(next, side);
  return {
    side,
    shares,
    proceeds,
    avgPrice: shares > 0 ? proceeds / shares : priceBefore,
    priceBefore,
    priceAfter,
    impactPts: (priceAfter - priceBefore) * 100,
    next,
  };
}

/** How many percentage points a trade of `amount` dollars would move `side`. */
export function impactOf(s: LmsrState, side: Side, amount: number): number {
  return quoteBuy(s, side, amount).impactPts;
}

/**
 * Move the market to a target Yes price by buying whichever side is needed.
 * Used by the simulated crowd of other traders. Returns the new state.
 */
export function moveToPrice(s: LmsrState, targetYes: number): LmsrState {
  const target = Math.min(0.995, Math.max(0.005, targetYes));
  const diff = s.b * logit(target) - (s.qYes - s.qNo);
  return diff >= 0 ? addShares(s, "yes", diff) : addShares(s, "no", -diff);
}

export const _internal = { sigmoid, logit };
