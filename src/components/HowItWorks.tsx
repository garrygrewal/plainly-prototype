"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { ChevronDown } from "./icons";

/** Three cards, no jargon: what a share is, why price = probability, how it settles. */
export function HowItWorks({ yesLabel }: { yesLabel: string }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const panelId = useId();

  const cards = [
    {
      n: "1",
      title: "A share pays $1 if you’re right",
      body: `Buy a “${yesLabel}” share and it pays $1 if that happens, or $0 if it doesn’t. No share ever pays more than $1.`,
    },
    {
      n: "2",
      title: "The price is the chance",
      body: "A share that costs 64¢ means people trading here think it’s about 64% likely. When they change their minds, the price moves.",
    },
    {
      n: "3",
      title: "It settles on its own",
      body: "When the result is known, winning shares pay out to your balance automatically. You can also sell any time before then, at that moment’s price.",
    },
  ];

  return (
    <section className="rounded-3xl border border-line bg-surface">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-3xl px-5 py-4 text-left"
      >
        <span>
          <span className="block text-[15px] font-semibold tracking-tight">How this works</span>
          <span className="block text-sm text-ink-2">Three things to know, in under a minute</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: reduce ? 0 : 0.2 }}>
          <ChevronDown className="text-ink-2" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ol className="space-y-2 px-3 pb-3">
              {cards.map((c, i) => (
                <motion.li
                  key={c.n}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce ? 0 : 0.05 + i * 0.05 }}
                  className="flex gap-3 rounded-2xl bg-surface-2 p-4"
                >
                  <span
                    aria-hidden
                    className="num grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-semibold text-bg"
                  >
                    {c.n}
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold leading-snug">{c.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-ink-2">{c.body}</span>
                  </span>
                </motion.li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
