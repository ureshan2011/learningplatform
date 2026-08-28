"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared motion primitives for the syllabus explorer.
 *
 * Two rules hold everywhere in this file:
 *
 * 1. Anything that runs per animation frame writes to the DOM directly rather
 *    than through React state. A 14-unit page re-rendering 60 times a second
 *    to move a highlight is how a rich page turns into a slow one.
 * 2. Everything degrades to a static page. `prefers-reduced-motion` and a
 *    missing IntersectionObserver both end with the content simply visible.
 */

/** Lets a component pass CSS custom properties through `style` without a cast at every call site. */
export function cssVars(vars: Record<string, string | number>): React.CSSProperties {
  return vars as React.CSSProperties;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/**
 * Reveals every `.syl-reveal` inside `root` as it scrolls into view, using one
 * observer for the whole section rather than one per card.
 *
 * `resetKey` re-scans after the list changes — switching view or filtering
 * mounts elements that were never observed.
 */
export function useRevealScope(
  root: React.RefObject<HTMLElement | null>,
  resetKey: unknown,
): void {
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const targets = Array.from(el.querySelectorAll<HTMLElement>(".syl-reveal"));
    if (targets.length === 0) return;

    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
      for (const target of targets) target.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "true";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    for (const target of targets) {
      if (target.dataset.revealed !== "true") observer.observe(target);
    }
    return () => observer.disconnect();
  }, [root, resetKey]);
}

/**
 * Which of `count` stations is currently crossing the middle of the viewport.
 *
 * Drives the roadmap rail's fill and the "Unit 5 of 14" readout. The tall
 * negative root margin leaves a thin band across the screen's middle, so
 * exactly one station is "active" at a time no matter how tall it is.
 */
export function useActiveStation(
  root: React.RefObject<HTMLElement | null>,
  count: number,
): number {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el || count === 0 || typeof IntersectionObserver === "undefined") return;

    const stations = Array.from(el.querySelectorAll<HTMLElement>("[data-station]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.station);
          if (Number.isFinite(index)) setActive(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    for (const station of stations) observer.observe(station);
    return () => observer.disconnect();
  }, [root, count]);

  return active;
}

/**
 * Pointer-tracked 3D tilt. Returns handlers to spread onto a `.syl-tilt`
 * element; the element re-reads the CSS variables written here, so tilting
 * never triggers a React render.
 *
 * Ignored on touch (`pointerType !== "mouse"`) — a phone has no hover, and
 * tilting under a finger just makes tap targets move.
 */
export function useTilt(maxDegrees = 5) {
  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse" || prefersReducedMotion()) return;
      const el = event.currentTarget;
      const box = el.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      el.style.setProperty("--tilt-y", `${(x * maxDegrees).toFixed(2)}deg`);
      el.style.setProperty("--tilt-x", `${(-y * maxDegrees).toFixed(2)}deg`);
      el.style.setProperty("--lift", "-4px");
    },
    [maxDegrees],
  );

  const onPointerLeave = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const el = event.currentTarget;
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--lift", "0px");
  }, []);

  return { onPointerMove, onPointerLeave };
}

/**
 * A number that counts up to `value` once, on mount.
 *
 * Renders `0` on the server and animates from there, so there is no hydration
 * mismatch and no layout shift — the digits are already in the DOM.
 */
export function CountUp({
  value,
  durationMs = 1100,
  className,
}: {
  value: number;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion() || value <= 0) {
      el.textContent = String(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / durationMs);
      // Cubic ease-out: fast off the mark, settling gently on the real figure.
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}

/**
 * The current time, refreshed on an interval — `null` until mounted.
 *
 * Class countdowns have to be computed on the client: this page is cached and
 * revalidated every few minutes, so a "starts in 12 min" rendered on the
 * server would be wrong for most visitors. Returning `null` first lets callers
 * render a plain, absolute date that matches the server exactly, then swap to
 * a live countdown once hydrated.
 */
export function useNow(intervalMs = 20_000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // The first value has to be set here — there is no earlier client-side
    // moment to read the clock, and reading it during render would break
    // hydration. Subsequent values come from the interval.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
