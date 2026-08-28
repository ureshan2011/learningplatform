"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { TopicClassIndex } from "@/lib/content/topic-classes";
import { UnitStation } from "@/components/syllabus/UnitStation";
import { UnitGridCard } from "@/components/syllabus/UnitGridCard";
import {
  prefersReducedMotion,
  useActiveStation,
  useRevealScope,
} from "@/components/syllabus/motion";
import type { Unit } from "@/lib/types";

type GradeFilter = "all" | 12 | 13;
type View = "path" | "grid";

interface Result {
  unit: Unit;
  /** Competency levels matching the current search, for highlighting. Empty when not searching. */
  matchedLessonIds: string[];
}

/**
 * Folds a string into something two people spelling the same word differently
 * will both hit.
 *
 * The NIE syllabus is written in American spelling ("Normalization") while Sri
 * Lankan students are taught British spelling, so a search for "normalisation"
 * has to find it. Folding `z` to `s` on both sides of the comparison covers
 * the whole -ise/-ize family at once, and there is no ICT term in this
 * syllabus where it creates a false match.
 */
function fold(text: string): string {
  return text.toLowerCase().replace(/z/g, "s");
}

/**
 * The interactive syllabus.
 *
 * Everything a student can do here — search, filter by year, switch between
 * the roadmap and the overview, open a unit — happens without a round trip:
 * the page hands this component all 14 units and the class timetable in one
 * server render. That is deliberate. Students on mobile data should be able to
 * browse the whole syllabus on the cost of a single page load.
 */
