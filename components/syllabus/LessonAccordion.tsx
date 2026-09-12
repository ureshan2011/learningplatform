"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { TopicClass } from "@/lib/content/topic-classes";
import type { ToneColors } from "@/lib/content/unit-visuals";
import { ClassCta } from "@/components/syllabus/ClassCta";
import { DataLifeCycleWalkthrough } from "@/components/syllabus/DataLifeCycleWalkthrough";
import { FetchExecuteCycle } from "@/components/syllabus/FetchExecuteCycle";
import { KarnaughMapLab } from "@/components/syllabus/KarnaughMapLab";
import { NormalizationWalkthrough } from "@/components/syllabus/NormalizationWalkthrough";
import { ProcessSchedulingLab } from "@/components/syllabus/ProcessSchedulingLab";
import type { Lesson } from "@/lib/types";

/**
 * One lesson's interactive, keyed by competency-level id.
 *
 * Deliberately a lookup rather than a field on the lesson: an interactive is
 * code, and `AL_ICT_UNITS` is data describing the syllabus. Keying by id also
 * means a lesson without one simply renders without one, so this can be filled
 * in a lesson at a time rather than all at once.
 *
 * Which lessons get one is decided by where the marks are and where a static
 * page genuinely fails — a cycle whose register contents change step by step,
 * a grouping students consistently get wrong, a table that has to be seen at
 * every stage, a calculation with no way to check the answer.
 */
const LESSON_INTERACTIVES: Partial<Record<string, (tone: ToneColors) => React.ReactNode>> = {
  "1.1": (tone) => <DataLifeCycleWalkthrough tone={tone} />,
  "2.3": (tone) => <FetchExecuteCycle tone={tone} />,
  "4.2": (tone) => <KarnaughMapLab tone={tone} />,
  "5.3": (tone) => <ProcessSchedulingLab tone={tone} />,
  "8.7": (tone) => <NormalizationWalkthrough tone={tone} />,
};

/**
 * Turns a lesson's plain-text notes into paragraphs, bullet lists and
 * subheadings — no markdown library for what is, so far, one hand-written
 * field: a blank line starts a new block, a block of "- " lines becomes a
 * list, and a block starting "## " becomes a subheading.
 */
