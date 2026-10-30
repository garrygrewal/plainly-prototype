import type { Market } from "@/lib/data/types";
import { CivicIcon, FilmIcon } from "./icons";

/**
 * The square at the start of a market card. Invented teams and leagues get a
 * neutral monogram (no logos); other topics get a plain category glyph.
 */
export function MarketIcon({ m, size = 40 }: { m: Market; size?: number }) {
  const box = "grid shrink-0 place-items-center rounded-[10px] bg-surface-2 text-ink";
  const style = { width: size, height: size };

  if (m.category.startsWith("Culture")) {
    return (
      <span aria-hidden className={box} style={style}>
        <FilmIcon size={20} />
      </span>
    );
  }
  if (m.category.startsWith("Local")) {
    return (
      <span aria-hidden className={box} style={style}>
        <CivicIcon size={20} />
      </span>
    );
  }
  // Hockey: the home team's code for a game, the league's for everything else.
  const mono = m.kind === "live" ? m.teams.home.abbr : "NSL";
  return (
    <span aria-hidden className={`${box} text-caption font-bold tracking-wide`} style={style}>
      {mono}
    </span>
  );
}