export function SyllabusExplorer({
  subjectId,
  units,
  classIndex,
}: {
  subjectId: string;
  units: Unit[];
  classIndex: TopicClassIndex;
}) {
  const scopeRef = useRef<HTMLDivElement | null>(null);
  const pendingScroll = useRef<string | null>(null);

  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState<GradeFilter>("all");
  const [view, setView] = useState<View>("path");
  const [classesOnly, setClassesOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const grades = useMemo(
    () => Array.from(new Set(units.map((u) => u.gradeYear))).sort((a, b) => a - b),
    [units],
  );
  const maxPeriods = useMemo(
    () => Math.max(1, ...units.map((u) => u.periods)),
    [units],
  );

  // Folded once per unit rather than once per keystroke. Searching the exam
  // objectives too is what makes this useful at exam time: students look for
  // "normalisation" or "truth table", not for unit titles.
  const searchIndex = useMemo(
    () =>
      units.map((unit) => ({
        unit,
        text: fold(`${unit.competencyNumber} ${unit.title} ${unit.competencyStatement}`),
        lessons: unit.lessons.map((lesson) => ({
          id: lesson.id,
          text: fold(
            `${lesson.id} ${lesson.title} ${lesson.examObjectives.join(" ")} ${lesson.importantAreas.join(" ")}`,
          ),
        })),
      })),
    [units],
  );

  const results = useMemo<Result[]>(() => {
    // Every word has to appear, in any order, so "table truth" finds the same
    // lesson as "truth table".
    const terms = fold(query).trim().split(/\s+/).filter(Boolean);

    return searchIndex.flatMap(({ unit, text, lessons }) => {
      if (grade !== "all" && unit.gradeYear !== grade) return [];
      if (classesOnly && !classIndex.byUnit[unit.id]?.length) return [];
      if (terms.length === 0) return [{ unit, matchedLessonIds: [] }];

      const unitHit = terms.every((term) => text.includes(term));
      const matchedLessonIds = lessons
        .filter((lesson) => terms.every((term) => lesson.text.includes(term)))
        .map((lesson) => lesson.id);

      if (!unitHit && matchedLessonIds.length === 0) return [];
      return [{ unit, matchedLessonIds }];
    });
  }, [searchIndex, grade, classesOnly, query, classIndex]);

  const lessonMatchCount = results.reduce((n, r) => n + r.matchedLessonIds.length, 0);
  const searching = query.trim().length > 0;

  // Re-scan for reveal targets whenever the rendered set changes — filtering
  // or switching view mounts cards the observer has never seen.
  useRevealScope(scopeRef, `${view}:${results.map((r) => r.unit.id).join(",")}`);
  const activeIndex = useActiveStation(scopeRef, view === "path" ? results.length : 0);
  const railFill =
    results.length > 0 ? Math.min(1, (activeIndex + 1) / results.length) : 0;

  // Choosing a unit in the overview drops back into the roadmap at that unit.
  // The scroll target is a ref, not state, so landing there costs no render.
  useEffect(() => {
    const id = pendingScroll.current;
    if (!id || view !== "path") return;
    pendingScroll.current = null;
    const frame = requestAnimationFrame(() => {
      document.getElementById(`unit-${id}`)?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [view, openId]);

  function openInRoadmap(unitId: string) {
    pendingScroll.current = unitId;
    setOpenId(unitId);
    setView("path");
  }

  return (
    <div ref={scopeRef}>
      <div className="sticky top-0 z-30 -mx-5 border-y border-(--color-awaken-line) bg-(--color-awaken-bg)/85 px-5 py-3 backdrop-blur-xl md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {/* Order is swapped on a phone so the search box and the view toggle
              share the first row — the filter bar is sticky, and three stacked
              rows of it would eat a quarter of a small screen. */}
          <label className="relative order-1 min-w-[9rem] flex-1 sm:min-w-[13rem]">
            <span className="sr-only">Search the syllabus</span>
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 !text-lg -translate-y-1/2 text-(--color-awaken-ink-soft)"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a topic — databases, HTML, truth tables…"
              className="w-full rounded-full border border-(--color-awaken-line) bg-(--color-awaken-card) py-2 pr-10 pl-10 text-sm outline-none transition-colors focus:border-(--color-awaken-accent) sm:py-2.5"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-(--color-awaken-ink-soft) hover:bg-(--color-awaken-bg)"
              >
                <span className="sr-only">Clear search</span>
                <Icon name="close" className="!text-base" />
              </button>
            ) : null}
          </label>

          <Segmented
            className="order-2 sm:order-4"
            options={[
              { value: "path" as const, label: "Roadmap", icon: "route" as const },
              { value: "grid" as const, label: "Overview", icon: "grid_view" as const },
            ]}
            value={view}
            onChange={setView}
          />

          {grades.length > 1 ? (
            <Segmented
              className="order-3 sm:order-2"
              options={[
                {
                  value: "all" as const,
                  label: (
                    <>
                      <span className="sm:hidden">All</span>
                      <span className="hidden sm:inline">Both years</span>
                    </>
                  ),
                },
                ...grades.map((g) => ({ value: g as GradeFilter, label: `Grade ${g}` })),
              ]}
              value={grade}
              onChange={setGrade}
            />
          ) : null}

          <button
            type="button"
            onClick={() => setClassesOnly((on) => !on)}
            aria-pressed={classesOnly}
            className={`order-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors sm:order-3 sm:px-3.5 sm:py-2 sm:text-sm ${
              classesOnly
                ? "border-transparent bg-(--color-awaken-danger) text-white"
                : "border-(--color-awaken-line) bg-(--color-awaken-card) text-(--color-awaken-ink-soft) hover:text-(--color-awaken-ink)"
            }`}
          >
            <Icon name="live_tv" className="!text-base" />
            Has a class
          </button>
        </div>

        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--color-awaken-ink-soft)">
          <span>
            <strong className="font-bold text-(--color-awaken-ink)">{results.length}</strong>{" "}
            unit{results.length === 1 ? "" : "s"}
            {searching ? (
              <>
                {" "}
                · <strong className="font-bold text-(--color-awaken-ink)">{lessonMatchCount}</strong>{" "}
                matching lesson{lessonMatchCount === 1 ? "" : "s"}
              </>
            ) : null}
          </span>
          {view === "path" && results.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="route" className="!text-sm" />
              Unit {Math.min(activeIndex + 1, results.length)} of {results.length}
            </span>
          ) : null}
          {classIndex.total > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-(--color-awaken-accent)">
              <Icon name="videocam" className="!text-sm" />
              {classIndex.total} class{classIndex.total === 1 ? "" : "es"} scheduled
            </span>
          ) : null}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-(--color-awaken-line) p-10 text-center">
          <Icon name="search" className="!text-4xl text-(--color-awaken-ink-soft)" />
          <p className="mt-2 font-semibold">Nothing matches that yet.</p>
          <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
            Try a shorter word, or clear the filters to see all {units.length} units.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setGrade("all");
              setClassesOnly(false);
            }}
            className="mt-4 rounded-full bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 text-sm font-semibold text-white"
          >
            Reset filters
          </button>
        </div>
      ) : view === "grid" ? (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(({ unit }, i) => (
            <UnitGridCard
              key={unit.id}
              unit={unit}
              index={i}
              weight={unit.periods / maxPeriods}
              unitClasses={classIndex.byUnit[unit.id] ?? []}
              onOpen={() => openInRoadmap(unit.id)}
            />
          ))}
        </ul>
      ) : (
        <div className="relative mt-8">
          {/* The roadmap rail. Fills as you travel down the syllabus. */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-4 bottom-10 left-[17px] w-[2px] overflow-hidden rounded-full bg-(--color-awaken-line) sm:left-[23px]"
          >
            <div
              className="absolute inset-0 origin-top rounded-full bg-gradient-to-b from-(--color-awaken-accent) to-(--color-awaken-rose) transition-transform duration-700 ease-out"
              style={{ transform: `scaleY(${railFill.toFixed(3)})` }}
            />
            <div className="syl-rail-spark absolute inset-x-0 h-12 rounded-full bg-gradient-to-b from-transparent via-white/90 to-transparent" />
          </div>

          <ol className="relative">
            {results.map(({ unit, matchedLessonIds }, i) => (
              <UnitStation
                key={unit.id}
                unit={unit}
                index={i}
                weight={unit.periods / maxPeriods}
                subjectId={subjectId}
                unitClasses={classIndex.byUnit[unit.id] ?? []}
                classesByLesson={classIndex.byLesson}
                // While searching, matched units open themselves — hiding the
                // thing someone just searched for behind another click is the
                // fastest way to make a search feel broken.
                open={openId === unit.id || matchedLessonIds.length > 0}
                onToggle={() => setOpenId((id) => (id === unit.id ? null : unit.id))}
                matchedLessonIds={matchedLessonIds}
              />
            ))}
          </ol>

          <p className="relative flex items-center gap-3 pl-11 text-sm font-semibold text-(--color-awaken-ink-soft) sm:pl-16">
            <span className="absolute left-0 flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-(--color-awaken-accent) to-(--color-awaken-rose) text-white sm:size-12">
              <Icon name="flag" className="!text-xl" />
            </span>
            That&apos;s the whole syllabus — {units.length} units, exam-ready.
          </p>
        </div>
      )}
    </div>
  );
}

/** Pill group with a sliding-free, instantly readable active state. */
function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{
    value: T;
    label: React.ReactNode;
    icon?: React.ComponentProps<typeof Icon>["name"];
  }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex gap-1 rounded-full border border-(--color-awaken-line) bg-(--color-awaken-card) p-1 ${className ?? ""}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 sm:px-3.5 sm:text-sm ${
              active
                ? "scale-[1.02] bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) text-white shadow-[0_4px_12px_rgba(234,88,12,0.28)]"
                : "text-(--color-awaken-ink-soft) hover:text-(--color-awaken-ink)"
            }`}
          >
            {/* The wrapper does the hiding: `.material-symbols-outlined` in
                globals.css is unlayered, so its `display` beats Tailwind's
                `hidden` utility and an icon cannot hide itself. */}
            {option.icon ? (
              <span className="hidden sm:inline-block">
                <Icon name={option.icon} className="!text-base" />
              </span>
            ) : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
