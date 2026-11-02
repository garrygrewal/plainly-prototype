import type { LiveMarket, Market, StaticMarket } from "./types";

/**
 * Mock data. Every team, league, player, film and city here is invented.
 * Times are game seconds: 0–1200 is the 1st period, 1200–2400 the 2nd,
 * 2400–3600 the 3rd.
 */

export const HERO_ID = "gulls-lynx";

const gullsLynx: LiveMarket = {
  kind: "live",
  id: HERO_ID,
  question: "Will the Gulls beat the Lynx tonight?",
  yesLabel: "Gulls win",
  noLabel: "Lynx win",
  category: "Hockey · Northshore League",
  volume: 48_200,
  followed: true,
  resolves:
    "Pays out when the game ends. Overtime and shootouts count. Gulls win: Yes pays $1 a share. Lynx win: No pays $1.",
  b: 2400,
  teams: {
    home: { city: "Harbourview", name: "Gulls", abbr: "HBV" },
    away: { city: "Cedar Ridge", name: "Lynx", abbr: "CDR" },
  },
  rates: { home: 3.2, away: 2.9 },
  seed: 20261028,
  clockOffset: 0,
  noise: 0.03,
  yesTeam: "home",
  script: [
    {
      id: "g1",
      t: 372,
      type: "goal",
      team: "home",
      title: "Goal, Gulls",
      detail: "Okafor scores. Gulls lead 1–0.",
      why: "Goals are rare in hockey, so the first one matters a lot. Teams that score first in this league win about 2 games in 3.",
    },
    {
      id: "p1",
      t: 880,
      type: "penalty",
      team: "away",
      title: "Penalty, Lynx",
      detail: "Lynx player sent off for 2 minutes. Gulls power play.",
      why: "For 2 minutes the Gulls have an extra skater. Teams score much more often with the extra player, so the price ticked up.",
    },
    {
      id: "e1",
      t: 1200,
      type: "period_end",
      title: "End of 1st",
      detail: "Gulls lead 1–0 after one period.",
      why: "Less time is left for the Lynx to catch up, so the lead is worth a little more than it was.",
    },
    {
      id: "g2",
      t: 1495,
      type: "goal",
      team: "away",
      title: "Goal, Lynx",
      detail: "Reyes scores. Tied 1–1.",
      why: "Tied with 35 minutes to go: close to a coin flip, with a small edge to the home team.",
    },
    {
      id: "i1",
      t: 1890,
      type: "injury",
      team: "home",
      strength: 0.82,
      title: "Injury, Gulls",
      detail: "Okafor, the Gulls' top scorer, leaves the game.",
      why: "Without their best scorer, the Gulls are expected to score less for the rest of the night, so their chances dipped.",
    },
    {
      id: "g3",
      t: 2240,
      type: "goal",
      team: "away",
      title: "Goal, Lynx",
      detail: "Marchetti scores. Lynx lead 2–1.",
      why: "The Lynx lead with about 23 minutes left. Comebacks happen, but not often, so the price fell sharply.",
    },
    {
      id: "e2",
      t: 2400,
      type: "period_end",
      title: "End of 2nd",
      detail: "Lynx lead 2–1 with one period left.",
      why: "Twenty minutes left to find a goal. Every minute that passes without one makes a comeback less likely.",
    },
    {
      id: "g4",
      t: 2710,
      type: "goal",
      team: "home",
      title: "Goal, Gulls",
      detail: "Lindqvist scores. Tied 2–2.",
      why: "Tied with under 15 minutes left. Back to roughly even, so the price jumped back up.",
    },
    {
      id: "p2",
      t: 3225,
      type: "penalty",
      team: "away",
      title: "Penalty, Lynx",
      detail: "Lynx player sent off for 2 minutes. Gulls power play.",
      why: "A power play this late is a real chance to take the lead, so the price rose.",
    },
    {
      id: "g5",
      t: 3270,
      type: "goal",
      team: "home",
      title: "Goal, Gulls",
      detail: "Brennan scores on the power play. Gulls lead 3–2.",
      why: "A one-goal lead with 5½ minutes left usually holds in hockey, so the price jumped.",
    },
    {
      id: "gp",
      t: 3480,
      type: "goalie_pulled",
      team: "away",
      title: "Lynx pull their goalie",
      detail: "The Lynx swap their goalie for an extra attacker.",
      why: "More attackers means a better chance to tie, but an empty net is easy to score into. The price barely moved.",
    },
    {
      id: "g6",
      t: 3530,
      type: "goal",
      team: "home",
      title: "Goal, Gulls",
      detail: "Brennan scores into the empty net. Gulls lead 4–2.",
      why: "Two goals up with about a minute left. The Gulls are now very likely to win.",
    },
    {
      id: "f",
      t: 3600,
      type: "final",
      title: "Final",
      detail: "Gulls win 4–2.",
      why: "The game is over. Yes shares now pay $1 each, and No shares pay nothing.",
    },
  ],
};

