/**
 * Seeded random numbers (mulberry32). The generator's whole state is one
 * 32-bit integer, which we keep in the simulation snapshot. That makes the
 * demo replay identically every time, and lets us rewind by re-simulating.
 */

/** Returns a float in [0, 1) and the next state. */
export function nextRandom(state: number): [number, number] {
  const s = (state + 0x6d2b79f5) | 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

/** Standard normal sample (Box–Muller) and the next state. */
export function nextGaussian(state: number): [number, number] {
  const [u1, s1] = nextRandom(state);
  const [u2, s2] = nextRandom(s1);
  const z = Math.sqrt(-2 * Math.log(1 - u1)) * Math.cos(2 * Math.PI * u2);
  return [z, s2];
}

/** A seeded random walk in probability space, used for static markets' history. */
export function randomWalk(
  seed: number,
  steps: number,
  end: number,
  volatility: number,
): number[] {
  // Walk backwards from today's price so the series always ends at `end`.
  let state = seed;
  let x = Math.log(end / (1 - end));
  const out = [end];
  for (let i = 1; i < steps; i++) {
    const [z, next] = nextGaussian(state);
    state = next;
    x += z * volatility;
    out.push(1 / (1 + Math.exp(-x)));
  }
  return out.reverse();
}
