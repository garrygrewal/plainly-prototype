"use client";

import { HERO_ID, getMarket } from "@/lib/data/markets";
import type { LiveMarket } from "@/lib/data/types";
import { eventClock, hockeyClock } from "@/lib/format";
import { gameTime } from "@/lib/sim/engine";
import { DEMO_END, useDemo } from "@/lib/store";
import { Pause, Play, Replay, SkipNext } from "./icons";

const hero = getMarket(HERO_ID) as LiveMarket;
const SPEEDS = [1, 20, 60];

/** Play/pause, speed, scrub, skip and replay for the simulated game. */
export function DemoPanel({ compact = false }: { compact?: boolean }) {
  const clock = useDemo((s) => s.clock);
  const playing = useDemo((s) => s.playing);
  const speed = useDemo((s) => s.speed);
  const { setPlaying, setSpeed, seek, nextEvent, replay } = useDemo.getState();

  const t = gameTime(hero, clock);
  const max = DEMO_END + 10;

  return (
    <section
      aria-label="Demo controls"
      className={compact ? "" : "rounded-3xl border border-line bg-surface p-5 shadow-card"}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">
          Demo controls
        </h2>
        <p className="num text-sm text-ink-2">{hockeyClock(Math.floor(t / 5) * 5)}</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause the game" : "Play the game"}
          className="grid size-11 place-items-center rounded-full bg-ink text-bg transition-transform active:scale-95"
        >
          {playing ? <Pause /> : <Play />}
        </button>

        <div
          role="group"
          aria-label="Game speed"
          className="flex rounded-full bg-surface-2 p-1"
        >
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={speed === s}
              onClick={() => setSpeed(s)}
              className={`num h-9 rounded-full px-3 text-sm transition-colors ${
                speed === s ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink"
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
          className="ml-auto grid size-11 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          <SkipNext />
        </button>
        <button
          type="button"
          onClick={replay}
          aria-label="Replay from the start"
          title="Replay from the start"
          className="grid size-11 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          <Replay />
        </button>
      </div>

      <div className="relative mt-5">
        {/* Event ticks along the scrubber */}
        <div aria-hidden className="pointer-events-none absolute inset-x-[9px] top-1/2 h-0">
          {hero.script
            .filter((e) => e.type === "goal")
            .map((e) => (
              <span
                key={e.id}
                className={`absolute top-[-7px] h-[14px] w-[2px] rounded-full ${
                  e.team === hero.yesTeam ? "bg-yes" : "bg-no"
                } opacity-60`}
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
          className="relative w-full accent-[var(--ink)]"
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-3">
        Runs at {speed}× speed. Same game every time. Dragging back undoes trades
        made after that point.
      </p>
    </section>
  );
}
