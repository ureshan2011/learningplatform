"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Button, Eyebrow, StatusChip } from "@/components/ds";
import { Icon } from "@/components/ui/Icon";
import { Scene, type SceneId, type SceneLabels } from "@/components/tour/scenes";

export interface TourSlide {
  scene: SceneId;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  /** Where "open it" goes. Omitted on slides that are not one screen. */
  href?: string;
  cta?: string;
  /** "free" or "included" — shown as a small status chip. */
  access?: "free" | "included";
}

export interface TourLabels {
  skip: string;
  next: string;
  back: string;
  finish: string;
  close: string;
  /** "{n} of {total}" */
  progress: string;
  goTo: string;
  free: string;
  included: string;
  swipe: string;
}

export interface TourConfig {
  slides: TourSlide[];
  labels: TourLabels;
  scene: SceneLabels;
  /** Open by itself on the dashboard the first time this browser signs in. */
  autoStart?: boolean;
}

/**
 * Bumped when the tour changes enough that returning students should see it
 * again. Per-browser on purpose: this is a courtesy, not a record, and a
 * Firestore write per student to remember it is not worth the bill.
 */
const SEEN_KEY = "ict-tour-seen-v1";

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* private mode — the worst case is seeing the tour twice */
  }
}

function hasSeen() {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Storage blocked: never auto-open, or it would open on every visit.
    return true;
  }
}

/**
 * The welcome tour: a short, swipeable run through what a student can do here,
 * the most striking features first.
 *
 * ## Why slides and not spotlights
 *
 * The usual product tour dims the page and points at buttons. Here most of
 * what is worth showing — the live quiz, the Code Lab, a mock exam — is not on
 * the screen the student lands on, and on a phone half the navigation sits
 * behind "More". Pointing at a closed menu shows nothing. So each stop is a
 * slide with a small animated picture of the feature and a link straight to
 * it, which reads the same on a 360px phone as on a laptop.
 *
 * A bottom sheet on mobile, in the thumb's reach, and a centred two-column
 * panel from `md` up. Swipe, arrow keys and the progress segments all move
 * between slides; Escape or Skip closes it; it can be reopened any time from
 * the rail.
 */
