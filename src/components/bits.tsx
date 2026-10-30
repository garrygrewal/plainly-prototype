/** A screen inside the phone. Each one scrolls on its own, so scroll position survives navigation. */
export function Screen({ children }: { children: React.ReactNode }) {
  return <div className="no-scrollbar h-full overflow-y-auto overscroll-contain">{children}</div>;
}