function LessonContent({ content }: { content: string }) {
  const blocks = content.trim().split(/\n\s*\n/);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-ict-ink-500">
      {blocks.map((block, i) => {
        const lines = block
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length > 0 && lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="space-y-1.5">
              {lines.map((l, j) => (
                <li key={j} className="flex items-start gap-2">
                  <Icon name="chevron_right" className="mt-0.5 !text-sm shrink-0 text-ict-ink-300" />
                  <span>{l.slice(2)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (lines[0]?.startsWith("## ")) {
          const [heading, ...rest] = lines;
          return (
            <div key={i}>
              <h3 className="m-0 font-display text-sm font-bold text-ict-ink-900">{heading.slice(3)}</h3>
              {rest.length ? <p className="mt-1">{rest.join(" ")}</p> : null}
            </div>
          );
        }
        return <p key={i}>{lines.join(" ")}</p>;
      })}
    </div>
  );
}

/**
 * Lessons collapsed by default, each expanding in place to reveal exam
 * objectives and exam-focus notes — "go deeper" without leaving the unit page
 * or triggering a request, since all the data is already on the client.
 *
 * Each lesson also carries its own way into the live class that covers it, so
 * a student who came here for one competency never has to go back out to a
 * subject-wide timetable to find it.
 */
export function LessonAccordion({
  lessons,
  tone,
  subjectId,
  classesByLesson,
  unitClasses,
}: {
  lessons: Lesson[];
  tone: ToneColors;
  subjectId: string;
  classesByLesson: Record<string, TopicClass[]>;
  unitClasses: TopicClass[];
}) {
  const [open, setOpen] = useState<Set<string>>(new Set([lessons[0]?.id]));
  const allOpen = open.size === lessons.length;
  // Only a class tagged with the whole unit stands in for a lesson that has no
  // class of its own — one pinned to another competency level does not.
  const unitWideClass = unitClasses.find((c) => !c.lessonId);

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(lessons.map((l) => l.id)))}
          className="ict-press flex items-center gap-1.5 rounded-full border border-ict-paper-300 px-3.5 py-1.5 text-xs font-semibold text-ict-ink-400 transition-colors duration-[120ms] ease-ict hover:text-ict-ink-900"
        >
          <Icon name={allOpen ? "unfold_less" : "unfold_more"} className="!text-base" />
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* Quick-jump rail: every competency-level number, scrolling straight to its card. */}
      <nav className="mt-3 flex flex-wrap gap-1.5" aria-label="Jump to lesson">
        {lessons.map((l) => (
          <a
            key={l.id}
            href={`#lesson-${l.id}`}
            className="rounded-lg px-2 py-1 text-xs font-bold transition-transform duration-200 hover:-translate-y-0.5"
            style={{ background: tone.soft, color: tone.ink }}
          >
            {l.id}
          </a>
        ))}
      </nav>

      <ol className="mt-4 space-y-3">
        {lessons.map((lesson) => {
          const isOpen = open.has(lesson.id);
          const lessonClass = classesByLesson[lesson.id]?.[0] ?? unitWideClass;
          return (
            <li
              key={lesson.id}
              id={`lesson-${lesson.id}`}
              className="scroll-mt-24 overflow-hidden rounded-ict-card border bg-ict-paper-0 shadow-ict-sm transition-shadow duration-300"
              style={{
                borderColor: isOpen ? tone.line : "var(--color-ict-paper-300)",
                boxShadow: isOpen ? `0 16px 36px -22px rgba(${tone.rgb}, 0.6)` : undefined,
              }}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4">
                <button
                  type="button"
                  onClick={() => toggle(lesson.id)}
                  aria-expanded={isOpen}
                  aria-controls={`lesson-panel-${lesson.id}`}
                  className="flex min-w-[12rem] flex-1 items-center gap-3 text-left"
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold"
                    style={{ background: tone.soft, color: tone.ink }}
                  >
                    {lesson.id}
                  </span>
                  <span className="min-w-0 flex-1">
                    <h2 className="m-0 block truncate text-base font-semibold">{lesson.title}</h2>
                    <span className="block text-xs text-ict-ink-400">
                      {lesson.periods} periods · {lesson.examObjectives.length} exam objectives
                    </span>
                  </span>
                  <Icon
                    name="expand_more"
                    className={`!text-xl shrink-0 text-ict-ink-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <span className="ml-auto">
                  <ClassCta
                    subjectId={subjectId}
                    topicClass={lessonClass}
                    tone={tone}
                    size="sm"
                  />
                </span>
              </div>

              <div
                id={`lesson-panel-${lesson.id}`}
                className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden">
                  <div className="space-y-4 px-4 pb-4">
                    <div>
                      <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">
                        Exam objectives
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {lesson.examObjectives.map((objective, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Icon
                              name="check_circle"
                              className="mt-0.5 !text-base shrink-0 text-ict-green-500"
                            />
                            <span>{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">
                        Important areas to cover
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {lesson.importantAreas.map((area, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 rounded-xl p-2.5 text-sm"
                            style={{ background: tone.soft, color: tone.ink }}
                          >
                            <Icon name="priority_high" className="mt-0.5 !text-base shrink-0" />
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {lesson.content ? (
                      <div>
                        <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">Notes</p>
                        <div className="mt-1.5">
                          <LessonContent content={lesson.content} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-ict-ink-400">Lesson content not added yet.</p>
                    )}

                    {LESSON_INTERACTIVES[lesson.id] ? (
                      <div>{LESSON_INTERACTIVES[lesson.id]!(tone)}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
