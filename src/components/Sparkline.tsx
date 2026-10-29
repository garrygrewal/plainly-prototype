import type { PricePoint } from "@/lib/sim/engine";

/** A tiny price line. Decorative: the card states the number in words. */
export function Sparkline({
  points,
  domain,
  width = 96,
  height = 36,
}: {
  points: PricePoint[];
  domain: [number, number];
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return <svg width={width} height={height} aria-hidden />;
  // Thin out long histories; ~60 points is plenty at this size.
  const every = Math.max(1, Math.floor(points.length / 60));
  const pts = points.filter((_, i) => i % every === 0 || i === points.length - 1);
  const sx = (t: number) => ((t - domain[0]) / (domain[1] - domain[0])) * (width - 4) + 2;
  const sy = (p: number) => 3 + (1 - p) * (height - 6);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${sx(p.t).toFixed(1)},${sy(p.p).toFixed(1)}`).join("");
  const last = pts[pts.length - 1];

  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <line x1={0} x2={width} y1={sy(0.5)} y2={sy(0.5)} stroke="var(--line)" strokeDasharray="2 3" />
      <path d={d} fill="none" stroke="var(--yes)" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={sx(last.t)} cy={sy(last.p)} r={2.5} fill="var(--yes)" />
    </svg>
  );
}
