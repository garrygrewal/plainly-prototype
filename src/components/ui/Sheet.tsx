"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Close } from "../icons";

export type Detent = "medium" | "large";

const TOP_GAP = 52; // how much of the page shows above a large sheet
const SPRING = { type: "spring", stiffness: 420, damping: 40, mass: 0.9 } as const;

function detentHeight(d: Detent, frame: number) {
  return d === "large" ? frame - TOP_GAP : Math.round(frame * 0.56);
}

/**
 * An iOS-style sheet inside the phone frame.
 * - Detents: opens at the first one; drag the grabber between them, or
 *   below the smallest to dismiss. The grabber is also a button for
 *   keyboard and VoiceOver users.
 * - Content ends with a <SheetFooter> to keep the main action visible at
 *   every detent, or with <SheetEnd> for bottom padding.
 * - Escape or the scrim closes it; focus stays inside while it's open.
 */
export function Sheet({
  open,
  onClose,
  labelledBy,
  detents = ["large"],
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  detents?: Detent[];
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const frame = useRef(800);
  const height = useMotionValue(0);
  const [current, setCurrent] = useState<Detent>(detents[0]);
  const drag = useRef<{ y: number; h: number; lastY: number; lastT: number; v: number } | null>(null);

  // Measure the phone frame when the sheet mounts, and start at the first detent.
  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      panel.current = el;
      if (!el) return;
      frame.current = el.parentElement?.clientHeight ?? 800;
      height.set(detentHeight(detents[0], frame.current));
      setCurrent(detents[0]);
    },
    [detents, height],
  );

  const snapTo = useCallback(
    (d: Detent) => {
      setCurrent(d);
      const target = detentHeight(d, frame.current);
      if (reduce) height.set(target);
      else animate(height, target, SPRING);
    },
    [height, reduce],
  );

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    // preventScroll: the sheet is still sliding in, and a plain focus()
    // would scroll the whole phone frame to reach it.
    const id = requestAnimationFrame(() => {
      const target = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current;
      target?.focus({ preventScroll: true });
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
      returnTo.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  function onPointerDown(e: React.PointerEvent) {
    if (reduce) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, h: height.get(), lastY: e.clientY, lastT: e.timeStamp, v: 0 };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const max = detentHeight("large", frame.current);
    let h = d.h - (e.clientY - d.y);
    if (h > max) h = max + (h - max) * 0.15; // rubber band past the top
    height.set(Math.max(0, h));
    d.v = (e.clientY - d.lastY) / Math.max(1, e.timeStamp - d.lastT);
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
  }
  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const h = height.get();
    const options = detents.map((x) => ({ d: x, h: detentHeight(x, frame.current) })).sort((a, b) => a.h - b.h);
    const smallest = options[0].h;
    if (h < smallest * 0.75 || (d.v > 1.1 && h < smallest + 24)) return onClose();
    let pick = options.reduce((a, b) => (Math.abs(b.h - h) < Math.abs(a.h - h) ? b : a));
    if (d.v < -0.8) pick = options[options.length - 1];
    else if (d.v > 0.8) pick = [...options].reverse().find((o) => o.h < h) ?? options[0];
    snapTo(pick.d);
  }

  const canResize = detents.length > 1;
  const other = detents.find((x) => x !== current);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 z-50 bg-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            // A different set of detents is a different sheet: remount so it starts at its own first detent.
            key={`sheet-${detents.join("-")}`}
            ref={attach}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            style={{ height }}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={SPRING}
            className="absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-sheet bg-sheet shadow-float outline-none"
          >
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="flex h-5 shrink-0 cursor-grab touch-none items-start justify-center pt-[5px] active:cursor-grabbing"
            >
              {canResize ? (
                <button
                  type="button"
                  onClick={() => other && snapTo(other)}
                  aria-label={current === "large" ? "Shrink sheet" : "Expand sheet"}
                  className="hit-area h-[5px] w-9 rounded-full bg-ink-3/50"
                />
              ) : (
                <span aria-hidden className="h-[5px] w-9 rounded-full bg-ink-3/50" />
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="pressable hit-area absolute top-3.5 right-4 z-10 grid size-[30px] place-items-center rounded-full bg-sheet-fill text-ink-2"
            >
              <Close size={16} strokeWidth={2.6} />
            </button>
            <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pt-2">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Pinned to the bottom of the sheet while the content above scrolls. */
export function SheetFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-auto bg-sheet px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}

/** Bottom padding for sheets without a footer. */
export function SheetEnd() {
  return <div aria-hidden className="h-6 shrink-0" />;
}
