"use client";

import { useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * A number that glides to its new value instead of snapping, so a price
 * change reads as movement. Text is written straight to the DOM each frame,
 * so React doesn't re-render 60 times a second.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (v: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const spring = useSpring(value, { stiffness: 140, damping: 24, mass: 0.8 });
  const formatRef = useRef(format);
  const [initial] = useState(() => format(value));

  useEffect(() => {
    formatRef.current = format;
  });

  useEffect(() => {
    if (reduce) spring.jump(value);
    else spring.set(value);
    // Keep the text right even if the spring is mid-flight on re-render.
    if (reduce && ref.current) ref.current.textContent = formatRef.current(value);
  }, [value, reduce, spring]);

  useEffect(
    () =>
      spring.on("change", (v) => {
        if (ref.current) ref.current.textContent = formatRef.current(v);
      }),
    [spring],
  );

  return (
    <span ref={ref} className={`num ${className ?? ""}`}>
      {initial}
    </span>
  );
}
