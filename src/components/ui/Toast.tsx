"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { create } from "zustand";

interface ToastState {
  message: string | null;
  id: number;
  show: (message: string) => void;
  hide: () => void;
}

const useToast = create<ToastState>()((set) => ({
  message: null,
  id: 0,
  show: (message) => set((s) => ({ message, id: s.id + 1 })),
  hide: () => set({ message: null }),
}));

/** Show a short, non-blocking message, e.g. for parts outside the prototype. */
export const toast = (message: string) => useToast.getState().show(message);

export function Toaster() {
  const { message, id, hide } = useToast();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, 2200);
    return () => clearTimeout(t);
  }, [message, id, hide]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-28 z-[60] flex justify-center">
      <AnimatePresence>
        {message && (
          <motion.div
            key={id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="rounded-full bg-material px-4 py-2.5 text-subhead font-medium text-ink shadow-float backdrop-blur-xl"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
