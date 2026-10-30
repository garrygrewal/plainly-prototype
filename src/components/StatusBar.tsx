/**
 * A drawn iOS status bar and home indicator for the desktop phone frame.
 * Decorative only; real phones show their own.
 */
export function StatusBar() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-[65] hidden h-[47px] items-center justify-between px-8 pt-1 text-ink lg:flex"
    >
      <span className="num w-14 text-center text-[17px] font-semibold">9:41</span>
      <span className="absolute top-[11px] left-1/2 h-[34px] w-[124px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.1-1.2A10.2 10.2 0 0 0 8 1C5.3 1 2.8 2 .9 3.8L2 5c1.6-1.5 3.7-2.4 6-2.4Z" />
          <path d="M8 6c1.4 0 2.6.5 3.6 1.4l1.1-1.2A6.8 6.8 0 0 0 8 4.4c-1.8 0-3.4.7-4.7 1.8l1.1 1.2C5.4 6.5 6.6 6 8 6Z" />
          <path d="M8 9.3c.6 0 1.1.2 1.5.6L8 11.5 6.5 9.9c.4-.4.9-.6 1.5-.6Z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
          <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="19" height="9" rx="2" fill="currentColor" />
          <path d="M24.5 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity="0.4" />
        </svg>
      </span>
    </div>
  );
}

export function HomeIndicator() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-2 left-1/2 z-[65] hidden h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-ink lg:block"
    />
  );
}
