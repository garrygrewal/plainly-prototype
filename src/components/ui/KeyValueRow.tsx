import { Info } from "../icons";

/**
 * Label on the left, value on the right, the way fee and rate rows read in
 * a swap screen. An optional ⓘ opens a plain-words explanation.
 */
export function KeyValueRow({
  label,
  value,
  sub,
  onInfo,
  infoLabel,
  infoExpanded,
  explanation,
  emphasis = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  /** A second, quieter line under the label. */
  sub?: React.ReactNode;
  onInfo?: () => void;
  infoLabel?: string;
  /** Set when the ⓘ reveals an explanation in place rather than opening a sheet. */
  infoExpanded?: boolean;
  /** Shown under the row, full width, while infoExpanded is true. */
  explanation?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 py-1">
      <dt className="min-w-0 text-subhead text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          {label}
          {onInfo && (
            <button
              type="button"
              onClick={onInfo}
              aria-expanded={infoExpanded}
              aria-label={infoLabel ?? `What is ${typeof label === "string" ? label : "this"}?`}
              className="hit-area -my-2 grid size-5 place-items-center rounded-full text-ink-3 hover:text-ink"
            >
              <Info size={15} />
            </button>
          )}
        </span>
        {sub && <span className="block text-footnote text-ink-3">{sub}</span>}
      </dt>
      <dd className={`num shrink-0 text-right text-subhead ${emphasis ? "font-semibold text-ink" : "text-ink"}`}>
        {value}
      </dd>
      {infoExpanded && explanation && (
        <dd className="mt-1 mb-1 basis-full rounded-tile bg-sheet-fill px-3 py-2.5 text-footnote text-ink-2">
          {explanation}
        </dd>
      )}
    </div>
  );
}

/** A list of KeyValueRows. */
export function KeyValueList({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <dl className={className}>{children}</dl>;
}
