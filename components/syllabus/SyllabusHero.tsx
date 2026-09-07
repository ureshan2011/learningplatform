"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import type { TopicClass } from "@/lib/content/topic-classes";
import { TONE } from "@/lib/content/unit-visuals";
import { ClassCta, ClassStatus } from "@/components/syllabus/ClassCta";
import { CountUp } from "@/components/syllabus/motion";
import { ButtonLink, Card, Chip, IconBadge } from "@/components/ds-cream";

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
    <Card radius="panel" className="relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
      {/* Faint dotted graph paper — a data-free texture that costs one
          gradient rather than an image request, and no orange. */}
      <div aria-hidden className="syl-grid-bg pointer-events-none absolute inset-0" />

      <div className="relative">
        <div className="awaken-rise flex flex-wrap items-center gap-2">
          <Chip active>{gradeLabel}</Chip>
          <Chip>Official NIE syllabus</Chip>
          <Chip>Free to explore · no sign-up</Chip>
        </div>

        <h1
          className="awaken-rise mt-5 max-w-3xl font-display text-4xl leading-[1.08] font-extrabold tracking-[-0.02em] text-ict-ink-900 sm:text-5xl"
          style={{ animationDelay: "0.05s" }}
        >
          {subjectName}
          <span className="block text-ict-orange-600">every topic, and the class that teaches it.</span>
        </h1>

        <p
          className="awaken-rise mt-5 max-w-2xl text-lg leading-relaxed text-ict-ink-400"
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
            <div key={stat.label} className="rounded-ict-md border border-ict-paper-300 bg-ict-paper-0 p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-ict-ink-400 uppercase">
                <Icon name={stat.icon} className="!text-base" />
                {stat.label}
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold tracking-[-0.02em] text-ict-ink-900">
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
            <div className="flex flex-1 flex-wrap items-center gap-3 rounded-ict-md border border-ict-orange-200 bg-ict-orange-50 p-3 sm:flex-nowrap">
              <IconBadge icon="live_tv" tone="brand" size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ict-ink-900">{nextClass.title}</span>
                <ClassStatus topicClass={nextClass} className="block text-xs text-ict-ink-400" />
              </span>
              <ClassCta subjectId={subjectId} topicClass={nextClass} tone={TONE.ember} />
            </div>
          ) : (
            <ButtonLink href={`/go?do=trial&subject=${subjectId}`} variant="primary" size="lg">
              <Icon name="videocam" className="!text-lg" />
              Start free — 7 days, no card
            </ButtonLink>
          )}

          <ButtonLink href="#roadmap" variant="outline" size="lg" arrow="down">
            Follow the roadmap
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
