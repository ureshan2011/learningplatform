"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/components/syllabus/motion";

/**
 * Wires up the landing page's scroll motion in one place — parallax drift on
 * `[data-lp-par]` elements, the fixed progress bar, the pill nav's scroll
 * shadow, and reveal-on-scroll for `.lp-reveal` elements — all found by
 * scanning this component's own subtree on mount.
 *
 * Every per-frame write goes straight to the DOM instead of through React
 * state, same rule as the syllabus explorer's motion primitives: a scroll
 * event here never triggers a re-render.
 */
export function ScrollEffects({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const bar = root.querySelector<HTMLElement>("[data-lp-progress]");
    const nav = root.querySelector<HTMLElement>("[data-lp-nav]");
    const parEls = Array.from(root.querySelectorAll<HTMLElement>("[data-lp-par]"));
    const revealEls = Array.from(root.querySelectorAll<HTMLElement>(".lp-reveal"));
    const reduced = prefersReducedMotion();
    const bases = new Map<HTMLElement, number>();

    const measure = () => {
      for (const el of parEls) {
        const prevTransform = el.style.transform;
        el.style.transform = "none";
        const rect = el.getBoundingClientRect();
        bases.set(el, rect.top + window.scrollY + rect.height / 2);
        el.style.transform = prevTransform;
      }
    };

    let raf: number | null = null;
    const frame = () => {
      raf = null;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const scrollable = document.documentElement.scrollHeight - vh;
      if (bar) bar.style.width = (scrollable > 0 ? Math.min(100, (y / scrollable) * 100) : 0) + "%";
      if (nav) nav.dataset.scrolled = y > 40 ? "true" : "false";
      if (reduced) return;
      for (const el of parEls) {
        const strength = parseFloat(el.dataset.lpPar || "0");
        const base = bases.get(el) ?? 0;
        const offset = base - (y + vh / 2);
        el.style.transform = `translate3d(0, ${(-offset * strength).toFixed(2)}px, 0)`;
      }
    };

    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      measure();
      frame();
    };

    measure();
    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Fonts and images can still be settling in; one late re-measure catches
    // any layout shift the initial pass missed.
    const settle = window.setTimeout(onResize, 600);

    let observer: IntersectionObserver | null = null;
    if (revealEls.length) {
      if (reduced || typeof IntersectionObserver === "undefined") {
        for (const el of revealEls) el.dataset.revealed = "true";
      } else {
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              (entry.target as HTMLElement).dataset.revealed = "true";
              observer?.unobserve(entry.target);
            }
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
        );
        for (const el of revealEls) observer.observe(el);
      }
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(settle);
      if (raf !== null) cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="landing-ict w-full overflow-x-hidden">
      {children}
    </div>
  );
}
