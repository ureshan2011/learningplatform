"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { isHighYield, unitColors } from "@/lib/content/unit-visuals";
import type { LandingUnit, SyllabusTotals } from "@/lib/content/landing-syllabus";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BoltIcon,
  CertificateIcon,
  ChatIcon,
  CheckCircleIcon,
  ChecklistIcon,
  ClockIcon,
  DownloadIcon,
  FlaskIcon,
  LayersIcon,
  MapIcon,
  MedalIcon,
  NoteIcon,
  PlayCircleIcon,
  QuestionIcon,
  TargetIcon,
  TranslateIcon,
  VideoIcon,
} from "@/components/marketing/landing/icons";

type LandingIcon = (props: { className?: string }) => React.JSX.Element;
type YearFilter = "all" | 12 | 13;

/**
 * What a student gets for one competency level.
 *
 * `access` is the honest part of this list and must stay honest: "free" items
 * are the ones a signed-out visitor can already reach from /notes,
 * /command-words and the syllabus pages, and "class" items are what the live
 * subscription (and its free 7-day trial) opens. Nothing here is a claim about
 * a specific lesson's material being published yet — the roadmap on
 * /syllabus/al-ict is what shows the state of any one topic.
 */
interface KitItem {
  icon: LandingIcon;
  label: string;
  blurb: string;
  access: "free" | "class";
}

const LESSON_KIT: KitItem[] = [
  {
    icon: NoteIcon,
    label: "Short note",
    blurb: "One page per competency level — the whole lesson in a form you can revise the night before.",
    access: "free",
  },
  {
    icon: QuestionIcon,
    label: "Model questions",
    blurb: "Paper I MCQs and Paper II structured questions written to this lesson's objectives.",
    access: "free",
  },
  {
    icon: VideoIcon,
    label: "Discussion video",
    blurb: "The question worked through out loud — what the examiner is asking and how the marks split.",
    access: "free",
  },
  {
    icon: TranslateIcon,
    label: "Sinhala–English terms",
    blurb: "The technical vocabulary both ways, so an English-worded paper never costs you a mark.",
    access: "free",
  },
  {
    icon: ChecklistIcon,
    label: "Command-word drill",
    blurb: "State, explain, distinguish, justify — practice answering the verb, not just the topic.",
    access: "free",
  },
  {
    icon: MapIcon,
    label: "Unit mind map",
    blurb: "One diagram tying the competency levels together, for the last week before the paper.",
    access: "free",
  },
  {
    icon: TargetIcon,
    label: "Marking-scheme answers",
    blurb: "Full answers written the way marks are actually awarded, point by point.",
    access: "class",
  },
  {
    icon: PlayCircleIcon,
    label: "Class recording",
    blurb: "Miss the live class, or sit it again at 1.5×. Recordings stay on your subject page.",
    access: "class",
  },
  {
    icon: FlaskIcon,
    label: "Interactive simulation",
    blurb: "Logic gates, SQL, pseudocode and spreadsheet labs that run in the browser — no install.",
    access: "class",
  },
  {
    icon: BoltIcon,
    label: "In-class quiz",
    blurb: "Answer live from your phone and see the island-wide leaderboard the moment it closes.",
    access: "class",
  },
  {
    icon: MedalIcon,
    label: "Timed mock paper",
    blurb: "Real exam timing with negative marking, and a rank against everyone else who sat it.",
    access: "class",
  },
  {
    icon: ChatIcon,
    label: "Doubt clinic",
    blurb: "Ask about this exact lesson and get an answer — not a link to a 90-minute video.",
    access: "class",
  },
];

const FREE_KIT = LESSON_KIT.filter((k) => k.access === "free");
const CLASS_KIT = LESSON_KIT.filter((k) => k.access === "class");

/**
 * The syllabus, as the landing page's centrepiece.
 *
 * A parent or a student arriving cold has one question — "what exactly do I
 * get?" — and a bullet list answers it weakly. This answers it with the real
 * NIE syllabus: pick any of the 14 competencies, open any competency level
 * inside it, and see the exam objectives, where the marks concentrate, and the
 * material that comes with that one topic, with the class and the downloads a
 * click away. Buying topic by topic is the point: nobody has to take the whole
 * course on faith.
 *
 * Everything renders from data the page already fetched, so switching year,
 * unit or lesson costs no round trip and no Firestore read.
 */
