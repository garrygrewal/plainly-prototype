"use client";

import { HERO_ID, getMarket } from "@/lib/data/markets";
import type { LiveMarket } from "@/lib/data/types";
import { eventClock, hockeyClock } from "@/lib/format";
import { gameTime } from "@/lib/sim/engine";
import { DEMO_END, useDemo } from "@/lib/store";
import { Pause, Play, Replay, SkipNext } from "./icons";

const hero = getMarket(HERO_ID) as LiveMarket;
const SPEEDS = [1, 20, 60];

/**
 * Play/pause, speed, scrub, skip and replay for the simulated game.
 * Deliberately styled as a tool (outlined, dashed) rather than product UI,
 * so nobody mistakes it for part of the app.
 */
export function DemoPanel({ compact = false }: { compact?: boolean }) {
  const clock = useDemo((s) => s.clock);
  const playing = useDemo((s) => s.playing);
  const speed = useDemo((s) => s.speed);
  const { setPlaying, setSpeed, seek, nextEvent, replay } = useDemo.getState();

  const t = gameTime(hero, clock);
  const max = DEMO_END + 10;
  const iconBtn =
    "pressable grid size-11 place-items-center rounded-full border border-ink-3/40 text-ink-2 hover:border-ink-2 hover:text-ink";

  return (
    <section
      aria-label="Demo controls"
      className={compact ? "" : "rounded-card border border-dashed border-ink-3/50 p-4"}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-subhead font-semibold">Demo controls</h2>
          <p className="text-footnote text-ink-3">Not part of the app</p>
        </div>
        <p className="num text-subhead text-ink-2">{hockeyClock(Math.floor(t / 5) * 5)}</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause the game" : "Play the game"}
          className={iconBtn}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <div role="group" aria-label="Game speed" className="flex gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={speed === s}
              onClick={() => setSpeed(s)}
              className={`num h-11 min-w-11 rounded-full px-2.5 text-subhead ${
                speed === s ? "font-semibold text-ink underline decoration-2 underline-offset-4" : "text-ink-3 hover:text-ink"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={nextEvent}
          aria-label="Skip to the next big moment"
          title="Skip to the next big moment"
          className={`${iconBtn} ml-auto`}
        >
          <SkipNext size={18} />
        </button>
        <button type="button" onClick={replay} aria-label="Replay from the start" title="Replay from the start" className={iconBtn}>
          <Replay size={18} />
        </button>
      </div>

      <div className="relative mt-4">
        {/* Goal ticks along the scrubber */}
        <div aria-hidden className="pointer-events-none absolute inset-x-[9px] top-1/2 h-0">
          {hero.script
            .filter((e) => e.type === "goal")
            .map((e) => (
              <span
                key={e.id}
                className={`absolute top-[-7px] h-[14px] w-[2px] rounded-full ${e.team === hero.yesTeam ? "bg-yes" : "bg-no"}`}
                style={{ left: `${(e.t / max) * 100}%` }}
              />
            ))}
        </div>
        <input
          type="range"
          min={0}
          max={max}
          step={5}
          value={Math.min(clock, max)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Game time"
          aria-valuetext={eventClock(t)}
          className="relative h-11 w-full accent-[var(--ink)]"
        />
      </div>
      <p className="text-footnote text-ink-3">
        Runs at {speed}× speed. Same game every time. Dragging back undoes trades made after that point.
      </p>
    </section>
  );
}
