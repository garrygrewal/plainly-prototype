/** Turning numbers into plain words. */

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const usd = (n: number) => usdFmt.format(Math.abs(n) < 0.005 ? 0 : n);

/** "+$12.40" / "−$3.10" */
export function signedUsd(n: number): string {
  if (Math.abs(n) < 0.005) return usd(0);
  return `${n > 0 ? "+" : "−"}${usd(Math.abs(n))}`;
}

/** 0.643 → "64%" */
export const pct = (p: number) => `${Math.round(p * 100)}%`;

/** 0.643 → "64¢" ; with decimals → "64.3¢" */
export const cents = (p: number, decimals = 0) =>
  `${(p * 100).toFixed(decimals)}¢`;

/** A change in chance, in points, said the everyday way: 12.3 → "+12%" */
export function signedChance(d: number): string {
  const v = Math.round(d);
  if (v === 0) return "0%";
  return `${v > 0 ? "+" : "−"}${Math.abs(v)}%`;
}

/** A change in price, in cents: 1.234 → "+1.2¢" */
export function signedCents(d: number, decimals = 1): string {
  const v = Number(d.toFixed(decimals));
  if (v === 0) return "0¢";
  return `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(decimals)}¢`;
}

/** "+18%" / "−4%" */
export function signedPct(r: number): string {
  const v = Math.round(r * 100);
  if (v === 0) return "0%";
  return `${v > 0 ? "+" : "−"}${Math.abs(v)}%`;
}

export const shares = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

/** The headline word for a probability. */
export function likelihoodWord(p: number): string {
  if (p >= 0.995) return "Happened";
  if (p <= 0.005) return "Didn’t happen";
  if (p >= 0.9) return "Very likely";
  if (p >= 0.6) return "Likely";
  if (p >= 0.53) return "Leaning yes";
  if (p > 0.47) return "Toss-up";
  if (p > 0.4) return "Leaning no";
  if (p > 0.1) return "Unlikely";
  return "Very unlikely";
}

/**
 * A probability as a natural frequency: 0.64 → "about 2 times in 3".
 * People reason about "2 in 3" far better than "64%".
 */
export function frequencyPhrase(p: number): string {
  if (p >= 0.995) return "it happened";
  if (p <= 0.005) return "it didn’t happen";
  if (p < 0.1) return `about 1 time in ${Math.round(1 / p)}`;
  if (p > 0.9) {
    const n = Math.round(1 / (1 - p));
    return `about ${n - 1} times in ${n}`;
  }
  // Closest simple fraction; ties go to the smaller denominator.
  let best = { k: 1, n: 2, err: Infinity };
  for (const n of [2, 3, 4, 5, 10]) {
    const k = Math.round(p * n);
    const err = Math.abs(p - k / n);
    if (err < best.err - 0.012) best = { k, n, err };
  }
  if (best.k === 1 && best.n === 2) return "about half the time";
  return `about ${best.k} ${best.k === 1 ? "time" : "times"} in ${best.n}`;
}

/** A hockey clock: "2nd · 14:32 left", "Final". */
export function hockeyClock(gameSeconds: number): string {
  if (gameSeconds >= 3600) return "Final";
  const period = Math.min(3, Math.floor(gameSeconds / 1200) + 1);
  const left = period * 1200 - gameSeconds;
  return `${ordinal(period)} · ${mmss(left)} left`;
}

/** Event time as a hockey fan would say it: "2nd, 4:55". */
export function eventClock(gameSeconds: number): string {
  if (gameSeconds >= 3600) return "Final";
  const period = Math.min(3, Math.floor(gameSeconds / 1200) + 1);
  const into = gameSeconds - (period - 1) * 1200;
  return `${ordinal(period)} period, ${mmss(1200 - into)} left`;
}

export function ordinal(n: number): string {
  return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
}

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
