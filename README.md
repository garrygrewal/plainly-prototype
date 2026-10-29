# Plainly: prediction markets in plain words

A concept prototype. It follows one live hockey game from discovery to cash-out, with every probability explained in plain language and every price move tied to the moment that caused it.

**Concept only.** All teams, players, films, places and markets are made up. Demo money only: no wallet, no backend, no real trading.

## What to look at (2 minutes)

1. **Discover** (`/`): six markets with the chance in words ("Likely: 71%"), sparklines, live scores and a *Following* filter.
2. **Market detail** (`/m/gulls-lynx`): the big number, translated ("about 3 times in 4"). Below it, a chart with tappable event markers, a liquidity line, and *How this works*.
3. **Trade sheet**: pick Yes or No and an amount. The summary updates live: payout if right, most you can lose, average price, price impact.
4. **Live position**: the game runs at 20× speed. Watch *worth now*, P&L, *if it ended now* and the cash-out value move with each goal.
5. **Come-back card**: a notification when something big happens. Tap it to jump to the moment.
6. **`/about`**: the case study.

Demo controls (play/pause, speed, scrub, skip to the next moment, replay) sit next to the phone on desktop. On mobile they're behind the sliders icon in the top strip.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Unit tests (Vitest): pricing maths, simulation, store, formatting |
| `npm run lint` | ESLint |
| `npm run typecheck` | Route types + `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run check` | All of the above, in order |

## How it works

### Pricing: `src/lib/market/lmsr.ts`

A two-outcome **LMSR** (logarithmic market scoring rule) market maker. The cost function is `C(q) = b · ln(e^(qYes/b) + e^(qNo/b))`, and a share's price is the probability the market assigns to it. Buying and selling use closed-form solutions, so:

- spending $50 always buys exactly $50 of shares,
- payout, average price, price impact and cash-out value all come from the same maths and always agree,
- the liquidity line ("$50 moves it about 1 point, $500 about 9") is computed from the live market, not written by hand.

### Simulation: `src/lib/sim/`

- `winProb.ts`: a simple Poisson model of hockey scoring (power plays, injuries, pulled goalie). It gives a "fair" chance for any game state.
- `engine.ts`: every 5 game seconds, the scripted events fire. A simulated crowd then trades part of the way toward the fair price, plus seeded noise. Snapshots are plain data, so the demo plays the same way every time. Rewinding re-simulates from the start and replays your trades at the moment you made them.
- `src/lib/data/markets.ts`: the game scripts, including each event's plain-language "why".

### App state: `src/lib/store.ts`

A Zustand store holds the demo clock, a ledger of your trades, payouts at settlement, and come-back notices. Balance and positions are derived from the ledger.

### UI: `src/components/`

| Component | Role |
| --- | --- |
| `AppShell` | Phone frame on desktop, full screen on mobile; drives the clock |
| `Discover`, `MarketCard` | The feed |
| `MarketDetail` | Probability hero, scoreboard, chart and explainer, liquidity, rules |
| `ProbabilityChart` | Hand-rolled SVG chart; markers are real, focusable buttons |
| `TradeSheet`, `CashOutSheet`, `BottomSheet` | Sheets with focus trap and drag-to-dismiss |
| `PositionCard`, `NoticeBanner`, `DemoPanel` | Position, come-back moment, demo controls |

## Design notes

- **One typeface** (Geist), a warm paper/ink neutral, and two outcome colours: blue for Yes, burnt orange for No. Both are chosen to stay distinct for colour-blind viewers, and both always come with a text label.
- **Motion with a job:** numbers glide to new values, the chart draws in and pulses once per event, sheets slide and drag, and confirming prints a receipt. `prefers-reduced-motion` turns all of it into simple fades.
- **Accessibility:** keyboard reachable (chart markers included), focus trapped in sheets, a text summary under the chart, a polite live region for notifications, and contrast checked in both themes.
- **Restraint:** most-you-can-lose is always visible. No countdowns, streaks, confetti or flashing.

## Deploy (Vercel)

Zero config. Import the GitHub repo at [vercel.com/new](https://vercel.com/new) and accept the defaults (framework: Next.js). Every push to `main` deploys.

The Open Graph image URL uses Vercel's production domain automatically. To use a custom domain, set `NEXT_PUBLIC_SITE_URL` (e.g. `https://plainly.example.com`) in the Vercel project settings.

## Make it yours

- `/about` (`src/app/about/page.tsx`) has placeholder copy, with each section marked **TODO**. Rewrite it in your own words, then set `SHOW_TODO_TAGS = false`.
- The intro line beside the phone is in `src/components/AppShell.tsx`.
