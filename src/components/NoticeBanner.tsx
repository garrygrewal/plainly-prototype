"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { getMarket } from "@/lib/data/markets";
import type { LiveMarket } from "@/lib/data/types";
import { markerEvents } from "@/lib/selectors";
import { useDemo } from "@/lib/store";

const SHOW_FOR_MS = 7000;

/** A neutral app icon: a dark tile with a rising line. No host-app branding. */
function AppIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 64 64" aria-hidden className="shrink-0 rounded-[9px]">
      <rect width="64" height="64" fill="#15171a" />
      <path d="M12 40 L22 37 L28 24 L36 30 L42 18 L52 22" fill="none" stroke="#86a2ff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="52" cy="22" r="4.5" fill="#f6f4ef" />
    </svg>
  );
}

/**
 * The come-back moment, as an iOS notification: when something big happens
 * in a game you hold or follow. Tap to open the market at that moment;
 * swipe up (or wait) to dismiss.
 */
export function NoticeBanner() {
  const notice = useDemo((s) => s.notice);
  const dismiss = useDemo((s) => s.dismissNotice);
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const dragged = useRef(false);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(dismiss, SHOW_FOR_MS);
    return () => clearTimeout(id);
  }, [notice, dismiss]);

  function open() {
    if (!notice || dragged.current) return;
    const m = getMarket(notice.marketId) as LiveMarket;
    const at = markerEvents(m, useDemo.getState().sims[m.id].fired).length;
    useDemo.setState({ focusEvent: { marketId: m.id, eventId: notice.eventId, at } });
    dismiss();
    const href = `/m/${notice.marketId}`;
    if (pathname !== href) router.push(href);
  }

  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-2 top-2 z-40">
      <AnimatePresence>
        {notice && (
          <motion.div
            key={notice.id}
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.7, bottom: 0.1 }}
            onDragStart={() => (dragged.current = true)}
            onDragEnd={(_, info) => {
              if (info.offset.y < -24 || info.velocity.y < -300) dismiss();
              // Let the click that ends a drag pass without opening the market.
              setTimeout(() => (dragged.current = false), 0);
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -80 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="pointer-events-auto relative touch-none rounded-[22px] bg-material shadow-float backdrop-blur-xl"
          >
            <button type="button" onClick={open} className="flex w-full items-start gap-3 p-3.5 text-left">
              <AppIcon />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-subhead font-semibold">{notice.title}</span>
                  <span className="shrink-0 text-footnote text-ink-3">now</span>
                </span>
                <span className="line-clamp-2 text-subhead text-ink">{notice.body}</span>
              </span>
            </button>
            {/* Swipe is the gesture; this is the same action for keyboard and VoiceOver. */}
            <button
              type="button"
              onClick={dismiss}
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:rounded-full focus:bg-surface-2 focus:px-3 focus:py-1 focus:text-footnote"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
