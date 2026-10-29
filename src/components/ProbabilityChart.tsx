"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import type { EventType } from "@/lib/data/types";
import type { PricePoint } from "@/lib/sim/engine";
import { useWidth } from "./hooks";

export interface ChartEvent {
  id: string;
  x: number;
  type: EventType;
  /** Which outcome the event helps. Drives colour; shape and label carry it too. */
  side: "yes" | "no" | null;
  label: string;
}

interface Props {
  points: PricePoint[];
  /** Current price, drawn as the live head (includes the user's own trades). */
  head: number;
  domain: [number, number];
  events: ChartEvent[];
  /** Vertical rules, e.g. period breaks. */
  dividers?: number[];
  xLabels: { x: number; label: string }[];
  live: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  height?: number;
}

const PAD = { t: 14, r: 40, b: 26, l: 2 };

/**
 * Probability over time, with markers for the moments that moved it.
 * Hand-rolled SVG so markers can be real, focusable buttons.
 */
export function ProbabilityChart({
  points,
  head,
  domain,
  events,
  dividers = [],
  xLabels,
  live,
  selectedId,
  onSelect,
  height = 200,
}: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const reduce = useReducedMotion();
  const clipId = useId();
  const gradId = useId();

  const W = width;
  const H = height;
  const innerW = Math.max(0, W - PAD.l - PAD.r);
  const innerH = H - PAD.t - PAD.b;
  const sx = (x: number) => PAD.l + ((x - domain[0]) / (domain[1] - domain[0])) * innerW;
  const sy = (p: number) => PAD.t + (1 - p) * innerH;

  const pts = points.length
    ? [...points.slice(0, -1), { ...points[points.length - 1], p: head }]
    : [];
  const line = pts.map((pt, i) => `${i ? "L" : "M"}${sx(pt.t).toFixed(1)},${sy(pt.p).toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  const area = last
    ? `${line}L${sx(last.t).toFixed(1)},${sy(0)}L${sx(pts[0].t).toFixed(1)},${sy(0)}Z`
    : "";

  const priceAt = (x: number) => {
    for (const pt of points) if (pt.t >= x) return pt.p;
    return head;
  };

  const latestEvent = events[events.length - 1]?.id;
  // `initial` only applies when the clip mounts, so the line draws in once.
  const animateDraw = !reduce;

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height: H }}>
      {W > 0 && (
        <>
          <svg width={W} height={H} aria-hidden className="absolute inset-0 overflow-visible">
            <defs>
              <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--yes)" stopOpacity="0.16" />
                <stop offset="100%" stopColor="var(--yes)" stopOpacity="0" />
              </linearGradient>
              <clipPath id={clipId}>
                <motion.rect
                  x={0}
                  y={-20}
                  height={H + 40}
                  initial={{ width: animateDraw ? 0 : W + 20 }}
                  animate={{ width: W + 20 }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
              </clipPath>
            </defs>

            {/* Gridlines: 25 / 50 / 75 % */}
            {[0.25, 0.5, 0.75].map((g) => (
              <g key={g}>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r + 6}
                  y1={sy(g)}
                  y2={sy(g)}
                  stroke="var(--line)"
                  strokeDasharray={g === 0.5 ? undefined : "2 4"}
                />
                <text
                  x={W - PAD.r + 12}
                  y={sy(g) + 4}
                  fontSize="11"
                  fill="var(--ink-3)"
                  className="num"
                >
                  {g * 100}%
                </text>
              </g>
            ))}
            <line x1={PAD.l} x2={W - PAD.r + 6} y1={sy(0)} y2={sy(0)} stroke="var(--line)" />

            {dividers.map((x) => (
              <line key={x} x1={sx(x)} x2={sx(x)} y1={PAD.t - 6} y2={sy(0)} stroke="var(--line)" />
            ))}
            {xLabels.map((l) => (
              <text
                key={l.label}
                x={sx(l.x)}
                y={H - 6}
                fontSize="11"
                fill="var(--ink-3)"
                textAnchor={l.x <= domain[0] ? "start" : l.x >= domain[1] ? "end" : "middle"}
              >
                {l.label}
              </text>
            ))}

            <g clipPath={`url(#${clipId})`}>
              <path d={area} fill={`url(#${gradId})`} />
              <path
                d={line}
                fill="none"
                stroke="var(--yes)"
                strokeWidth={2.25}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>

            {last && (
              <g>
                {live && (
                  <circle cx={sx(last.t)} cy={sy(head)} r={9} fill="var(--yes)" opacity={0.16} />
                )}
                {/* One soft pulse each time a new event lands. */}
                {live && !reduce && latestEvent && (
                  <motion.circle
                    key={latestEvent}
                    cx={sx(last.t)}
                    cy={sy(head)}
                    fill="none"
                    stroke="var(--yes)"
                    strokeWidth={1.5}
                    initial={{ r: 5, opacity: 0.6 }}
                    animate={{ r: 22, opacity: 0 }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                  />
                )}
                <circle cx={sx(last.t)} cy={sy(head)} r={4.5} fill="var(--yes)" stroke="var(--bg)" strokeWidth={2} />
              </g>
            )}
          </svg>

          <div role="group" aria-label="Moments that moved the price" className="absolute inset-0">
            {events.map((ev) => (
              <Marker
                key={ev.id}
                ev={ev}
                x={sx(ev.x)}
                y={sy(priceAt(ev.x))}
                selected={selectedId === ev.id}
                fresh={!reduce && ev.id === latestEvent && live}
                onSelect={onSelect}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Marker({
  ev,
  x,
  y,
  selected,
  fresh,
  onSelect,
}: {
  ev: ChartEvent;
  x: number;
  y: number;
  selected: boolean;
  fresh: boolean;
  onSelect: (id: string) => void;
}) {
  const color = ev.side === "yes" ? "var(--yes)" : ev.side === "no" ? "var(--no)" : "var(--ink-2)";
  return (
    <button
      type="button"
      onClick={() => onSelect(ev.id)}
      aria-label={ev.label}
      aria-pressed={selected}
      className="group absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
      style={{ left: x, top: y }}
    >
      {fresh && (
        <motion.span
          aria-hidden
          className="absolute size-4 rounded-full"
          style={{ background: color }}
          initial={{ scale: 1, opacity: 0.45 }}
          animate={{ scale: 2.8, opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      )}
      <motion.span
        aria-hidden
        initial={fresh ? { scale: 0 } : false}
        animate={{ scale: selected ? 1.25 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className={`relative grid place-items-center ${selected ? "ring-2 ring-ink ring-offset-2 ring-offset-bg" : ""} ${shapeClass(ev.type)} group-hover:scale-110`}
        style={shapeStyle(ev.type, color)}
      >
        {ev.type === "injury" && <span className="text-[11px] font-bold leading-none">+</span>}
      </motion.span>
    </button>
  );
}

function shapeClass(type: EventType) {
  switch (type) {
    case "goal":
      return "size-3.5 rounded-full";
    case "penalty":
      return "size-3 rounded-[3px]";
    case "injury":
      return "size-4 rounded-full";
    case "goalie_pulled":
      return "size-3 rotate-45 rounded-[2px]";
    default:
      return "size-3 rounded-full";
  }
}

function shapeStyle(type: EventType, color: string): React.CSSProperties {
  // Goals are solid; everything else is an outline, so shape tells them apart.
  if (type === "goal") return { background: color, boxShadow: "0 0 0 2px var(--bg)" };
  return {
    background: "var(--bg)",
    border: `2px solid ${color}`,
    color,
  };
}
