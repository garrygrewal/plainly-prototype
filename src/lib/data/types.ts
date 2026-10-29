import type { Side } from "@/lib/market/lmsr";
import type { Team, TeamRates } from "@/lib/sim/winProb";

export type EventType =
  | "goal"
  | "penalty"
  | "injury"
  | "period_end"
  | "goalie_pulled"
  | "final";

/** Something that happens in a game and moves the price. */
export interface GameEvent {
  id: string;
  /** Game time in seconds. */
  t: number;
  type: EventType;
  team?: Team;
  /** Short label, e.g. "Goal, Gulls". */
  title: string;
  /** What happened, e.g. "Okafor scores. Gulls lead 1–0." */
  detail: string;
  /** Why the price moved, in plain words. */
  why: string;
  /** For injuries: the team's scoring multiplier for the rest of the game. */
  strength?: number;
}

export interface TeamInfo {
  city: string;
  name: string;
  /** Three-letter code. */
  abbr: string;
}

interface BaseMarket {
  id: string;
  question: string;
  /** What a Yes share means, e.g. "Gulls win". */
  yesLabel: string;
  noLabel: string;
  category: string;
  /** Mock total traded, in dollars. */
  volume: number;
  /** Shows up under "Following". */
  followed: boolean;
  /** When and how it settles, in plain words. */
  resolves: string;
  /** Liquidity parameter for the LMSR. */
  b: number;
}

/** A game that plays out live in the demo. */
export interface LiveMarket extends BaseMarket {
  kind: "live";
  teams: Record<Team, TeamInfo>;
  rates: TeamRates;
  seed: number;
  /** This game's clock = demo clock + offset (lets games overlap). */
  clockOffset: number;
  /** How much the crowd's mood wanders from the fair price (logit units). */
  noise: number;
  script: GameEvent[];
  /** The side a Yes share is on. Always the home team here. */
  yesTeam: Team;
}

/** A market that isn't a live game: its price only moves when you trade. */
export interface StaticMarket extends BaseMarket {
  kind: "static";
  status: "open" | "upcoming";
  /** e.g. "Tonight, 7:30 pm" */
  when?: string;
  pYes: number;
  historySeed: number;
  volatility: number;
}

export type Market = LiveMarket | StaticMarket;

/** One entry in the user's demo-money ledger. */
export interface LedgerEntry {
  id: string;
  marketId: string;
  /** Demo clock time, in seconds. */
  t: number;
  kind: "buy" | "sell" | "payout";
  side: Side;
  /** Dollars spent (buy), received (sell) or paid out (payout). */
  amount: number;
  shares: number;
}
