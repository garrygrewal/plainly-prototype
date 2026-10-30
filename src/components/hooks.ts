"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MARKETS, getMarket } from "@/lib/data/markets";
import type { Market } from "@/lib/data/types";
import { type LmsrState, priceYes } from "@/lib/market/lmsr";
import { type LiveSim, type PricePoint, simPrice } from "@/lib/sim/engine";
import {
  type MarketStatus,
  type PositionSummary,
  holdings,
  marketStatus,
  positionSummary,
  staticHistory,
} from "@/lib/selectors";
import { balanceOf, useDemo } from "@/lib/store";

export interface MarketView {
  m: Market;
  sim: LiveSim | null;
  lmsr: LmsrState;
  pYes: number;
  history: PricePoint[];
  status: MarketStatus;
  position: PositionSummary | null;
}

/** Everything a screen needs to draw one market, kept in sync with the demo. */
export function useMarketView(id: string): MarketView {
  const m = getMarket(id)!;
  const sim = useDemo((s) => (m.kind === "live" ? s.sims[id] : null));
  const stat = useDemo((s) => (m.kind === "static" ? s.statics[id] : null));
  const ledger = useDemo((s) => s.ledger);

  return useMemo(() => {
    const lmsr = sim ? sim.lmsr : stat!;
    const pYes = sim ? simPrice(sim) : priceYes(lmsr);
    let history: PricePoint[];
    if (sim) {
      history = sim.history;
    } else {
      // Static markets: 30 days of history, ending at today's (tradeable) price.
      const base = staticHistory(m as Extract<Market, { kind: "static" }>);
      history = [...base.slice(0, -1), { t: base.length - 1, p: pYes }];
    }
    const status = marketStatus(m, sim?.clock ?? 0, !!sim?.resolved);
    const position = positionSummary(holdings(ledger, id), lmsr, pYes);
    return { m, sim, lmsr, pYes, history, status, position };
  }, [m, sim, stat, ledger, id]);
}

export function useBalance(): number {
  const ledger = useDemo((s) => s.ledger);
  return useMemo(() => balanceOf(ledger), [ledger]);
}

/** What's riding on open positions across every market: value now and P&L. */
export function usePortfolio(): { worth: number; pnl: number; count: number } {
  const sims = useDemo((s) => s.sims);
  const statics = useDemo((s) => s.statics);
  const ledger = useDemo((s) => s.ledger);
  return useMemo(() => {
    let worth = 0;
    let pnl = 0;
    let count = 0;
    for (const m of MARKETS) {
      const sim = m.kind === "live" ? sims[m.id] : null;
      const lmsr = sim ? sim.lmsr : statics[m.id];
      const pYes = sim ? simPrice(sim) : priceYes(lmsr);
      const p = positionSummary(holdings(ledger, m.id), lmsr, pYes);
      if (!p) continue;
      worth += p.worthNow;
      pnl += p.pnl;
      count += 1;
    }
    return { worth, pnl, count };
  }, [sims, statics, ledger]);
}

/** Width of an element, kept up to date. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
