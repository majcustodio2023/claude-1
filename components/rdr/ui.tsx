"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";

// A fast fling can jump an element from below the viewport to above it between frames, so an
// IntersectionObserver alone can leave it hidden. One shared scroll pass catches anything already
// passed. Content is visible without scripting via CSS.
const pending = new Map<Element, () => void>();
let ticking = false;
function sweep() {
  ticking = false;
  const vh = window.innerHeight;
  for (const [el, done] of pending) {
    const r = el.getBoundingClientRect();
    if (r.top < vh * 0.92 || r.bottom < 0) {
      pending.delete(el);
      done();
    }
  }
}
function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(sweep);
  }
}
function watch(el: Element, done: () => void) {
  if (pending.size === 0) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }
  pending.set(el, done);
  onScroll();
  return () => {
    pending.delete(el);
    if (pending.size === 0) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }
  };
}

/** True once the element has entered the viewport (once). */
export function useInViewOnce<T extends Element>(margin = "0px 0px -8% 0px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setInView(true);
      },
      { rootMargin: margin, threshold: 0.08 },
    );
    io.observe(el);
    const unwatch = watch(el, () => setInView(true));
    return () => {
      io.disconnect();
      unwatch();
    };
  }, [inView, margin]);
  return { ref, inView };
}

type RevealProps<T extends ElementType> = { as?: T; index?: number; children: ReactNode } & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

/** One staggered rise per element, once, as the section enters. */
export function Reveal<T extends ElementType = "div">({ as, index = 0, children, style, ...rest }: RevealProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, inView } = useInViewOnce<HTMLElement>();
  return (
    <Tag ref={ref} data-reveal="" data-in={inView ? "true" : "false"} style={{ ...(style as object), ["--i" as string]: index }} {...rest}>
      {children}
    </Tag>
  );
}

/** Flags a container with data-in once visible, for CSS-driven diagrams. */
export function InViewFlag<T extends ElementType = "div">({ as, children, ...rest }: { as?: T; children: ReactNode } & Omit<ComponentPropsWithoutRef<T>, "as" | "children">) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, inView } = useInViewOnce<HTMLElement>("0px 0px -20% 0px");
  return (
    <Tag ref={ref} data-in={inView ? "true" : "false"} {...rest}>
      {children}
    </Tag>
  );
}

/** Opens the application form; the offer key pre-selects a platform. */
export function ApplyButton({ offer = "general", children, className = "rbtn", source }: { offer?: string; children: ReactNode; className?: string; source?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent("rdr:apply", { detail: { offer, source: source ?? offer } }))}
    >
      {children}
    </button>
  );
}
