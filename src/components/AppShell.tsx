"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HERO_ID, getMarket } from "@/lib/data/markets";
import type { LiveMarket } from "@/lib/data/types";
import { hockeyClock } from "@/lib/format";
import { gameTime } from "@/lib/sim/engine";
import { useDemo } from "@/lib/store";
import { DemoPanel } from "./DemoPanel";
import { NoticeBanner } from "./NoticeBanner";
import { SheetHost } from "./SheetHost";
import { Toaster } from "./ui/Toast";
import { Pause, Play, Sliders } from "./icons";

const hero = getMarket(HERO_ID) as LiveMarket;

/** Drives the simulated game clock from requestAnimationFrame. */
function useSimClock() {
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      // Clamp long gaps (background tabs) so the game doesn't leap ahead.
      const dt = Math.min(100, now - last);
      last = now;
      useDemo.getState().tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // Handy for poking at the demo from the console during development.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __demo: typeof useDemo }).__demo = useDemo;
    }
    return () => cancelAnimationFrame(raf);
  }, []);
}

/** The thin strip at the top of the phone: always says this is a demo. */
function DemoStrip({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const clock = useDemo((s) => s.clock);
  const playing = useDemo((s) => s.playing);
  const t = Math.floor(gameTime(hero, clock) / 5) * 5;

  return (
    <div className="relative z-30 flex h-9 shrink-0 items-center justify-between gap-2 border-b border-line bg-bg px-4 text-[11px] text-ink-3">
      <span className="flex min-w-0 items-center gap-1.5">
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-ink-3" />
        <span className="truncate">
          Concept prototype · demo money<span className="max-[400px]:hidden">, not real</span>
        </span>
      </span>
      {/* On small screens the demo controls live behind this button. */}
      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap lg:hidden">
        <button
          type="button"
          onClick={() => useDemo.getState().setPlaying(!playing)}
          aria-label={playing ? "Pause the game" : "Play the game"}
          className="grid size-7 place-items-center rounded-full text-ink-2"
        >
          {playing ? <Pause width={14} height={14} /> : <Play width={14} height={14} />}
        </button>
        <span className="num">{hockeyClock(t).replace(" left", "")}</span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="demo-panel-mobile"
          aria-label="Demo controls"
          className={`ml-1 grid size-7 place-items-center rounded-full ${open ? "bg-surface-2 text-ink" : "text-ink-2"}`}
        >
          <Sliders width={15} height={15} />
        </button>
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  useSimClock();
  const pathname = usePathname();
  const [panelOpen, setPanelOpen] = useState(false);
  const closeSheet = useDemo((s) => s.closeSheet);
  const lastPath = useRef(pathname);

  // Sheets belong to the screen that opened them.
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      closeSheet();
    }
  }, [pathname, closeSheet]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh bg-backdrop lg:flex lg:items-center lg:justify-center lg:gap-14 lg:px-10 lg:py-10">
        <aside className="hidden w-[340px] shrink-0 lg:block">
          <p className="text-[15px] font-semibold tracking-tight">Plainly</p>
          <h1 className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-tight text-balance">
            Prediction markets that explain themselves.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
            Follow one live hockey game from discovery to cash-out. Every price comes
            in plain words, and you can see why it moved. All money here is pretend.
          </p>
          <Link
            href="/about"
            className="mt-4 inline-flex items-center gap-1 text-[15px] font-medium text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-ink"
          >
            Read the case study →
          </Link>
          <div className="mt-8">
            <DemoPanel />
          </div>
        </aside>

        <div
          className="relative flex h-dvh w-full flex-col overflow-hidden bg-bg pt-safe lg:h-[844px] lg:pt-0 lg:max-h-[calc(100dvh-80px)] lg:w-[390px] lg:shrink-0 lg:rounded-[44px] lg:border lg:border-line lg:shadow-float"
        >
          <DemoStrip open={panelOpen} onToggle={() => setPanelOpen((o) => !o)} />
          <AnimatePresence>
            {panelOpen && (
              <motion.div
                id="demo-panel-mobile"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-x-3 top-11 z-40 rounded-3xl border border-line bg-surface p-4 shadow-float lg:hidden"
              >
                <DemoPanel compact />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative min-h-0 flex-1">{children}</div>
          <NoticeBanner />
          <SheetHost />
          <Toaster />
        </div>
      </div>
    </MotionConfig>
  );
}