const heronsFoxes: LiveMarket = {
  kind: "live",
  id: "herons-foxes",
  question: "Will the Herons beat the Foxes tonight?",
  yesLabel: "Herons win",
  noLabel: "Foxes win",
  category: "Hockey · Northshore League",
  volume: 21_700,
  followed: false,
  resolves:
    "Pays out when the game ends. Overtime and shootouts count. Herons win: Yes pays $1 a share. Foxes win: No pays $1.",
  b: 1500,
  teams: {
    home: { city: "Lakeport", name: "Herons", abbr: "LKP" },
    away: { city: "Ironvale", name: "Foxes", abbr: "IRV" },
  },
  rates: { home: 3.0, away: 3.1 },
  seed: 7781,
  // This game started earlier, so it's already in the 2nd period.
  clockOffset: 1500,
  noise: 0.04,
  yesTeam: "home",
  script: [
    {
      id: "g1",
      t: 300,
      type: "goal",
      team: "away",
      title: "Goal, Foxes",
      detail: "Foxes lead 1–0.",
      why: "An early lead for the visitors.",
    },
    {
      id: "e1",
      t: 1200,
      type: "period_end",
      title: "End of 1st",
      detail: "Foxes lead 1–0.",
      why: "Less time left to catch up.",
    },
    {
      id: "g2",
      t: 1650,
      type: "goal",
      team: "home",
      title: "Goal, Herons",
      detail: "Tied 1–1.",
      why: "Tied with plenty of time left: close to even.",
    },
    {
      id: "g3",
      t: 2050,
      type: "goal",
      team: "away",
      title: "Goal, Foxes",
      detail: "Foxes lead 2–1.",
      why: "The Foxes are back in front.",
    },
    {
      id: "e2",
      t: 2400,
      type: "period_end",
      title: "End of 2nd",
      detail: "Foxes lead 2–1.",
      why: "One period left for the Herons to find a goal.",
    },
    {
      id: "g4",
      t: 2900,
      type: "goal",
      team: "away",
      title: "Goal, Foxes",
      detail: "Foxes lead 3–1.",
      why: "Two goals down with 11 minutes left is hard to come back from.",
    },
    {
      id: "f",
      t: 3600,
      type: "final",
      title: "Final",
      detail: "Foxes win 3–1.",
      why: "The game is over. No shares pay $1 each.",
    },
  ],
};

const gullsTop3: StaticMarket = {
  kind: "static",
  id: "gulls-top-3",
  question: "Will the Gulls finish in the top 3 this season?",
  yesLabel: "Top 3",
  noLabel: "Not top 3",
  category: "Hockey · Season",
  volume: 112_400,
  followed: true,
  resolves: "Pays out when the regular season ends on April 18.",
  b: 3000,
  status: "open",
  pYes: 0.41,
  historySeed: 11,
  volatility: 0.05,
};

const pinesTide: StaticMarket = {
  kind: "static",
  id: "pines-tide-goals",
  question: "Will Pines vs. Tide have 6 or more goals?",
  yesLabel: "6+ goals",
  noLabel: "5 or fewer",
  category: "Hockey · Northshore League",
  volume: 9_300,
  followed: false,
  resolves: "Pays out when the game ends. Overtime goals count; shootouts don't.",
  b: 1200,
  status: "upcoming",
  when: "tonight at 7:30 pm",
  pYes: 0.47,
  historySeed: 23,
  volatility: 0.03,
};

const boxOffice: StaticMarket = {
  kind: "static",
  id: "low-tide-box-office",
  question: "Will “Low Tide” top the weekend box office?",
  yesLabel: "Tops it",
  noLabel: "Doesn’t",
  category: "Culture · Film",
  volume: 33_800,
  followed: false,
  resolves: "Pays out Monday, using the published weekend totals.",
  b: 2200,
  status: "open",
  pYes: 0.72,
  historySeed: 37,
  volatility: 0.06,
};

const ferryLine: StaticMarket = {
  kind: "static",
  id: "waterfront-ferry",
  question: "Will Harbourview approve the waterfront ferry line by Dec 31?",
  yesLabel: "Approved",
  noLabel: "Not approved",
  category: "Local news",
  volume: 15_100,
  followed: false,
  resolves: "Pays out Dec 31, based on the city council’s published vote record.",
  b: 1800,
  status: "open",
  pYes: 0.23,
  historySeed: 51,
  volatility: 0.05,
};

export const MARKETS: Market[] = [
  gullsLynx,
  heronsFoxes,
  gullsTop3,
  pinesTide,
  boxOffice,
  ferryLine,
];

export const LIVE_MARKETS = MARKETS.filter(
  (m): m is LiveMarket => m.kind === "live",
);

export function getMarket(id: string): Market | undefined {
  return MARKETS.find((m) => m.id === id);
}

/** Starting demo balance, in demo USD. */
export const STARTING_BALANCE = 1000;

/** The demo clock starts a few minutes into the 1st, just before the first goal. */
export const DEMO_START = 240;
