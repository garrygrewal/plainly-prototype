"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getMarket } from "@/lib/data/markets";
import type { LiveMarket } from "@/lib/data/types";
import { markerEvents } from "@/lib/selectors";
import { useDemo } from "@/lib/store";
import { Bell, Close } from "./icons";

const SHOW_FOR_MS = 7000;

/**
 * The come-back moment: a notification-style card when something big
 * happens in a game you hold or follow. Tapping it opens the market at
 * the moment that moved it.
 */
export function NoticeBanner() {
  const notice = useDemo((s) => s.notice);
  const dismiss = useDemo((s) => s.dismissNotice);
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(dismiss, SHOW_FOR_MS);
    return () => clearTimeout(id);
  }, [notice, dismiss]);

  function open() {
    if (!notice) return;
    const m = getMarket(notice.marketId) as LiveMarket;
    const at = markerEvents(m, useDemo.getState().sims[m.id].fired).length;
    useDemo.setState({ focusEvent: { marketId: m.id, eventId: notice.eventId, at } });
    dismiss();
    const href = `/m/${notice.marketId}`;
    if (pathname !== href) router.push(href);
  }

  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-3 top-11 z-40">
      <AnimatePresence>
        {notice && (
          <motion.div
            key={notice.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="pointer-events-auto flex items-start gap-3 rounded-[22px] border border-line bg-surface/95 p-3 pr-2 shadow-float backdrop-blur"
          >
            <button
              type="button"
              onClick={open}
              className="flex min-w-0 flex-1 items-start gap-3 rounded-2xl text-left"
            >
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-bg">
                <Bell width={18} height={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] text-ink-3">Plainly · now</span>
                <span className="block text-[15px] font-semibold leading-snug">
                  {notice.title}
                </span>
                <span className="block text-sm leading-snug text-ink-2">{notice.body}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss notification"
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink"
            >
              <Close width={16} height={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
