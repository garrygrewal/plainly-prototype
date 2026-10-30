import Link from "next/link";
import { ChevronLeft } from "../icons";

/**
 * A 44pt iOS navigation bar: back chevron with the previous screen's title
 * on the left, a centred title, and an optional trailing slot.
 */
export function NavBar({
  back,
  title,
  trailing,
}: {
  back?: { href: string; label: string };
  title?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 grid h-11 grid-cols-[1fr_auto_1fr] items-center bg-bg/85 px-2 backdrop-blur-xl">
      <div className="flex min-w-0 items-center">
        {back && (
          <Link
            href={back.href}
            className="pressable flex h-11 min-w-11 items-center gap-0.5 pr-2 text-body text-ink"
          >
            <ChevronLeft size={26} strokeWidth={2.2} className="-ml-0.5" />
            <span className="truncate">{back.label}</span>
          </Link>
        )}
      </div>
      <div className="truncate px-2 text-center text-body font-semibold">{title}</div>
      <div className="flex min-w-0 items-center justify-end gap-1 pr-2">{trailing}</div>
    </header>
  );
}
