"use client";

// Adapted from magicui's number-ticker (MIT, magicuidesign/magicui): a spring count-up once in view.
import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring, useReducedMotion } from "motion/react";

export function NumberTicker({ value, decimals = 0, delay = 0, className, suffix = "", prefix = "" }: { value: number; decimals?: number; delay?: number; className?: string; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 46, stiffness: 70 });
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const fmt = (n: number) => `${prefix}${new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)}${suffix}`;

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      if (ref.current) ref.current.textContent = fmt(value);
      return;
    }
    const t = setTimeout(() => mv.set(value), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, delay, reduce]);

  useEffect(
    () =>
      spring.on("change", (latest) => {
        if (ref.current) ref.current.textContent = fmt(Number(latest.toFixed(decimals)));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spring, decimals, suffix, prefix],
  );

  return (
    <span ref={ref} className={className} aria-label={fmt(value)}>
      {fmt(value)}
    </span>
  );
}
