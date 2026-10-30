"use client";

import { useId } from "react";
import { useDemo } from "@/lib/store";
import { CashOutSheet } from "./CashOutSheet";
import { TradeSheet } from "./TradeSheet";
import { type Detent, Sheet } from "./ui/Sheet";

// Stable arrays: the sheet measures itself against these on mount.
const TRADE_DETENTS: Detent[] = ["large"];
const CASHOUT_DETENTS: Detent[] = ["medium", "large"];

/** Renders whichever sheet the store says is open. */
export function SheetHost() {
  const sheet = useDemo((s) => s.sheet);
  const close = useDemo((s) => s.closeSheet);
  const titleId = useId();
  // A new key per open resets the form.
  const key = sheet ? `${sheet.kind}-${sheet.marketId}-${sheet.kind === "trade" ? sheet.side : ""}` : "none";

  return (
    <Sheet
      open={!!sheet}
      onClose={close}
      labelledBy={titleId}
      detents={sheet?.kind === "cashout" ? CASHOUT_DETENTS : TRADE_DETENTS}
    >
      {sheet?.kind === "trade" && (
        <TradeSheet key={key} marketId={sheet.marketId} initialSide={sheet.side} titleId={titleId} onClose={close} />
      )}
      {sheet?.kind === "cashout" && (
        <CashOutSheet key={key} marketId={sheet.marketId} titleId={titleId} onClose={close} />
      )}
    </Sheet>
  );
}
