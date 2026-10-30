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
  emphasis = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  /** A second, quieter line under the label. */
  sub?: React.ReactNode;
  onInfo?: () => void;
  infoLabel?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 py-1">
      <dt className="min-w-0 text-subhead text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          {label}
          {onInfo && (
            <button
              type="button"
              onClick={onInfo}
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
    </div>
  );
}

/** A list of KeyValueRows. */
export function KeyValueList({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <dl className={className}>{children}</dl>;
}
