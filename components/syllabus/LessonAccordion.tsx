"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { TONE_CLASSES, type AccentTone } from "@/lib/content/unit-visuals";
import type { Lesson } from "@/lib/types";

/**
 * Lessons collapsed by default, each expanding in place to reveal exam
 * objectives and exam-focus notes — "go deeper" without leaving the unit
 * page or triggering a request, since all the data is already on the client.
 */
export function LessonAccordion({ lessons, tone }: { lessons: Lesson[]; tone: AccentTone }) {
  const [open, setOpen] = useState<Set<string>>(new Set([lessons[0]?.id]));
  const toneClass = TONE_CLASSES[tone];
  const allOpen = open.size === lessons.length;

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
          className="flex items-center gap-1.5 rounded-lg border border-(--color-awaken-line) px-3 py-1.5 text-xs font-semibold text-(--color-awaken-ink-soft) hover:border-(--color-awaken-accent)/40 hover:text-(--color-awaken-ink)"
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
            className={`rounded-md px-2 py-1 text-xs font-semibold ${toneClass.bg} ${toneClass.fg} hover:opacity-80`}
          >
            {l.id}
          </a>
        ))}
      </nav>

      <ol className="mt-4 space-y-3">
        {lessons.map((lesson) => {
          const isOpen = open.has(lesson.id);
          return (
            <li
              key={lesson.id}
              id={`lesson-${lesson.id}`}
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <button
                type="button"
                onClick={() => toggle(lesson.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${toneClass.bg} ${toneClass.fg} text-xs font-bold`}>
                    {lesson.id}
                  </span>
                  <span className="min-w-0 truncate font-semibold">{lesson.title}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-(--color-awaken-ink-soft)">{lesson.periods}p</span>
                  <Icon
                    name="expand_more"
                    className={`!text-xl text-(--color-awaken-ink-soft) transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden">
                  <div className="space-y-4 px-4 pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-(--color-awaken-ink-soft)">
                        Exam objectives
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {lesson.examObjectives.map((o, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Icon name="check_circle" className="mt-0.5 !text-base shrink-0 text-(--color-awaken-success)" />
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-(--color-awaken-ink-soft)">
                        Important areas to cover
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {lesson.importantAreas.map((a, i) => (
                          <li
                            key={i}
                            className={`flex items-start gap-2 rounded-lg ${toneClass.bg} p-2.5 text-sm ${toneClass.fg}`}
                          >
                            <Icon name="priority_high" className="mt-0.5 !text-base shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {!lesson.content ? (
                      <p className="text-xs text-(--color-awaken-ink-soft)">Lesson content not added yet.</p>
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
