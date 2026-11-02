import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "About this concept",
  description:
    "Why Plainly looks the way it does: the problem, three design principles, the key decisions, and what I'd test next.",
};

const REPO_URL = "https://github.com/garrygrewal/plainly-prototype";

const principles = [
  {
    title: "Explain it in words first",
    body: "Icons and colours shouldn’t carry the meaning on their own. Every number comes with a sentence, and when the price moves, the app says why. Plain language is clearer than percentages or dollars: “64%” becomes “Likely: about 2 times in 3.”",
  },
  {
    title: "Avoid jargon",
    body: "New users don’t think in words like liquidity, price impact or points, so the app doesn’t use them. It says what happens in everyday terms instead: “A $50 trade moves the price about 1¢.”",
  },
  {
    title: "Calm by default",
    body: "No countdowns, streaks, confetti or flashing. This isn’t a casino. The most you can lose is always on screen, and responsible gambling is a core part of the product, not something slapped onto the footer.",
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
];

const next = [
  "Cash-out: can people predict roughly what they’d get before they open the sheet?",
  "“Why it moved”: do the explanations make people more confident, or do they encourage chasing moves?",
  "Notifications: which moments are worth an interruption, and how often before it starts to feel like pressure?",
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
            A concept prototype by Garry Grewal. It follows one live hockey game from discovery to
            cash-out, and puts every price into plain words.
          </p>
        </header>

        <Section title="The problem">
          <p>
            I believe the job of a prediction market is to make three things abundantly clear: the
            chance, the cost, and why the market is moving. Trust is a big part of any financial
            tool, and prediction markets make it hard to earn.
          </p>
          <p className="mt-3">
            Numbers move without making it clear why. New users can’t tell a good price from a bad
            one, or what a trade will really cost them.
          </p>
        </Section>

        <Section title="Three principles">
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

        <Section title="Key decisions">
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

        <Section title="What I’d research and test next">
          <ul className="list-disc space-y-2 pl-5 marker:text-ink-3">
            {next.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Section>

        <Section title="How I built it">
          <p>
            I built this in a couple of hours with an AI coding agent (Claude Code). I wrote the
            brief and the principles, set the visual and motion direction, and wrote and edited the
            copy. The agent drafted the code, and I reviewed it screen by screen. The pricing maths
            lives in one commented module with unit tests, so the numbers can be checked, not just
            trusted.
          </p>
          <p className="mt-3">
            <a
              href={REPO_URL}
              className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-ink-3/50 decoration-2 underline-offset-4 hover:decoration-ink"
            >
              See the code on GitHub
            </a>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-title2 font-bold">{title}</h2>
      <div className="mt-4 text-body text-ink-2">{children}</div>
    </section>
  );
}
