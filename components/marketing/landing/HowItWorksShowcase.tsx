"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/components/syllabus/motion";
import { ArrowRightIcon, CheckCircleIcon, DownloadIcon } from "./icons";

type Step = { step: string; title: string; body: string };

const EASE = "cubic-bezier(0.2, 0.8, 0.25, 1)";
const AUTOPLAY_MS = 3800;

/**
 * A synced "step list + live phone preview" that dramatizes the four steps
 * above it, so a visitor sees the actual product (sign in, free trial, a
 * live quiz, downloadable notes) rather than reading a claim about it.
 *
 * The four inner screens are hand-matched to `STEPS` in page.tsx by index —
 * this is a purpose-built piece for that exact flow, not a generic carousel.
 * Motion follows the same rules as `.lp-reveal` elsewhere on this page:
 * opacity + a small translate, one easing curve, no bounce, no spring, and
 * autoplay stops entirely under `prefers-reduced-motion` or once the piece
 * scrolls out of view.
 */
export function HowItWorksShowcase({ steps }: { steps: ReadonlyArray<Step> }) {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Reading `matchMedia` only exists client-side — same pattern as `useNow`
    // in components/syllabus/motion.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(prefersReducedMotion());
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || paused || reduced) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % steps.length), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [inView, paused, reduced, steps.length]);

  return (
    <div
      ref={rootRef}
      className="grid items-center gap-10 lg:grid-cols-[1.1fr_auto]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex flex-col gap-1.5">
        {steps.map((s, i) => {
          const isActive = active === i;
          return (
            <button
              key={s.step}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActive(i)}
              className="flex items-start gap-4 rounded-(--lp-radius-md) border px-5 py-4 text-left"
              style={{
                borderColor: isActive ? "var(--lp-orange-200)" : "transparent",
                background: isActive ? "var(--lp-orange-50)" : "transparent",
                transition: `background 200ms ${EASE}, border-color 200ms ${EASE}`,
              }}
            >
              <span
                className="mt-0.5 font-[family-name:var(--lp-font-mono)] text-xs font-bold"
                style={{ color: isActive ? "var(--lp-orange-500)" : "var(--lp-ink-300)" }}
              >
                {s.step}
              </span>
              <span>
                <span className="block text-base font-bold text-(--lp-ink-900)">{s.title}</span>
                <span className="mt-1 block text-sm text-(--lp-ink-400)">{s.body}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mx-auto flex flex-col items-center gap-5" aria-hidden>
        <div className="relative w-[min(70vw,280px)]" style={{ aspectRatio: "9 / 19" }}>
          <div className="absolute inset-0 rounded-[38px] bg-(--lp-ink-900) p-2.5 shadow-[var(--lp-shadow-lg)]">
            <div className="absolute top-3 left-1/2 h-[16px] w-[70px] -translate-x-1/2 rounded-full bg-(--lp-ink-900)" />
            <div className="relative h-full w-full overflow-hidden rounded-[30px] bg-(--lp-paper-0)">
              {SCREENS.map((Screen, i) => {
                const isActive = active === i;
                return (
                  <div
                    key={i}
                    aria-hidden={!isActive}
                    className="absolute inset-0"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translate3d(0,0,0)" : "translate3d(0,10px,0)",
                      transition: reduced ? "none" : `opacity 340ms ${EASE}, transform 340ms ${EASE}`,
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                  >
                    <Screen />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {steps.map((s, i) => (
            <span
              key={s.step}
              aria-hidden
              className="h-[6px] w-[6px] rounded-full"
              style={{
                background: active === i ? "var(--lp-orange-500)" : "var(--lp-paper-200)",
                transition: `background 200ms ${EASE}`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const FONT_DISPLAY = "font-[family-name:var(--lp-font-display)]";
const FONT_MONO = "font-[family-name:var(--lp-font-mono)]";

function ScreenWrap({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full flex-col gap-4 px-5 pt-11">{children}</div>;
}

function SignUpScreen() {
  return (
    <ScreenWrap>
      <div className={`${FONT_DISPLAY} text-center text-[13px] font-extrabold tracking-[-0.02em] text-(--lp-ink-900)`}>
        ICT<span className="text-(--lp-orange-500)">CAMPUS</span>
      </div>
      <div className={`${FONT_DISPLAY} mt-1 text-xl font-extrabold tracking-[-0.02em] text-(--lp-ink-900)`}>
        Sign up
      </div>
      <div className={`${FONT_MONO} flex h-11 items-center rounded-full border border-(--lp-paper-200) px-4 text-sm font-semibold text-(--lp-ink-900)`}>
        +94 7X XXX XXXX
      </div>
      <div className="flex justify-center gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex h-10 w-8 items-center justify-center rounded-lg border-2"
            style={{
              borderColor: i < 4 ? "var(--lp-orange-500)" : "var(--lp-paper-200)",
              background: i < 4 ? "var(--lp-orange-50)" : "var(--lp-paper-0)",
            }}
          />
        ))}
      </div>
      <div className="mx-auto mt-1 flex items-center gap-1.5 rounded-full bg-(--lp-green-500) px-3 py-1.5 text-xs font-bold text-white">
        <CheckCircleIcon className="size-3.5" />
        Verified
      </div>
    </ScreenWrap>
  );
}

function FreeTrialScreen() {
  return (
    <ScreenWrap>
      <div className="rounded-2xl border border-(--lp-paper-200) bg-(--lp-paper-0) p-4 shadow-[0_10px_24px_rgba(28,21,18,0.08)]">
        <div className="flex items-center justify-between">
          <span className={`${FONT_DISPLAY} text-base font-extrabold text-(--lp-ink-900)`}>A/L ICT</span>
          <span className="rounded-full bg-(--lp-orange-50) px-2.5 py-1 text-[10px] font-bold text-(--lp-orange-500)">A/L</span>
        </div>
        <p className="mt-2 text-xs font-bold text-(--lp-green-500)">First 7 days free</p>
        <p className="mt-0.5 text-[11px] text-(--lp-ink-400)">No card required to start</p>
      </div>
      <div className="flex h-11 items-center justify-center gap-2 rounded-full bg-(--lp-orange-500) text-sm font-bold text-white shadow-[0_10px_20px_rgba(244,85,30,0.32)]">
        Start free trial
        <ArrowRightIcon className="size-3.5" />
      </div>
    </ScreenWrap>
  );
}

function LiveScreen() {
  return (
    <ScreenWrap>
      <div className="flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--lp-orange-500) opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-(--lp-orange-500)" />
        </span>
        <span className={`${FONT_MONO} text-[10px] font-bold tracking-[0.1em] text-(--lp-ink-900)`}>LIVE CLASS</span>
      </div>
      <div className="h-[86px] rounded-2xl bg-(--lp-ink-900)" />
      <div className="rounded-2xl border border-(--lp-paper-200) bg-(--lp-paper-0) p-3.5 shadow-[0_10px_24px_rgba(28,21,18,0.08)]">
        <p className="text-xs font-bold text-(--lp-ink-900)">Which gate outputs 1 only when both inputs are 1?</p>
        <div className="mt-2.5 flex flex-col gap-1.5">
          {["OR", "AND", "NOR"].map((opt) => (
            <div
              key={opt}
              className="flex h-7 items-center rounded-full pl-3 text-[11px] font-bold"
              style={{
                background: opt === "AND" ? "var(--lp-orange-500)" : "var(--lp-paper-200)",
                color: opt === "AND" ? "#fff" : "var(--lp-ink-900)",
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>
    </ScreenWrap>
  );
}

function NotesScreen() {
  const notes = ["Unit 4 — Logic gates", "Past paper 2025", "Number systems"];
  return (
    <ScreenWrap>
      <div className={`${FONT_DISPLAY} text-lg font-extrabold text-(--lp-ink-900)`}>Your notes</div>
      {notes.map((n) => (
        <div key={n} className="flex items-center gap-3 rounded-xl border border-(--lp-paper-200) bg-(--lp-paper-0) px-3.5 py-3">
          <span className="h-[26px] w-[22px] shrink-0 rounded-[3px] bg-(--lp-orange-50)" />
          <span className="flex-1 text-xs font-bold text-(--lp-ink-900)">{n}</span>
          <DownloadIcon className="size-4 shrink-0 text-(--lp-orange-500)" />
        </div>
      ))}
    </ScreenWrap>
  );
}

const SCREENS = [SignUpScreen, FreeTrialScreen, LiveScreen, NotesScreen];