/**
 * When the next class on a unit or a competency level starts, formatted on the
 * server. Formatting there rather than here is what keeps hydration
 * byte-identical across Node and the browser — see `TopicClass.startsAtLabel`.
 */
export interface SyllabusClassDates {
  byUnit: Record<string, string>;
  byLesson: Record<string, string>;
}

export function SyllabusShowcase({
  units,
  totals,
  classDates,
  subjectId,
  startHref,
}: {
  units: LandingUnit[];
  totals: SyllabusTotals;
  classDates: SyllabusClassDates;
  subjectId: string;
  /** Where "join the class" sends someone — their dashboard when signed in, sign-in otherwise. */
  startHref: string;
}) {
  const [year, setYear] = useState<YearFilter>("all");
  const [activeId, setActiveId] = useState<string | null>(units[0]?.id ?? null);
  const [openLessonId, setOpenLessonId] = useState<string | null>(
    units[0]?.lessons[0]?.id ?? null,
  );

  const visible = useMemo(
    () => (year === "all" ? units : units.filter((u) => u.gradeYear === year)),
    [units, year],
  );
  // Falling back to the first visible unit is what keeps the year filter from
  // ever emptying the panel: filtering to Grade 13 while a Grade 12 unit is
  // open simply moves you to the first Grade 13 unit.
  const active = visible.find((u) => u.id === activeId) ?? visible[0];
  const maxPeriods = Math.max(1, ...units.map((u) => u.periods));

  if (!active) return null;

  const tone = unitColors(active.competencyNumber);
  const years = Array.from(new Set(units.map((u) => u.gradeYear))).sort((a, b) => a - b);

  function selectUnit(unit: LandingUnit) {
    setActiveId(unit.id);
    setOpenLessonId(unit.lessons[0]?.id ?? null);
  }

  return (
    <section id="syllabus" className="w-full scroll-mt-24 py-[clamp(32px,6vw,72px)]">
      <div className="mx-auto w-full max-w-[1180px] px-[clamp(20px,4vw,32px)]">
        <div className="lp-reveal text-[13px] font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">
          The A/L ICT syllabus
        </div>
        <div className="mt-2.5 mb-[clamp(20px,3vw,30px)] flex flex-wrap items-end gap-[clamp(20px,4vw,40px)]">
          <h2 className="lp-reveal m-0 max-w-[16ch] text-[clamp(30px,4.6vw,48px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]">
            Learn it topic by topic<span className="text-(--lp-orange-500)">.</span>
          </h2>
          <p className="lp-reveal mb-1 max-w-[440px] flex-1 text-sm text-(--lp-ink-500) text-wrap-pretty">
            The whole NIE syllabus, unit by unit and competency level by competency level. Open any
            topic to see what the exam asks of you, where the marks sit — and join the class or take
            the notes for that one topic. You never have to buy the whole course to fix one weak unit.
          </p>
        </div>

        {/* Proof of scale, straight off the syllabus's own period table. */}
        <div
          className="lp-reveal grid gap-px overflow-hidden rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-border-subtle)"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(160px,100%), 1fr))" }}
        >
          {[
            { icon: LayersIcon, value: String(totals.units), label: "official units" },
            { icon: ChecklistIcon, value: String(totals.lessons), label: "competency levels" },
            { icon: ClockIcon, value: `${totals.hours}h`, label: "of teaching time" },
            { icon: DownloadIcon, value: String(LESSON_KIT.length), label: "materials per lesson" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 bg-(--lp-paper-0) p-4">
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-(--lp-orange-50) text-(--lp-orange-500)">
                <stat.icon className="size-[18px]" />
              </span>
              <span>
                <span className="block font-[family-name:var(--lp-font-display)] text-xl leading-none font-extrabold tracking-[-0.02em] text-(--lp-ink-900)">
                  {stat.value}
                </span>
                <span className="mt-1 block text-xs text-(--lp-ink-400)">{stat.label}</span>
              </span>
            </div>
          ))}
        </div>

        {years.length > 1 ? (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-(--lp-ink-400)">Show</span>
            {([["all", "Both years"], ...years.map((y) => [y, `Grade ${y}`] as const)] as Array<
              readonly [YearFilter, string]
            >).map(([value, label]) => {
              const on = year === value;
              return (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setYear(value)}
                  aria-pressed={on}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    on
                      ? "border-transparent bg-(--lp-ink-900) text-white"
                      : "border-(--lp-border-subtle) bg-(--lp-paper-0) text-(--lp-ink-500) hover:border-(--lp-orange-200) hover:text-(--lp-ink-900)"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            <span className="text-xs text-(--lp-ink-400)">
              {visible.length} unit{visible.length === 1 ? "" : "s"}
            </span>
          </div>
        ) : null}

        <div className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          {/* Unit rail — a horizontal strip on a phone, a column on a laptop. */}
          <ul
            className="lp-reveal flex snap-x gap-2 overflow-x-auto pb-2 lg:max-h-[720px] lg:snap-none lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 lg:pr-1"
            aria-label="Syllabus units"
          >
            {visible.map((unit) => {
              const unitTone = unitColors(unit.competencyNumber);
              const on = unit.id === active.id;
              return (
                <li key={unit.id} className="w-[240px] shrink-0 snap-start lg:w-full lg:shrink">
                  <button
                    type="button"
                    onClick={() => selectUnit(unit)}
                    aria-pressed={on}
                    className={`flex w-full items-start gap-3 rounded-[var(--lp-radius-md)] border p-3 text-left transition-all duration-200 ${
                      on
                        ? "border-transparent bg-(--lp-ink-900) shadow-[var(--lp-shadow-md)]"
                        : "border-(--lp-border-subtle) bg-(--lp-paper-0) hover:-translate-y-0.5 hover:shadow-[var(--lp-shadow-sm)]"
                    }`}
                  >
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-[10px] text-sm font-extrabold text-white"
                      style={{
                        backgroundImage: `linear-gradient(140deg, ${unitTone.gradFrom}, ${unitTone.gradTo})`,
                      }}
                    >
                      {unit.competencyNumber}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm leading-snug font-bold ${on ? "text-white" : "text-(--lp-ink-900)"}`}
                      >
                        {unit.title}
                      </span>
                      <span
                        className={`mt-1 block text-[11px] ${on ? "text-(--lp-ink-300)" : "text-(--lp-ink-400)"}`}
                      >
                        Grade {unit.gradeYear} · {unit.lessons.length} lessons · {unit.periods} periods
                      </span>
                      {classDates.byUnit[unit.id] ? (
                        <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-(--lp-orange-500)">
                          <VideoIcon className="size-3.5" />
                          Class {classDates.byUnit[unit.id]}
                        </span>
                      ) : null}
                      <span
                        className={`mt-2 block h-1 w-full overflow-hidden rounded-full ${on ? "bg-(--lp-ink-700)" : "bg-(--lp-paper-200)"}`}
                      >
                        <span
                          className="block h-full origin-left rounded-full transition-transform duration-500"
                          style={{
                            backgroundImage: `linear-gradient(90deg, ${unitTone.gradFrom}, ${unitTone.gradTo})`,
                            transform: `scaleX(${(unit.periods / maxPeriods).toFixed(3)})`,
                          }}
                        />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* The open unit. */}
          <div className="lp-reveal relative overflow-hidden rounded-[var(--lp-radius-panel)] border border-(--lp-border-subtle) bg-(--lp-paper-0) shadow-[var(--lp-shadow-sm)]">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full opacity-60"
              style={{ background: `radial-gradient(circle, ${tone.soft}, transparent 70%)` }}
            />
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundImage: `linear-gradient(90deg, ${tone.gradFrom}, ${tone.gradTo})` }}
            />

            <div className="relative p-[clamp(18px,3vw,28px)]">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: tone.soft, color: tone.ink }}
                >
                  Competency {active.competencyNumber} · Grade {active.gradeYear}
                </span>
                <span className="rounded-full bg-(--lp-paper-100) px-2.5 py-1 text-[11px] font-semibold text-(--lp-ink-500)">
                  {active.periods} periods
                </span>
                {isHighYield(active.periods) ? (
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white uppercase"
                    style={{
                      backgroundImage: `linear-gradient(120deg, ${tone.gradFrom}, ${tone.gradTo})`,
                    }}
                  >
                    High-yield
                  </span>
                ) : null}
              </div>

              <h3 className="mt-3 text-[clamp(22px,2.6vw,30px)] leading-tight font-extrabold tracking-[-0.02em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]">
                {active.title}
              </h3>
              <p className="mt-2 max-w-[62ch] text-sm text-(--lp-ink-500) text-wrap-pretty">
                {active.statement}
              </p>

              {classDates.byUnit[active.id] ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-(--lp-orange-50) py-1.5 pr-4 pl-2 text-xs font-semibold text-(--lp-orange-600)">
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--lp-orange-500) opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-(--lp-orange-500)" />
                  </span>
                  Next live class on this unit · {classDates.byUnit[active.id]}
                </p>
              ) : null}

              {/* Competency levels. One row per lesson, opening onto its exam
                  objectives and its own two calls to action. */}
              <ul className="mt-5 space-y-2">
                {active.lessons.map((lesson) => {
                  const open = openLessonId === lesson.id;
                  const panelId = `lp-lesson-${active.id}-${lesson.id.replace(".", "-")}`;
                  return (
                    <li
                      key={lesson.id}
                      className="overflow-hidden rounded-[var(--lp-radius-md)] border transition-colors"
                      style={{
                        borderColor: open ? tone.line : "var(--lp-border-subtle)",
                        background: open ? tone.soft : "var(--lp-paper-0)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenLessonId(open ? null : lesson.id)}
                        aria-expanded={open}
                        aria-controls={panelId}
                        className="flex w-full items-center gap-3 p-3 text-left"
                      >
                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-[10px] text-xs font-extrabold"
                          style={{ background: open ? "var(--lp-paper-0)" : tone.soft, color: tone.ink }}
                        >
                          {lesson.id}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-snug font-bold text-(--lp-ink-900)">
                            {lesson.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-(--lp-ink-400)">
                            {lesson.periods} periods · {LESSON_KIT.length} materials
                            {classDates.byLesson[lesson.id] ? (
                              <span className="font-semibold text-(--lp-orange-500)">
                                {" "}
                                · live class {classDates.byLesson[lesson.id]}
                              </span>
                            ) : null}
                          </span>
                        </span>
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-full border transition-transform duration-300 ${open ? "rotate-90" : ""}`}
                          style={{ borderColor: tone.line, color: tone.ink }}
                        >
                          <ArrowRightIcon className="size-3.5" />
                        </span>
                      </button>

                      {/* 0fr → 1fr animates a height nobody has measured yet,
                          which is the one way to open variable content smoothly. */}
                      <div
                        id={panelId}
                        className={`grid transition-[grid-template-rows] duration-[400ms] ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                      >
                        <div className="overflow-hidden">
                          <div className="border-t px-3 pt-3 pb-4" style={{ borderColor: tone.line }}>
                            <p className="text-[11px] font-bold tracking-[0.12em] text-(--lp-ink-400) uppercase">
                              After this lesson you can
                            </p>
                            <ul className="mt-2 space-y-1.5">
                              {lesson.objectives.map((objective) => (
                                <li
                                  key={objective}
                                  className="flex gap-2 text-[13px] leading-snug text-(--lp-ink-500)"
                                >
                                  {/* Tone ink clears 4.5:1 on a light surface — see lib/content/unit-visuals.ts. */}
                                  <span className="mt-0.5 shrink-0" style={{ color: tone.ink }}>
                                    <CheckCircleIcon className="size-4" />
                                  </span>
                                  <span>{objective}</span>
                                </li>
                              ))}
                            </ul>

                            {lesson.focus ? (
                              <p className="mt-3 flex gap-2 rounded-[10px] bg-(--lp-paper-0) p-2.5 text-[13px] leading-snug text-(--lp-ink-500)">
                                <span className="shrink-0" style={{ color: tone.ink }}>
                                  <TargetIcon className="size-4" />
                                </span>
                                <span>
                                  <strong className="font-bold text-(--lp-ink-900)">In the paper: </strong>
                                  {lesson.focus}
                                </span>
                              </p>
                            ) : null}

                            <div className="mt-3 flex flex-wrap gap-2">
                              <Link
                                href={startHref}
                                className="inline-flex items-center gap-2 rounded-full bg-(--lp-orange-500) py-2 pr-2 pl-4 text-xs font-semibold text-white hover:bg-(--lp-orange-600) hover:text-white"
                              >
                                {classDates.byLesson[lesson.id]
                                  ? `Join this class · ${classDates.byLesson[lesson.id]}`
                                  : `Join the class for ${lesson.id}`}
                                <span className="grid size-5 place-items-center rounded-full bg-white text-(--lp-orange-500)">
                                  <ArrowRightIcon className="size-3" />
                                </span>
                              </Link>
                              <Link
                                href={`/syllabus/${subjectId}/${active.id}`}
                                className="inline-flex items-center gap-2 rounded-full border border-(--lp-ink-900) px-4 py-2 text-xs font-semibold text-(--lp-ink-900) hover:bg-(--lp-ink-900) hover:text-white"
                              >
                                <DownloadIcon className="size-3.5" />
                                Materials for this topic
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-(--lp-border-subtle) pt-4">
                <Link
                  href={`/syllabus/${subjectId}#roadmap`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-(--lp-ink-900) hover:text-(--lp-orange-600)"
                >
                  Open the full interactive roadmap
                  <span className="grid size-7 place-items-center rounded-full border-[1.5px] border-(--lp-ink-900) text-(--lp-ink-900)">
                    <ArrowUpRightIcon className="size-3" />
                  </span>
                </Link>
                <span className="text-xs text-(--lp-ink-400)">
                  Class timetable, search across every lesson, and the exam focus for all{" "}
                  {totals.lessons} competency levels.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* What "materials" actually means, stated once rather than per lesson. */}
        <div className="lp-reveal mt-4 overflow-hidden rounded-[var(--lp-radius-panel)] bg-(--lp-ink-900) p-[clamp(20px,3vw,32px)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h3 className="m-0 max-w-[20ch] text-[clamp(20px,2.6vw,30px)] leading-tight font-extrabold tracking-[-0.02em] text-(--lp-paper-50) font-[family-name:var(--lp-font-display)]">
              What comes with every single lesson
            </h3>
            <p className="max-w-[380px] text-xs text-(--lp-ink-300) text-wrap-pretty">
              Not one PDF per unit. Each competency level in the list above carries its own pack —
              free items open to anyone, class items included with your subscription and its free
              7-day trial.
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <KitColumn
              title="Free for everyone"
              note="No account needed"
              items={FREE_KIT}
              accent="var(--lp-green-500)"
            />
            <KitColumn
              title="With the live class"
              note="Free for your first 7 days"
              items={CLASS_KIT}
              accent="var(--lp-orange-500)"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-(--lp-border-dark) pt-5">
            <Link
              href={startHref}
              className="flex h-11 items-center gap-3 rounded-full bg-(--lp-orange-500) py-2 pr-2 pl-5 text-sm font-semibold text-white shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600) hover:text-white"
            >
              Start the free trial
              <span className="grid size-7 place-items-center rounded-full bg-white text-(--lp-orange-500)">
                <ArrowRightIcon className="size-3.5" />
              </span>
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs text-(--lp-ink-300)">
              <CertificateIcon className="size-4 text-(--lp-orange-500)" />
              Finish a unit and your progress certificate is generated automatically.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function KitColumn({
  title,
  note,
  items,
  accent,
}: {
  title: string;
  note: string;
  items: KitItem[];
  accent: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: accent }} />
        <span className="text-sm font-bold text-(--lp-paper-50)">{title}</span>
        <span className="rounded-full bg-(--lp-ink-800) px-2 py-0.5 text-[10px] font-semibold text-(--lp-ink-300)">
          {note}
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex gap-3 rounded-[var(--lp-radius-md)] border border-(--lp-border-dark) bg-(--lp-ink-800) p-3 transition-colors hover:bg-(--lp-ink-700)"
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full"
              style={{ background: accent, color: "#ffffff" }}
            >
              <item.icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-(--lp-paper-50)">{item.label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-(--lp-ink-300)">
                {item.blurb}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
