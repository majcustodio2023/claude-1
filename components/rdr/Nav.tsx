"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { ApplyButton } from "./ui";

const links = [
  { href: "#numbers", label: "The numbers" },
  { href: "#results", label: "Results" },
  { href: "#platforms", label: "Platforms" },
  { href: "#how", label: "How it works" },
  { href: "#questions", label: "Questions" },
];

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 50, restDelta: 0.001 });

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      setSolid(window.scrollY > 24);
      const el = document.elementFromPoint(Math.floor(window.innerWidth / 2), 40);
      const ground = el?.closest<HTMLElement>("[data-ground]")?.dataset.ground;
      if (ground === "light" || ground === "dark") setTheme(ground);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <nav className="rdr-nav" data-solid={solid ? "true" : "false"} data-theme={theme} aria-label="Page">
      <div className="wrap navbar">
        <a href="#top" className="mark">
          <i aria-hidden="true" />
          Boss RDR
        </a>
        <div className="links">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <ApplyButton source="nav">Apply</ApplyButton>
      </div>
      <motion.div className="rdr-progress" style={{ scaleX }} aria-hidden="true" />
    </nav>
  );
}
