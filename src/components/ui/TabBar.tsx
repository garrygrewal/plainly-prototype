"use client";

import { HomeIcon, MoneyIcon, Plus, RewardsIcon, Search } from "../icons";
import { toast } from "./Toast";

const NOT_HERE = "Not part of this prototype";

/**
 * The host app's tab bar, so the feature reads as living inside it.
 * Predictions sits under Explore; the other tabs are honest about being
 * out of scope instead of being dead links.
 */
export function TabBar() {
  const tabs = [
    { key: "home", label: "Home", Icon: HomeIcon },
    { key: "explore", label: "Explore", Icon: Search, current: true },
    { key: "trade", label: "Trade", Icon: Plus, fab: true },
    { key: "money", label: "Money", Icon: MoneyIcon },
    { key: "rewards", label: "Rewards", Icon: RewardsIcon },
  ];

  return (
    <nav aria-label="Main" className="sticky bottom-0 z-20 border-t border-line bg-bg/90 pb-safe backdrop-blur-xl">
      <ul className="grid h-[49px] grid-cols-5">
        {tabs.map(({ key, label, Icon, current, fab }) => (
          <li key={key} className="flex">
            <button
              type="button"
              aria-current={current ? "page" : undefined}
              aria-disabled={current ? undefined : true}
              onClick={() => !current && toast(NOT_HERE)}
              className={`pressable flex flex-1 flex-col items-center justify-end gap-0.5 pb-1 text-[10px] font-medium leading-3 ${
                current ? "text-ink" : "text-ink-3"
              }`}
            >
              {fab ? (
                <span className="-mt-5 mb-0.5 grid size-12 place-items-center rounded-full bg-accent text-on-accent shadow-float">
                  <Icon size={24} strokeWidth={2.4} />
                </span>
              ) : (
                <Icon size={24} strokeWidth={current ? 2.4 : 2} />
              )}
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
