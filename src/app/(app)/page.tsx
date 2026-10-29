import Link from "next/link";
import { Screen, TopBar } from "@/components/bits";
import { MARKETS } from "@/lib/data/markets";

// Temporary list; the Discover feed lands in stage E.
export default function Discover() {
  return (
    <Screen>
      <TopBar />
      <ul className="space-y-2 p-4">
        {MARKETS.map((m) => (
          <li key={m.id}>
            <Link href={`/m/${m.id}`} className="block rounded-2xl bg-surface p-4">
              {m.question}
            </Link>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