export function WelcomeTour({
  config,
  open,
  onOpenChange,
  pathname,
}: {
  config: TourConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
}) {
  const { slides, labels, scene } = config;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [reduced, setReduced] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const last = slides.length - 1;
  const slide = slides[index];

  // First sign-in on this browser: open by itself, once, on the dashboard only
  // — never over a live class or a mock exam someone deep-linked into.
  useEffect(() => {
    if (!config.autoStart || pathname !== "/dashboard" || hasSeen()) return;
    const id = setTimeout(() => onOpenChange(true), 700);
    return () => clearTimeout(id);
  }, [config.autoStart, pathname, onOpenChange]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Opening: remember it, freeze the page behind, and move focus into the
  // dialog. Closing hands focus back to whatever opened it.
  useEffect(() => {
    if (!open) return;
    markSeen();
    returnFocus.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      returnFocus.current?.focus?.();
    };
  }, [open]);

  const close = useCallback(() => {
    onOpenChange(false);
    // Next time it opens it starts from the top.
    setTimeout(() => setIndex(0), 200);
  }, [onOpenChange]);

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to > last || to === index) return;
      setDir(to > index ? "next" : "prev");
      setIndex(to);
    },
    [index, last],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowRight") {
      go(index + 1);
    } else if (e.key === "ArrowLeft") {
      go(index - 1);
    } else if (e.key === "Tab") {
      // Keep keyboard focus inside the dialog.
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const end = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        end.focus();
      } else if (!e.shiftKey && document.activeElement === end) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    go(dx < 0 ? index + 1 : index - 1);
  };

  if (!open || !slide) return null;

  const enter = reduced ? "" : dir === "next" ? "ict-tour-next" : "ict-tour-prev";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
      <button
        type="button"
        aria-label={labels.close}
        tabIndex={-1}
        onClick={close}
        className="ict-tour-scrim absolute inset-0 bg-[rgba(14,12,11,0.72)] backdrop-blur-[6px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-roledescription="carousel"
        aria-labelledby="ict-tour-title"
        tabIndex={-1}
        // Focus lands here programmatically on open; the global focus ring
        // would otherwise draw an orange frame round the whole dialog.
        style={{ outline: "none" }}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
        className={clsx(
          "ict-enter relative flex max-h-[94dvh] w-full touch-pan-y flex-col overflow-hidden",
          "rounded-t-ict-panel border-t border-ict-border-dark bg-ict-ink-850",
          "md:grid md:max-h-[min(640px,92dvh)] md:w-[min(960px,100%)] md:grid-cols-[1.1fr_1fr] md:grid-rows-[auto_1fr_auto]",
          "md:rounded-ict-panel md:border",
        )}
      >
        {/* -------- Header: progress + skip -------- */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 md:col-start-2 md:row-start-1 md:px-8 md:pt-7">
          <div className="flex flex-1 gap-1" role="tablist" aria-label={labels.progress.replace("{n}", String(index + 1)).replace("{total}", String(slides.length))}>
            {slides.map((s, i) => (
              <button
                key={s.scene}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={labels.goTo.replace("{n}", String(i + 1))}
                onClick={() => go(i)}
                className="group flex h-6 flex-1 items-center"
              >
                <span className="relative block h-1 w-full overflow-hidden rounded-full bg-ict-ink-600 transition-colors duration-[120ms] group-hover:bg-ict-ink-500">
                  <span
                    className={clsx(
                      "absolute inset-y-0 left-0 rounded-full bg-ict-paper-50 transition-[width] duration-[340ms] ease-ict-out",
                      i <= index ? "w-full" : "w-0",
                    )}
                  />
                </span>
              </button>
            ))}
          </div>
          {index < last ? (
            <button
              type="button"
              onClick={close}
              className="ict-press h-8 shrink-0 rounded-full px-3 text-sm font-semibold text-ict-ink-300 transition-colors duration-[120ms] hover:bg-ict-ink-800 hover:text-ict-paper-50"
            >
              {labels.skip}
            </button>
          ) : (
            <button
              type="button"
              onClick={close}
              aria-label={labels.close}
              className="grid size-8 shrink-0 place-items-center rounded-full text-ict-ink-300 transition-colors duration-[120ms] hover:bg-ict-ink-800 hover:text-ict-paper-50"
            >
              <Icon name="close" className="!text-lg" />
            </button>
          )}
        </div>

        {/* -------- Stage: the animated picture -------- */}
        <div className="px-3 md:col-start-1 md:row-span-3 md:row-start-1 md:p-3">
          <div
            className="relative h-[clamp(230px,38dvh,340px)] overflow-hidden rounded-ict-card border border-ict-feature-line bg-ict-feature md:h-full md:min-h-[440px]"
          >
            {/* The radial spotlight the system allows on a brand surface. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: "radial-gradient(90% 70% at 50% 0%, rgba(244,85,30,.22), transparent 65%)",
              }}
            />
            <div key={index} className={clsx("relative flex size-full items-center justify-center", enter)}>
              <FitToStage>
                <Scene id={slide.scene} active={open} labels={scene} reduced={reduced} />
              </FitToStage>
            </div>
          </div>
        </div>

        {/* -------- Copy -------- */}
        <div
          aria-live="polite"
          className="min-h-0 flex-1 overflow-y-auto px-6 pt-5 pb-2 md:col-start-2 md:row-start-2 md:px-8 md:pt-4"
        >
          <div key={index} className={enter}>
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow>{slide.eyebrow}</Eyebrow>
              {slide.access ? (
                <StatusChip tone={slide.access === "free" ? "success" : "neutral"}>
                  {slide.access === "free" ? labels.free : labels.included}
                </StatusChip>
              ) : null}
            </div>
            <h2
              id="ict-tour-title"
              className="mt-2.5 font-display text-2xl leading-tight font-extrabold tracking-[-0.02em] text-ict-fg md:text-[30px]"
            >
              {slide.title}
              {index === last ? <span className="text-ict-orange-500">.</span> : null}
            </h2>
            <p className="mt-2.5 text-sm text-ict-fg-soft md:text-base">{slide.body}</p>
            {slide.points.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {slide.points.map((p, i) => (
                  <li
                    key={p}
                    className={clsx("flex items-start gap-2.5 text-sm text-ict-fg", !reduced && "ict-enter")}
                    style={{ ["--enter-delay" as string]: `${120 + i * 60}ms` }}
                  >
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ict-surface-raised text-ict-fg">
                      <Icon name="done" className="!text-xs" strokeWidth={3} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            ) : null}
            {slide.href && slide.cta ? (
              <Link
                href={slide.href}
                onClick={close}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ict-fg underline decoration-ict-line-strong underline-offset-4 transition-colors duration-[120ms] hover:decoration-ict-fg"
              >
                {slide.cta}
                <Icon name="arrow_forward" className="!text-sm" />
              </Link>
            ) : null}
            {index === 0 ? <p className="mt-5 text-xs text-ict-ink-400 md:hidden">{labels.swipe}</p> : null}
          </div>
        </div>

        {/* -------- Footer -------- */}
        <div className="flex items-center gap-3 border-t border-ict-border-dark px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:col-start-2 md:row-start-3 md:border-t-0 md:px-8 md:pb-7">
          <span className="text-xs font-semibold text-ict-ink-400 tabular-nums">
            {labels.progress.replace("{n}", String(index + 1)).replace("{total}", String(slides.length))}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {index > 0 ? (
              <Button variant="ghost" arrow="none" onClick={() => go(index - 1)}>
                {labels.back}
              </Button>
            ) : null}
            {index < last ? (
              <Button onClick={() => go(index + 1)}>{labels.next}</Button>
            ) : (
              <Button onClick={close}>{labels.finish}</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Shrinks a scene to fit the stage instead of cropping it.
 *
 * The stage is a fixed share of the screen, and phones range from a 640px-tall
 * budget Android to a tall iPhone, so a scene that fits one is cut off on the
 * other. Measuring and scaling keeps every scene whole on every screen without
 * a second, smaller version of each picture to maintain.
 */
function FitToStage({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      // 20px of breathing room on each side of the picture.
      const h = (o.clientHeight - 40) / i.offsetHeight;
      const w = (o.clientWidth - 40) / i.offsetWidth;
      setScale(Math.min(1, h, w));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className="relative size-full">
      {/* Absolutely centred, so the unscaled box can be taller than the stage
          without pushing the picture off-centre before the scale applies. */}
      <div
        ref={inner}
        className="absolute top-1/2 left-1/2 flex w-[340px] max-w-none justify-center"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
