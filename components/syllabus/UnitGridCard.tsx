"use client";

import { Icon } from "@/components/ui/Icon";
import { isJoinableNow, type TopicClass } from "@/lib/content/topic-classes";
import { isHighYield, UNIT_TONE, unitIcon } from "@/lib/content/unit-visuals";
import { ClassStatus, LivePill } from "@/components/syllabus/ClassCta";
import { cssVars, useNow } from "@/components/syllabus/motion";
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
  const tone = UNIT_TONE;
  const now = useNow();

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
        className="ict-lift group relative flex h-full w-full flex-col overflow-hidden rounded-ict-panel border border-ict-line bg-ict-surface-card p-5 text-left shadow-(--shadow-ict-card) hover:border-ict-line-strong"
      >

        <span className="relative flex items-start justify-between gap-3">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-ict-md text-white"
            style={{ background: tone.accent }}
          >
            <Icon name={unitIcon(unit.competencyNumber)} className="!text-2xl" />
          </span>
          <span className="flex flex-col items-end gap-1.5">
            <span className="text-xs font-bold text-ict-fg-mute">Grade {unit.gradeYear}</span>
            {live ? (
              <LivePill />
            ) : isHighYield(unit.periods) ? (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold tracking-[0.02em] uppercase"
                style={{ background: tone.soft, color: tone.ink }}
              >
                High-yield
              </span>
            ) : null}
          </span>
        </span>

        <span className="relative mt-3 block leading-snug font-extrabold">
          <span className="font-mono text-xs font-bold text-ict-fg-mute">
            {unit.competencyNumber}.{" "}
          </span>
          {unit.title}
        </span>
        <span className="relative mt-1.5 line-clamp-2 block text-xs text-ict-fg-mute">
          {unit.competencyStatement}
        </span>

        <span className="relative mt-auto block pt-4">
          <span className="block h-1.5 w-full overflow-hidden rounded-full bg-ict-surface-sunken">
            <span
              className="block h-full origin-left rounded-full transition-transform duration-[340ms] ease-ict-out"
              style={{
                background: tone.accent,
                transform: "scaleX(var(--weight, 0.04))",
              }}
            />
          </span>
          <span className="mt-2 flex items-center justify-between text-xs text-ict-fg-mute">
            <span>{unit.periods} periods</span>
            <span>
              {unit.lessons.length} lesson{unit.lessons.length === 1 ? "" : "s"}
            </span>
          </span>
        </span>

        <span
          className="relative mt-3 flex items-center gap-1.5 rounded-ict-md px-3 py-2 text-xs font-bold"
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
            className="!text-sm ml-auto transition-transform duration-[200ms] ease-ict group-hover:translate-x-1"
          />
        </span>
      </button>
    </li>
  );
}
