"use client";

import { useMemo, useState } from "react";
import { CAMPUS_READY, CAMPUS_READY_WEEKS, type CampusStrand } from "@/lib/content/campus-ready";
import {
  ArrowRightIcon,
  BoltIcon,
  CertificateIcon,
  ChecklistIcon,
  ClockIcon,
  LayersIcon,
} from "@/components/marketing/landing/icons";

type Filter = "all" | CampusStrand;

const FILTERS: Array<{ id: Filter; label: string; hint: string }> = [
  { id: "all", label: "All 12 weeks", hint: "The whole programme, start to finish" },
  {
    id: "foundations",
    label: "Weeks 1–4",
    hint: "What first year expects of you in the first month",
  },
  { id: "analysis", label: "Weeks 5–12", hint: "The half that goes on a CV" },
];

/**
 * The interactive syllabus for Campus Ready — the page's main selling argument,
 * the same role `SyllabusShowcase` plays on the A/L home page.
 *
 * A twelve-week course is a hard thing to sell as a list, because the list is
 * either too long to read or too short to be convincing. So the weeks are a rail
 * you scan and a panel you read: pick a week, see exactly what happens in it and
 * which tools it puts in your hands. A student can find "Power BI" in four
 * seconds without reading a syllabus, which is what they are actually doing.
 *
 * The strand filter carries the product's whole argument in three buttons. Weeks
 * 1–4 are the must-have half — the things a first-year is expected to already be
 * able to do — and weeks 5–12 are the payoff. Splitting them lets someone who
 * came for "help me survive first year" and someone who came for "make me
 * employable" each find their half immediately.
 *
 * Selection is local state on numbers only; no fetching, no layout thrash. Every
 * week is a real `<button>`, so the rail is keyboard and screen-reader navigable
 * rather than a grid of clickable divs.
 */
