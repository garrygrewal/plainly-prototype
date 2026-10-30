import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "About this concept",
  description:
    "Why Plainly looks the way it does: the problem, four design principles, the key decisions, and what I'd test next.",
};

/**
 * Case study. Every block marked <Todo> is placeholder copy to rewrite in
 * your own words. Set SHOW_TODO_TAGS to false to hide the markers.
 */
const SHOW_TODO_TAGS = true;

function Todo() {
  if (!SHOW_TODO_TAGS) return null;
  return (
    <span className="ml-2 inline-block rounded-[6px] border border-dashed border-negative px-1.5 py-0.5 align-middle text-caption font-semibold text-negative">
      TODO: rewrite in your words
    </span>
  );
}

const principles = [
  {
    title: "Say it in words first",
    body: "Every number comes with a sentence. “64%” becomes “Likely: the market thinks this happens about 2 times in 3.” People reason better with natural frequencies than with percentages or cents.",
  },
  {
    title: "Show why it moved",
    body: "A price that jumps without a reason feels like a slot machine. Every big move is pinned to the moment that caused it, and tapping it explains the move in one line.",
  },
  {
    title: "Explain by consequence",
    body: "Nobody needs the word “liquidity”. They need to know that a $50 trade moves this price about 1 point and $500 moves it about 9, and what their own trade will do before they make it.",
  },
  {
    title: "Calm by default",
    body: "Most you can lose is always on screen. No countdowns, streaks, confetti or flashing. Cash-out is compared with holding, both ways, without a nudge. Responsible-trading cues are part of the product, not a legal footer.",
  },
];

const decisions = [
  {
    chose: "Fit the host app instead of inventing a brand",
    over: "A standalone visual identity",
    why: "The prototype is designed to fit MetaMask’s existing mobile visual language: dark filled surfaces, its type scale, tinted Yes/No pills and swap-style key-value rows, following Apple’s Human Interface Guidelines. It uses no logos or brand assets.",
  },
  {
    chose: "One live game, followed from discovery to cash-out",
    over: "A full exchange with dozens of markets",
    why: "Depth on the moment of trust (understanding, deciding, watching it move) says more than breadth.",
  },
  {
    chose: "Chance in words and natural frequencies, with cents as a secondary detail",
    over: "Decimal or moneyline odds",
    why: "Odds formats are sportsbook shorthand, and they hide the idea that price equals probability.",
  },
  {
    chose: "Event markers on the chart",
    over: "A separate news or play-by-play feed",
    why: "The cause sits right on the effect, so the explanation is where the eye already is.",
  },
  {
    chose: "A real market maker (LMSR) under the mock data",
    over: "Hand-picked numbers",
    why: "Payout, average price, price impact and cash-out value always agree with each other, because they come from the same maths.",
  },
  {
    chose: "The host app’s tinted green Yes and red No, always with a label",
    over: "My own blue and orange outcome colours",
    why: "Matching the existing Predictions pattern makes the feature feel native. The words Yes and No are always on the pill, and gains and losses carry a sign and an arrow, so colour is never the only cue.",
  },
];

const next = [
  "Comprehension test: do “2 times in 3” and the liquidity line beat percentages alone? Unmoderated, with 5 or 6 comprehension questions per variant.",
  "Do “why it moved” explanations make people more confident, or do they encourage chasing moves?",
  "Cash-out: can people predict what they’d get before they open the sheet?",
  "Notifications: which moments are worth an interruption, and how often before it feels like pressure?",
  "Onchain realities: network fees, settlement time and wallet confirmation, and how to explain them in the same plain voice.",
];

export default function About() {
  return (
    <div className="min-h-dvh bg-bg pt-safe">
      <div className="mx-auto max-w-[680px] px-4 pb-20 sm:px-8">
        <nav className="flex h-11 items-center justify-between">
          <Link href="/" className="pressable -ml-1 flex h-11 items-center gap-0.5 pr-2 text-body text-ink">
            <ChevronLeft size={26} strokeWidth={2.2} />
            Prototype
          </Link>
          <ThemeToggle />
        </nav>

        <header className="mt-10">
          <p className="text-subhead font-semibold text-ink-2">Plainly · case study</p>
          <h1 className="mt-2 text-large-title font-bold text-balance">Prediction markets that explain themselves</h1>
          <p className="mt-4 text-body text-ink-2">
            A concept prototype by [TODO: your name], lead product designer. It follows one live
            hockey game from discovery to cash-out, and turns every price into plain words.
            <Todo />
          </p>
        </header>

        <Section title="The problem" todo>
          <p>
            A prediction market packs three ideas into one number. “64¢” is a price, a probability
            and a bet all at once, and most people only see one of them. Then the number moves during
            a game and nothing says why. People who don’t trade every day can’t tell a good price from
            a bad one, or what a trade will cost them beyond the sticker price.
          </p>
          <p className="mt-3">
            The job: make probabilities, liquidity and market mechanics feel obvious, without hiding
            the risk.
          </p>
        </Section>

        <Section title="Four principles" todo>
          <ol className="space-y-5">
            {principles.map((p, i) => (
              <li key={p.title} className="flex gap-4">
                <span className="num mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-footnote font-semibold text-ink">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-body font-semibold text-ink">{p.title}</span>
                  <span className="mt-1 block">{p.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Key decisions" todo>
          <ul className="space-y-2">
            {decisions.map((d) => (
              <li key={d.chose} className="rounded-card bg-surface p-4">
                <p className="text-body font-semibold text-ink">{d.chose}</p>
                <p className="mt-0.5 text-footnote text-ink-3">Instead of: {d.over}</p>
                <p className="mt-2 text-subhead">{d.why}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="What I’d research and test next" todo>
          <ul className="list-disc space-y-2 pl-5 marker:text-ink-3">
            {next.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Section>

        <Section title="How I built it" todo>
          <p>
            I built this with an AI coding agent (Claude Code) in [TODO: time]. I wrote the brief and
            the principles, set the visual and motion direction, and wrote and edited the copy. The
            agent drafted the code and I reviewed it, screen by screen. The pricing maths lives in one
            commented module with unit tests, so the numbers can be checked, not just trusted.
          </p>
          <p className="mt-3 text-subhead text-ink-3">
            Next.js, TypeScript, Tailwind CSS and Motion. A hand-drawn SVG chart. Seeded simulation,
            so the demo plays the same way every time.
          </p>
        </Section>

        <footer className="mt-16 space-y-2 border-t border-line pt-6 text-footnote text-ink-3">
          <p>
            Concept prototype. All teams, players, films, places and markets are made up. Demo money
            only: no wallet, no real trading, no data collected.
          </p>
          <p>Independent concept. Not affiliated with or endorsed by MetaMask.</p>
        </footer>
      </div>
    </div>
  );
}

function Section({
  title,
  todo,
  children,
}: {
  title: string;
  todo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-title2 font-bold">
        {title}
        {todo && <Todo />}
      </h2>
      <div className="mt-4 text-body text-ink-2">{children}</div>
    </section>
  );
}
