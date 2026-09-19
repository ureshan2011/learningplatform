"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { EmailCaptureForm } from "@/components/marketing/EmailCaptureForm";
import { isJoinableNow, type TopicClass } from "@/lib/content/topic-classes";
import { isHighYield, UNIT_TONE, unitIcon } from "@/lib/content/unit-visuals";
import { ClassCta, ClassStatus, LivePill } from "@/components/syllabus/ClassCta";
import { cssVars, useNow } from "@/components/syllabus/motion";
import type { Unit } from "@/lib/types";

/**
 * One stop on the syllabus roadmap: a unit, its weight in the exam, and the
 * classes that teach it.
 *
 * Collapsed it is a summary card. Expanded it lists every competency level
 * with its own "join this class" button — which is the point of the page: a
 * student who only cares about databases should be able to get into the
 * database class without reading the other thirteen units.
 */
export function UnitStation({
  unit,
  index,
  weight,
  subjectId,
  unitClasses,
  classesByLesson,
  open,
  onToggle,
  matchedLessonIds,
}: {
  unit: Unit;
  index: number;
  /** This unit's periods as a share of the heaviest unit, 0-1. Drives the weight bar. */
  weight: number;
  subjectId: string;
  unitClasses: TopicClass[];
  classesByLesson: Record<string, TopicClass[]>;
  open: boolean;
  onToggle: () => void;
  matchedLessonIds: string[];
}) {
  const tone = UNIT_TONE;
  const now = useNow();

  const liveClass = now === null ? undefined : unitClasses.find((c) => isJoinableNow(c, now));
  const nextClass = unitClasses[0];
  // A class pinned to one competency level only speaks for that level. A class
  // tagged with the unit alone covers every lesson in it, so it is the right
  // fallback for rows that have nothing of their own.
  const unitWideClass = unitClasses.find((c) => !c.lessonId);
  const highlighted = new Set(matchedLessonIds);
  const panelId = `unit-panel-${unit.id}`;

  return (
    <li
      id={`unit-${unit.id}`}
      data-station={index}
      // The offset clears the sticky control bar, which is taller once its
      // filters wrap onto their own rows on a phone.
      className="syl-reveal relative scroll-mt-44 pl-11 sm:scroll-mt-28 sm:pl-16"
      style={cssVars({
        "--reveal-delay": `${Math.min(index, 5) * 70}ms`,
        "--weight-target": weight.toFixed(3),
      })}
    >
      {/* The rail node. Sits on the vertical line drawn by the explorer. */}
      <span
        className="absolute top-5 left-0 z-10 flex size-9 items-center justify-center rounded-ict-md text-sm font-extrabold text-white sm:top-6 sm:size-12 sm:text-base"
        style={{ background: tone.accent }}
      >
        {unit.competencyNumber}
      </span>

      <article
        className={`group relative mb-5 overflow-hidden rounded-ict-panel border bg-ict-surface-card shadow-(--shadow-ict-card) ${open ? "" : "ict-lift"}`}
        style={{ borderColor: open ? tone.line : "var(--color-ict-line)" }}
      >

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="relative flex w-full items-start gap-3 p-4 text-left sm:gap-4 sm:p-6"
        >
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-ict-md text-white sm:size-12"
            style={{ background: tone.accent }}
          >
            <Icon name={unitIcon(unit.competencyNumber)} className="!text-2xl" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5">
              <Chip tone={tone}>Grade {unit.gradeYear}</Chip>
              <Chip tone={tone}>{unit.periods} periods</Chip>
              {isHighYield(unit.periods) ? (
                <span className="rounded-full bg-ict-surface-sunken px-2.5 py-0.5 text-xs font-bold tracking-[0.02em] text-ict-fg uppercase">
                  High-yield
                </span>
              ) : null}
              {liveClass ? <LivePill /> : null}
            </span>

            <span className="mt-2 block text-lg leading-snug font-extrabold tracking-tight text-ict-fg">
              {unit.title}
            </span>
            <span
              className={`mt-1 block text-sm text-ict-fg-mute ${open ? "" : "line-clamp-2"}`}
            >
              {unit.competencyStatement}
            </span>

            {/* Period weight, drawn as a share of the heaviest unit on the page. */}
            <span className="mt-4 block">
              <span className="block h-1.5 w-full overflow-hidden rounded-full bg-ict-surface-sunken">
                <span
                  className="block h-full origin-left rounded-full transition-transform duration-[340ms] ease-ict-out"
                  style={{
                    background: tone.accent,
                    // Scaling a full-width bar keeps this on the compositor;
                    // animating `width` would reflow on every frame.
                    transform: `scaleX(var(--weight, 0.1))`,
                  }}
                />
              </span>
              <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ict-fg-mute">
                <span className="inline-flex items-center gap-1">
                  <Icon name="description" className="!text-sm" />
                  {unit.lessons.length} lesson{unit.lessons.length === 1 ? "" : "s"}
                </span>
                {nextClass ? (
                  <span className="inline-flex items-center gap-1 text-ict-accent-fg">
                    <Icon name="live_tv" className="!text-sm" />
                    <ClassStatus topicClass={nextClass} />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="schedule" className="!text-sm" />
                    No class scheduled yet
                  </span>
                )}
              </span>
            </span>
          </span>

          <span className="flex shrink-0 flex-col items-end gap-3">
            <Icon
              name="expand_more"
              className={`!text-2xl text-ict-fg-mute transition-transform duration-[200ms] ease-ict ${open ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {/* grid-rows 0fr → 1fr animates a height the browser has not measured
            yet, which is the one way to get a smooth open on variable content. */}
        <div
          id={panelId}
          className={`grid transition-[grid-template-rows] duration-[340ms] ease-ict-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            <div className="border-t px-4 pt-5 pb-6 sm:px-6" style={{ borderColor: tone.line }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold tracking-wide text-ict-fg-mute uppercase">
                  Join the class for any topic below
                </p>
                <Link
                  href={`/syllabus/${subjectId}/${unit.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                  style={{ color: tone.ink }}
                >
                  Full unit page, with exam focus
                  <Icon name="chevron_right" className="!text-sm" />
                </Link>
              </div>

              <ul className="mt-3 space-y-2">
                {unit.lessons.map((lesson) => {
                  const lessonClass = classesByLesson[lesson.id]?.[0] ?? unitWideClass;
                  const isMatch = highlighted.has(lesson.id);
                  return (
                    <li
                      key={lesson.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-ict-card border p-3 transition-colors duration-[120ms] ease-ict"
                      style={{
                        borderColor: isMatch ? tone.line : "var(--color-ict-line)",
                        background: isMatch ? tone.soft : undefined,
                      }}
                    >
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-ict-md text-xs font-extrabold"
                        style={{ background: tone.soft, color: tone.ink }}
                      >
                        {lesson.id}
                      </span>
                      {/* The floor on this column is what pushes the button
                          onto its own line on a narrow phone instead of
                          crushing the lesson title into a column of one word. */}
                      <span className="min-w-[10rem] flex-1">
                        <span className="block leading-snug font-semibold">{lesson.title}</span>
                        <span className="mt-0.5 block text-xs text-ict-fg-mute">
                          {lesson.periods} periods · {lesson.examObjectives.length} exam objectives
                        </span>
                      </span>
                      <span className="ml-auto">
                        <ClassCta
                          subjectId={subjectId}
                          topicClass={lessonClass}
                          tone={tone}
                          size="sm"
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>

              {unitClasses.length > 0 ? (
                <div
                  className="mt-4 rounded-ict-card p-4"
                  style={{ background: tone.soft }}
                >
                  <p
                    className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase"
                    style={{ color: tone.ink }}
                  >
                    <Icon name="event" className="!text-sm" />
                    Scheduled for this unit
                  </p>
                  <ul className="mt-2 space-y-2">
                    {unitClasses.slice(0, 3).map((topicClass) => (
                      <li
                        key={topicClass.id}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {topicClass.title}
                          </span>
                          <ClassStatus
                            topicClass={topicClass}
                            className="block text-xs text-ict-fg-mute"
                          />
                        </span>
                        <ClassCta
                          subjectId={subjectId}
                          topicClass={topicClass}
                          tone={tone}
                          size="sm"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-4 rounded-ict-card border border-dashed border-ict-line p-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-ict-fg">
                    <span style={{ color: tone.ink }}>
                      <Icon name="notifications_active" className="!text-base" />
                    </span>
                    Want this unit taught live?
                  </p>
                  <p className="mt-1 text-xs text-ict-fg-mute">
                    Leave your email and we&apos;ll tell you the moment a class on{" "}
                    {unit.title.toLowerCase()} is scheduled.
                  </p>
                  <EmailCaptureForm
                    source={`syllabus_${unit.id}`.slice(0, 64)}
                    buttonLabel="Notify me"
                    className="mt-3"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

function Chip({
  tone,
  children,
}: {
  tone: { soft: string; ink: string };
  children: React.ReactNode;
}) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-bold"
      style={{ background: tone.soft, color: tone.ink }}
    >
      {children}
    </span>
  );
}
