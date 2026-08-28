"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { unitIcon, unitTone, TONE_CLASSES, isHighYield } from "@/lib/content/unit-visuals";
import type { Unit } from "@/lib/types";

/**
 * The visual "map" of a subject's syllabus: a grade toggle plus a grid of
 * unit cards, each colour- and icon-coded by topic with its period weight
 * shown as a bar. Client-side because the grade filter and hover motion need
 * no round trip — the data itself is fetched once, server-side, by the page.
 */
export function UnitExplorer({ subjectId, units }: { subjectId: string; units: Unit[] }) {
  const grades = useMemo(
    () => Array.from(new Set(units.map((u) => u.gradeYear))).sort((a, b) => a - b),
    [units],
  );
  const [filter, setFilter] = useState<"all" | 12 | 13>("all");
  const maxPeriods = useMemo(() => Math.max(...units.map((u) => u.periods)), [units]);

  const visible = filter === "all" ? units : units.filter((u) => u.gradeYear === filter);

  return (
    <div>
      {grades.length > 1 ? (
        <div className="inline-flex gap-1 rounded-full border border-(--color-awaken-line) bg-(--color-awaken-card) p-1">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
            Both years
          </FilterTab>
          {grades.map((g) => (
            <FilterTab key={g} active={filter === g} onClick={() => setFilter(g)}>
              Grade {g}
            </FilterTab>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((unit) => {
          const tone = TONE_CLASSES[unitTone(unit.competencyNumber)];
          const barWidth = Math.max(8, Math.round((unit.periods / maxPeriods) * 100));
          return (
            <Link
              key={unit.id}
              href={`/syllabus/${subjectId}/${unit.id}`}
              className={`group relative overflow-hidden rounded-2xl border ${tone.border} bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)]`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 ${tone.bg} opacity-80 transition-opacity group-hover:opacity-100`}
                aria-hidden
              />

              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone.bg} ${tone.fg} transition-transform duration-200 group-hover:scale-110`}
                >
                  <Icon name={unitIcon(unit.competencyNumber)} className="!text-2xl" />
                </span>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-semibold text-(--color-awaken-ink-soft)">
                    Grade {unit.gradeYear}
                  </span>
                  {isHighYield(unit.periods) ? (
                    <span className={`rounded-full ${tone.bg} ${tone.fg} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide`}>
                      High-yield
                    </span>
                  ) : null}
                </div>
              </div>

              <h3 className="mt-3 flex items-center gap-1.5 font-bold leading-snug">
                <span className={`${tone.fg} text-xs font-extrabold`}>{unit.competencyNumber}.</span>
                {unit.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-xs text-(--color-awaken-ink-soft)">
                {unit.competencyStatement}
              </p>

              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-awaken-bg)">
                  <div className={`h-full rounded-full ${tone.bg.replace("-soft", "")}`} style={{ width: `${barWidth}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-(--color-awaken-ink-soft)">
                  <span>{unit.periods} periods</span>
                  <span>
                    {unit.lessons.length} lesson{unit.lessons.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-(--color-awaken-ink-soft) transition-colors group-hover:text-(--color-awaken-accent)">
                Explore lessons
                <Icon name="chevron_right" className="!text-sm transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) text-white"
          : "text-(--color-awaken-ink-soft) hover:text-(--color-awaken-ink)"
      }`}
    >
      {children}
    </button>
  );
}
