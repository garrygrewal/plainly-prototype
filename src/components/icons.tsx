import {
  Bell as LBell,
  Check as LCheck,
  ChevronDown as LChevronDown,
  ChevronLeft as LChevronLeft,
  ChevronRight as LChevronRight,
  CircleCheck,
  CircleDollarSign,
  Clapperboard,
  Gift,
  House,
  Info as LInfo,
  Landmark,
  type LucideProps,
  Moon as LMoon,
  Pause as LPause,
  Play as LPlay,
  Plus as LPlus,
  RotateCcw,
  Search as LSearch,
  SkipForward,
  SlidersHorizontal,
  Sun as LSun,
  X,
} from "lucide-react";
import type { SVGProps } from "react";

/*
 * One outline icon set (Lucide) at one stroke weight, sized like SF Symbols
 * next to 17pt text. Names stay stable so screens don't care where icons
 * come from.
 */
type P = LucideProps;
const base: P = { size: 20, strokeWidth: 2, "aria-hidden": true };
const icon = (I: React.ComponentType<P>, extra: P = {}) => {
  const C = (p: P) => <I {...base} {...extra} {...p} />;
  return C;
};

export const ChevronLeft = icon(LChevronLeft, { size: 24 });
export const ChevronDown = icon(LChevronDown);
export const ChevronRight = icon(LChevronRight);
export const Close = icon(X);
export const Sun = icon(LSun);
export const Moon = icon(LMoon);
export const Play = icon(LPlay, { fill: "currentColor" });
export const Pause = icon(LPause, { fill: "currentColor" });
export const SkipNext = icon(SkipForward);
export const Replay = icon(RotateCcw);
export const Check = icon(LCheck);
export const Info = icon(LInfo, { size: 16 });
export const Bell = icon(LBell);
export const Sliders = icon(SlidersHorizontal);
export const Search = icon(LSearch);
export const Plus = icon(LPlus);
export const HomeIcon = icon(House);
export const MoneyIcon = icon(CircleDollarSign);
export const RewardsIcon = icon(Gift);
export const FilmIcon = icon(Clapperboard);
export const CivicIcon = icon(Landmark);
export const Settled = icon(CircleCheck);

/** Solid up/down triangle for gains and losses (paired with a sign, never colour alone). */
export const Arrow = ({ up, ...p }: SVGProps<SVGSVGElement> & { up: boolean }) => (
  <svg width={10} height={10} viewBox="0 0 12 12" fill="currentColor" aria-hidden {...p}>
    {up ? <path d="M6 2l4.5 7h-9L6 2z" /> : <path d="M6 10L1.5 3h9L6 10z" />}
  </svg>
);