export function CurriculumShowcase() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState(1);

  const weeks = useMemo(
    () => (filter === "all" ? CAMPUS_READY_WEEKS : CAMPUS_READY_WEEKS.filter((w) => w.strand === filter)),
    [filter],
  );

  // Selecting a filter that excludes the open week would otherwise leave the
  // panel describing something the rail no longer shows.
  const active = weeks.find((w) => w.week === selected) ?? weeks[0];

  const toolCount = useMemo(
    () => new Set(CAMPUS_READY_WEEKS.flatMap((w) => w.tools)).size,
    [],
  );

  return (
    <section id="syllabus" className="w-full py-[clamp(32px,6vw,72px)]">
      <div className="mx-auto w-full max-w-[1180px] px-[clamp(20px,4vw,32px)]">
        <div className="lp-reveal">
          <div className="text-[13px] font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">
            The programme
          </div>
          <div className="my-2.5 mb-[clamp(24px,3vw,34px)] flex flex-wrap items-start gap-[clamp(20px,4vw,40px)]">
            <h2 className="m-0 max-w-[16ch] text-[clamp(30px,4.6vw,48px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]">
              Twelve weeks, and you can see every one
              <span className="text-(--lp-orange-500)">.</span>
            </h2>
            <p className="mt-1.5 ml-auto max-w-[320px] text-sm text-(--lp-ink-500) text-wrap-pretty">
              Nothing here is a surprise after you pay. Tap any week to see what happens in it and
              which tools you walk away using.
            </p>
          </div>
        </div>

        {/* Summary strip. The 210px minimum is wider than the 150px the home
            page's stats bar uses, because these labels are full phrases rather
            than one word: at 150px a 390px phone gets two columns and wraps
            "4 milestones" onto three lines. */}
        <div
          className="lp-reveal mb-5 grid gap-3 rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-[clamp(16px,2.4vw,22px)]"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}
        >
          {[
            { icon: ClockIcon, value: `${CAMPUS_READY.weeks} weeks`, label: "one live class a week" },
            { icon: LayersIcon, value: `${toolCount} tools`, label: "Python, Power BI, Excel, Zotero" },
            { icon: ChecklistIcon, value: "4 milestones", label: "marked, not just watched" },
            { icon: CertificateIcon, value: "1 capstone", label: "on real Sri Lankan data" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-(--lp-orange-50) text-(--lp-orange-500)">
                <s.icon className="size-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block font-[family-name:var(--lp-font-display)] text-base leading-tight font-extrabold tracking-[-0.02em] text-(--lp-ink-900)">
                  {s.value}
                </span>
                <span className="block text-xs text-(--lp-ink-400)">{s.label}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Strand filter — the product's argument in three buttons. */}
        <div className="lp-reveal mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={on}
                title={f.hint}
                className={
                  on
                    ? "rounded-full bg-(--lp-ink-900) px-4 py-2 text-xs font-semibold text-(--lp-paper-50)"
                    : "rounded-full border border-(--lp-border-subtle) bg-(--lp-paper-0) px-4 py-2 text-xs font-semibold text-(--lp-ink-500) hover:border-(--lp-orange-500) hover:text-(--lp-ink-900)"
                }
              >
                {f.label}
              </button>
            );
          })}
          <span className="self-center pl-1 text-xs text-(--lp-ink-400)">
            {FILTERS.find((f) => f.id === filter)?.hint}
          </span>
        </div>

        {/*
          Two layouts, because the right one differs by device.

          On a phone the rail is a horizontal swipe strip with the panel
          directly under it, so the detail you just tapped is always the next
          thing on screen. A vertical list of twelve weeks would push the panel
          a screen and a half below whatever you touched.

          On a desktop the rail is a vertical list and the panel is sticky
          beside it — otherwise picking week 10 leaves its description scrolled
          off the top, and the panel stretches to the rail's height, which is
          how you get a dead black column.
        */}
        <div className="lp-reveal grid gap-[clamp(14px,2vw,20px)] lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          {/* The rail */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:mx-0 lg:grid lg:content-start lg:overflow-visible lg:px-0 lg:pb-0">
            {weeks.map((w) => {
              const on = active?.week === w.week;
              return (
                <button
                  key={w.week}
                  type="button"
                  onClick={() => setSelected(w.week)}
                  aria-pressed={on}
                  className={
                    "flex w-[240px] shrink-0 items-center gap-3 rounded-[var(--lp-radius-md)] border p-3 text-left transition-colors duration-[120ms] lg:w-auto lg:shrink " +
                    (on
                      ? "border-(--lp-orange-500) bg-(--lp-orange-50)"
                      : "border-(--lp-border-subtle) bg-(--lp-paper-0) hover:border-(--lp-ink-200)")
                  }
                >
                  <span
                    className={
                      "grid size-9 shrink-0 place-items-center rounded-full font-[family-name:var(--lp-font-display)] text-sm font-extrabold " +
                      (on
                        ? "bg-(--lp-orange-500) text-white"
                        : "bg-(--lp-paper-100) text-(--lp-ink-400)")
                    }
                  >
                    {w.week}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-(--lp-ink-900)">
                      {w.title}
                    </span>
                    <span className="block truncate text-xs text-(--lp-ink-400)">
                      {w.tools.join(" · ")}
                    </span>
                  </span>
                  {on ? (
                    <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-(--lp-orange-500) text-white">
                      <ArrowRightIcon className="size-3" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* The detail panel. Dark, so it reads as the one thing being looked
              at rather than the thirteenth card in a list. */}
          {active ? (
            <div className="relative overflow-hidden rounded-[var(--lp-radius-panel)] bg-(--lp-ink-900) p-[clamp(22px,3.4vw,34px)] lg:sticky lg:top-[88px] lg:self-start">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-[30%] -right-[10%] size-[420px] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(244,85,30,0.18), rgba(244,85,30,0) 70%)",
                }}
              />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-(--lp-orange-500) px-3 py-1 text-xs font-bold text-white">
                    Week {active.week}
                  </span>
                  <span className="rounded-full border border-(--lp-border-dark) px-3 py-1 text-xs font-semibold text-(--lp-ink-300)">
                    {active.strand === "foundations" ? "First-year survival" : "The employable half"}
                  </span>
                </div>

                <h3 className="mt-4 text-[clamp(22px,3vw,30px)] leading-[1.1] font-extrabold tracking-[-0.02em] text-(--lp-paper-50) font-[family-name:var(--lp-font-display)]">
                  {active.title}
                </h3>
                <p className="mt-3 max-w-[46ch] text-sm text-(--lp-ink-300) text-wrap-pretty">
                  {active.summary}
                </p>

                <div className="mt-6 text-xs font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">
                  Tools you use
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {active.tools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full border border-(--lp-border-dark) bg-(--lp-ink-800) px-3 py-1.5 text-xs font-semibold text-(--lp-paper-50)"
                    >
                      {tool}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-[var(--lp-radius-md)] border border-(--lp-border-dark) bg-(--lp-ink-800) p-4">
                  <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-(--lp-orange-500) text-white">
                    <BoltIcon className="size-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-(--lp-ink-300)">You hand in</span>
                    <span className="block text-sm font-semibold text-(--lp-paper-50)">
                      {active.deliverable}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
