import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Screen } from "@/components/bits";
import { NavBar } from "@/components/ui/NavBar";
import { MarketDetail } from "@/components/MarketDetail";
import { MARKETS, getMarket } from "@/lib/data/markets";

export function generateStaticParams() {
  return MARKETS.map((m) => ({ id: m.id }));
}

export async function generateMetadata(props: PageProps<"/m/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: getMarket(id)?.question ?? "Market" };
}

async function Market({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getMarket(id)) notFound();
  return <MarketDetail id={id} />;
}

export default function MarketPage(props: PageProps<"/m/[id]">) {
  return (
    <Suspense
      fallback={
        <Screen>
          <NavBar back={{ href: "/", label: "Predictions" }} />
        </Screen>
      }
    >
      <Market params={props.params} />
    </Suspense>
  );
}
