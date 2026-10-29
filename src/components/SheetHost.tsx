"use client";

import { useId } from "react";
import { useDemo } from "@/lib/store";
import { BottomSheet } from "./BottomSheet";
import { CashOutSheet } from "./CashOutSheet";
import { TradeSheet } from "./TradeSheet";

/** Renders whichever sheet the store says is open. */
export function SheetHost() {
  const sheet = useDemo((s) => s.sheet);
  const close = useDemo((s) => s.closeSheet);
  const titleId = useId();
  // A new key per open resets the form.
  const key = sheet ? `${sheet.kind}-${sheet.marketId}-${sheet.kind === "trade" ? sheet.side : ""}` : "none";

  return (
    <BottomSheet open={!!sheet} onClose={close} labelledBy={titleId}>
      {sheet?.kind === "trade" && (
        <TradeSheet key={key} marketId={sheet.marketId} initialSide={sheet.side} titleId={titleId} onClose={close} />
      )}
      {sheet?.kind === "cashout" && (
        <CashOutSheet key={key} marketId={sheet.marketId} titleId={titleId} onClose={close} />
      )}
    </BottomSheet>
  );
}
