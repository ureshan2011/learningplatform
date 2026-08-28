"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { TopicClass } from "@/lib/content/topic-classes";
import { TONE } from "@/lib/content/unit-visuals";
import { ClassCta, ClassStatus } from "@/components/syllabus/ClassCta";
import { CountUp } from "@/components/syllabus/motion";

/**
 * The opening of the syllabus page.
 *
 * It has one job beyond looking like something worth reading: prove classes
 * are actually running. The counters are the real syllabus totals and the
 * strip below them is the next real class — when there is no class scheduled,
 * nothing is invented, the strip simply becomes the trial invitation.
 */
export function SyllabusHero({
  subjectId,
  subjectName,
  gradeLabel,
  unitCount,
  lessonCount,
  periodCount,
  classCount,
  nextClass,
}: {
  subjectId: string;
  subjectName: string;
  gradeLabel: string;
  unitCount: number;
  lessonCount: number;
  periodCount: number;
  classCount: number;
  nextClass?: TopicClass;
}) {
  const stats: Array<{ icon: IconName; label: string; value: number; suffix?: string }> = [
    { icon: "route", label: "Units", value: unitCount },
    { icon: "description", label: "Lessons", value: lessonCount },
    { icon: "schedule", label: "Periods", value: periodCount },
    { icon: "live_tv", label: "Classes", value: classCount },
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-(--color-awaken-line) bg-(--color-awaken-card) px-6 py-10 sm:px-10 sm:py-14">
      {/* Backdrop: two drifting gradient blobs over dotted graph paper. No
          images, so it adds nothing to the page weight on a slow connection. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="syl-grid-bg absolute inset-0" />
        <div
          className="awaken-blob absolute -top-24 -right-16 size-72 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-awaken-accent), transparent 70%)" }}
        />
        <div
          className="awaken-blob absolute -bottom-28 -left-20 size-80 rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--color-awaken-rose), transparent 70%)",
            animationDelay: "-7s",
          }}
        />
      </div>

      <div className="relative">
        <div className="awaken-rise flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-(--color-awaken-accent-soft) px-3 py-1 text-xs font-bold text-(--color-awaken-accent)">
            {gradeLabel}
          </span>
          <span className="rounded-full border border-(--color-awaken-line) px-3 py-1 text-xs font-semibold text-(--color-awaken-ink-soft)">
            Official NIE syllabus
          </span>
          <span className="rounded-full border border-(--color-awaken-line) px-3 py-1 text-xs font-semibold text-(--color-awaken-ink-soft)">
            Free to explore · no sign-up
          </span>
        </div>

        <h1
          className="awaken-rise mt-5 max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl"
          style={{ animationDelay: "0.05s" }}
        >
          {subjectName}
          <span className="block bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) bg-clip-text text-transparent">
            every topic, and the class that teaches it.
          </span>
        </h1>

        <p
          className="awaken-rise mt-5 max-w-2xl text-lg leading-relaxed text-(--color-awaken-ink-soft)"
          style={{ animationDelay: "0.1s" }}
        >
          Follow the whole syllabus as a roadmap — unit by unit, competency by
          competency, with exam objectives and where the marks actually sit. Found
          the topic you&apos;re stuck on? Join the live class for that topic on its own.
        </p>

        <div
          className="awaken-rise mt-7 grid grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-4"
          style={{ animationDelay: "0.15s" }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card)/80 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-(--color-awaken-accent)/40 hover:shadow-[0_14px_30px_-16px_rgba(234,88,12,0.55)]"
            >
              <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-(--color-awaken-ink-soft) uppercase">
                <Icon name={stat.icon} className="!text-base" />
                {stat.label}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
                <CountUp value={stat.value} />
              </p>
            </div>
          ))}
        </div>

        <div
          className="awaken-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          style={{ animationDelay: "0.2s" }}
        >
          {nextClass ? (
            <div className="flex flex-1 flex-wrap items-center gap-3 rounded-2xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-3 sm:flex-nowrap">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-(--color-awaken-accent) to-(--color-awaken-rose) text-white">
                <Icon name="live_tv" className="!text-xl" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{nextClass.title}</span>
                <ClassStatus
                  topicClass={nextClass}
                  className="block text-xs text-(--color-awaken-ink-soft)"
                />
              </span>
              <ClassCta subjectId={subjectId} topicClass={nextClass} tone={TONE.ember} />
            </div>
          ) : (
            <Link
              href={`/signin?next=/subjects/${subjectId}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-6 py-3 font-semibold text-white shadow-[0_10px_28px_-8px_rgba(234,88,12,0.6)] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.99]"
            >
              <Icon name="videocam" className="!text-lg" />
              Start free — 7 days, no card
            </Link>
          )}

          <a
            href="#roadmap"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-(--color-awaken-line) bg-(--color-awaken-card) px-5 py-3 text-sm font-semibold transition-colors hover:border-(--color-awaken-accent)/40"
          >
            Follow the roadmap
            <Icon name="expand_more" className="!text-base" />
          </a>
        </div>
      </div>
    </section>
  );
}
