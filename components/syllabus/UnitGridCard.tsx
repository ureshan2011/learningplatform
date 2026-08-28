"use client";

import { Icon } from "@/components/ui/Icon";
import { isJoinableNow, type TopicClass } from "@/lib/content/topic-classes";
import { isHighYield, unitColors, unitIcon } from "@/lib/content/unit-visuals";
import { ClassStatus, LivePill } from "@/components/syllabus/ClassCta";
import { cssVars, useNow, useTilt } from "@/components/syllabus/motion";
import type { Unit } from "@/lib/types";

/**
 * The compact view: all fourteen units on one screen, so a student can see the
 * shape of the whole subject before diving in.
 *
 * Selecting a card does not navigate — it drops back into the roadmap at that
 * unit, already open. Keeping both views on one page means the filters, the
 * search and the class data never have to be fetched or reasoned about twice.
 */
export function UnitGridCard({
  unit,
  index,
  weight,
  unitClasses,
  onOpen,
}: {
  unit: Unit;
  index: number;
  weight: number;
  unitClasses: TopicClass[];
  onOpen: () => void;
}) {
  const tone = unitColors(unit.competencyNumber);
  const now = useNow();
  const tilt = useTilt(6);

  const live = now !== null && unitClasses.some((c) => isJoinableNow(c, now));
  const nextClass = unitClasses[0];

  return (
    <li
      className="syl-reveal"
      style={cssVars({
        "--reveal-delay": `${Math.min(index, 8) * 55}ms`,
        "--weight-target": weight.toFixed(3),
      })}
    >
      <button
        type="button"
        onClick={onOpen}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        className="syl-tilt group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-shadow duration-300 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.28)]"
      >
        <span aria-hidden className="syl-sheen pointer-events-none absolute inset-0" />
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ backgroundImage: `linear-gradient(90deg, ${tone.gradFrom}, ${tone.gradTo})` }}
        />

        <span className="relative flex items-start justify-between gap-3">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{ backgroundImage: `linear-gradient(140deg, ${tone.gradFrom}, ${tone.gradTo})` }}
          >
            <Icon name={unitIcon(unit.competencyNumber)} className="!text-2xl" />
          </span>
          <span className="flex flex-col items-end gap-1.5">
            <span className="text-[11px] font-bold text-(--color-awaken-ink-soft)">
              Grade {unit.gradeYear}
            </span>
            {live ? (
              <LivePill />
            ) : isHighYield(unit.periods) ? (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase"
                style={{ background: tone.soft, color: tone.ink }}
              >
                High-yield
              </span>
            ) : null}
          </span>
        </span>

        <span className="relative mt-3 block leading-snug font-extrabold">
          <span className="text-xs font-extrabold" style={{ color: tone.ink }}>
            {unit.competencyNumber}.{" "}
          </span>
          {unit.title}
        </span>
        <span className="relative mt-1.5 line-clamp-2 block text-xs text-(--color-awaken-ink-soft)">
          {unit.competencyStatement}
        </span>

        <span className="relative mt-auto block pt-4">
          <span className="block h-1.5 w-full overflow-hidden rounded-full bg-(--color-awaken-bg)">
            <span
              className="block h-full origin-left rounded-full transition-transform duration-[900ms] ease-out"
              style={{
                backgroundImage: `linear-gradient(90deg, ${tone.gradFrom}, ${tone.gradTo})`,
                transform: "scaleX(var(--weight, 0.04))",
              }}
            />
          </span>
          <span className="mt-2 flex items-center justify-between text-xs text-(--color-awaken-ink-soft)">
            <span>{unit.periods} periods</span>
            <span>
              {unit.lessons.length} lesson{unit.lessons.length === 1 ? "" : "s"}
            </span>
          </span>
        </span>

        <span
          className="relative mt-3 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
          style={{ background: tone.soft, color: tone.ink }}
        >
          <Icon name={nextClass ? "live_tv" : "videocam"} className="!text-sm" />
          {nextClass ? (
            <ClassStatus topicClass={nextClass} className="truncate" />
          ) : (
            "Join this class"
          )}
          <Icon
            name="arrow_forward"
            className="!text-sm ml-auto transition-transform duration-200 group-hover:translate-x-1"
          />
        </span>
      </button>
    </li>
  );
}
