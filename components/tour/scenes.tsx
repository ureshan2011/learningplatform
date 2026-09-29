"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * The little animated pictures on each slide of the welcome tour.
 *
 * They are drawn from the same tokens as the real screens rather than being
 * screenshots, so they stay crisp on any phone, cost nothing to download, and
 * never go stale when a page is redesigned — only the idea is shown, not the
 * pixels. Words are kept to a minimum and anything that is read comes in as a
 * prop, so a scene reads the same in English and Sinhala.
 *
 * Each scene plays once, as a short staggered sequence, when its slide comes
 * into view — the system's 8-12px translate plus fade, never a loop.
 */

export type SceneId =
  | "welcome"
  | "live"
  | "lab"
  | "mocks"
  | "practice"
  | "syllabus"
  | "library"
  | "certificate"
  | "everywhere"
  | "done";

export interface SceneLabels {
  live: string;
  watching: string;
  correct: string;
  handUp: string;
  run: string;
  rows: string;
  timeLeft: string;
  answered: string;
  score: string;
  comesBack: string;
  xp: string;
  streak: string;
  certificate: string;
  reminder: string;
  search: string;
  english: string;
  sinhala: string;
  /** Welcome-scene tile captions, in slide order. */
  tiles: string[];
}

/** Steps 0..count, one every `interval` ms while `active`. Stops at the end. */
function useSequence(active: boolean, count: number, interval = 420, reduced = false) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (reduced) {
      // Deferred a tick so the state update is not synchronous in the effect.
      const id = setTimeout(() => setStep(count), 0);
      return () => clearTimeout(id);
    }
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setStep(n);
      if (n >= count) clearInterval(id);
    }, interval);
    return () => {
      clearInterval(id);
      setStep(0);
    };
  }, [active, count, interval, reduced]);
  return step;
}

/** Characters of `text` revealed so far, typing at `speed` ms once `start` is true. */
function useTyped(text: string, start: boolean, speed = 28, reduced = false) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (reduced) {
      const id = setTimeout(() => setN(text.length), 0);
      return () => clearTimeout(id);
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => {
      clearInterval(id);
      setN(0);
    };
  }, [text, start, speed, reduced]);
  return text.slice(0, n);
}

/** Fades and lifts a child in once `show` is true. */
function Reveal({
  show,
  className,
  children,
  from = "y",
}: {
  show: boolean;
  className?: string;
  children: React.ReactNode;
  from?: "y" | "x";
}) {
  return (
    <div
      className={clsx(
        "transition-[opacity,transform] duration-[340ms] ease-ict-out motion-reduce:transition-none",
        show
          ? "translate-x-0 translate-y-0 opacity-100"
          : from === "y"
            ? "translate-y-2.5 opacity-0"
            : "translate-x-3 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A mini app window the scenes sit in. */
function Window({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "w-full max-w-[340px] overflow-hidden rounded-ict-card border border-ict-border-dark bg-ict-ink-900 shadow-ict-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A grey stand-in for a line of text. */
function Line({ w, className }: { w: string; className?: string }) {
  return <span className={clsx("block h-2 rounded-full bg-ict-ink-600", className)} style={{ width: w }} />;
}

export function Scene({
  id,
  active,
  labels,
  reduced,
}: {
  id: SceneId;
  active: boolean;
  labels: SceneLabels;
  reduced: boolean;
}) {
  const props = { active, labels, reduced };
  switch (id) {
    case "welcome":
      return <WelcomeScene {...props} />;
    case "live":
      return <LiveScene {...props} />;
    case "lab":
      return <LabScene {...props} />;
    case "mocks":
      return <MocksScene {...props} />;
    case "practice":
      return <PracticeScene {...props} />;
    case "syllabus":
      return <SyllabusScene {...props} />;
    case "library":
      return <LibraryScene {...props} />;
    case "certificate":
      return <CertificateScene {...props} />;
    case "everywhere":
      return <EverywhereScene {...props} />;
    case "done":
      return <DoneScene {...props} />;
  }
}

type SceneProps = { active: boolean; labels: SceneLabels; reduced: boolean };

/* -------------------------------------------------------------------------- */

const WELCOME_ICONS: IconName[] = ["videocam", "code", "schedule", "quiz", "auto_stories", "description"];

function WelcomeScene({ active, labels, reduced }: SceneProps) {
  const step = useSequence(active, WELCOME_ICONS.length + 1, 150, reduced);
  return (
    <div className="flex w-full max-w-[340px] flex-col items-center">
      <Reveal show={step >= 1}>
        <span className="grid size-16 place-items-center rounded-ict-card bg-ict-orange-500 text-white shadow-ict-brand">
          <Icon name="school" className="!text-3xl" />
        </span>
      </Reveal>
      <div className="mt-6 grid w-full grid-cols-3 gap-2.5">
        {WELCOME_ICONS.map((icon, i) => (
          <Reveal key={icon} show={step >= i + 2}>
            <div className="flex flex-col items-center gap-1.5 rounded-ict-md border border-ict-border-dark bg-ict-ink-900/80 px-2 py-3 text-center">
              <Icon name={icon} className="!text-xl text-ict-paper-50" />
              <span className="line-clamp-1 w-full truncate text-xs font-semibold text-ict-ink-200">{labels.tiles[i]}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function LiveScene({ active, labels, reduced }: SceneProps) {
  const step = useSequence(active, 6, 450, reduced);
  const options = ["A", "B", "C", "D"];
  const leaders = [
    { w: "46%", pts: 340, you: false },
    { w: "38%", pts: 320, you: true },
    { w: "52%", pts: 295, you: false },
  ];
  return (
    <Window>
      <div className="relative aspect-[16/8] bg-ict-ink-800">
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid size-14 place-items-center rounded-full bg-ict-ink-600 text-ict-paper-50">
            <Icon name="co_present" className="!text-2xl" />
          </span>
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-ict-ink-900/85 px-2.5 py-1 text-xs font-bold text-ict-paper-50">
          <span className="size-1.5 rounded-full bg-ict-red-500" />
          {labels.live}
        </div>
        <div className="absolute top-3 right-3 rounded-full bg-ict-ink-900/85 px-2.5 py-1 text-xs font-semibold text-ict-ink-200">
          {labels.watching}
        </div>
        <Reveal show={step >= 5} className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ict-ink-900/85 px-2.5 py-1 text-xs font-semibold text-ict-paper-50">
            <Icon name="flag" className="!text-sm" />
            {labels.handUp}
          </span>
        </Reveal>
      </div>
      <div className="space-y-3 p-3.5">
        <Reveal show={step >= 1}>
          <Line w="82%" className="bg-ict-ink-500" />
          <Line w="56%" className="mt-1.5 bg-ict-ink-500" />
        </Reveal>
        <div className="grid grid-cols-2 gap-2">
          {options.map((o, i) => {
            const right = o === "B" && step >= 3;
            return (
              <Reveal key={o} show={step >= 2}>
                <div
                  className={clsx(
                    "flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold transition-colors duration-[200ms] ease-ict",
                    right ? "border-ict-green-500 text-ict-paper-50" : "border-ict-border-dark text-ict-ink-300",
                  )}
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  {o}
                  {right ? (
                    <span className="ml-auto flex items-center gap-1 text-ict-green-500">
                      <Icon name="check_circle" className="!text-sm" />
                      <span className="hidden min-[380px]:inline">{labels.correct}</span>
                    </span>
                  ) : (
                    <Line w="50%" />
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal show={step >= 4}>
          <div className="space-y-1.5 rounded-ict-md bg-ict-ink-800 p-2.5">
            {leaders.map((l, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs">
                <span className="w-3 font-bold text-ict-ink-300">{i + 1}</span>
                <span
                  className={clsx(
                    "size-5 shrink-0 rounded-full",
                    l.you ? "bg-ict-orange-500" : "bg-ict-ink-600",
                  )}
                />
                <Line w={l.w} className={l.you ? "bg-ict-ink-400" : undefined} />
                <span className={clsx("ml-auto font-bold", l.you ? "text-ict-paper-50" : "text-ict-ink-300")}>
                  {l.pts}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Window>
  );
}

/* -------------------------------------------------------------------------- */

const SQL = "SELECT name, marks\nFROM   students\nWHERE  marks >= 75\nORDER  BY marks DESC;";
const SQL_ROWS: [string, number][] = [
  ["Nethmi", 94],
  ["Kavindu", 88],
  ["Sanduni", 81],
];

function LabScene({ active, labels, reduced }: SceneProps) {
  const typed = useTyped(SQL, active, 26, reduced);
  const doneTyping = typed.length === SQL.length;
  const step = useSequence(active && doneTyping, SQL_ROWS.length + 1, 260, reduced);
  return (
    <Window>
      <div className="flex items-center gap-1.5 border-b border-ict-border-dark px-3.5 py-2.5">
        {["SQL", "Pseudocode", "Sheet"].map((tab, i) => (
          <span
            key={tab}
            className={clsx(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              i === 0 ? "bg-ict-ink-700 text-ict-paper-50" : "text-ict-ink-400",
            )}
          >
            {tab}
          </span>
        ))}
        <span
          className={clsx(
            "ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors duration-[200ms] ease-ict",
            step >= 1 ? "bg-ict-orange-500 text-white" : "bg-ict-ink-700 text-ict-ink-300",
          )}
        >
          <Icon name="play_arrow" className="!text-xs" />
          {labels.run}
        </span>
      </div>
      <pre className="min-h-[112px] overflow-hidden px-3.5 py-3 font-mono text-xs leading-relaxed whitespace-pre text-ict-ink-200">
        {typed}
        {!doneTyping ? <span className="ml-px inline-block h-3.5 w-1.5 translate-y-0.5 bg-ict-ink-300" /> : null}
      </pre>
      <div className="border-t border-ict-border-dark px-3.5 py-2.5">
        <Reveal show={step >= 1}>
          <p className="mb-1.5 text-xs font-semibold text-ict-ink-400">{labels.rows}</p>
        </Reveal>
        <div className="space-y-1">
          {SQL_ROWS.map(([name, marks], i) => (
            <Reveal key={name} show={step >= i + 2} from="x">
              <div className="flex items-center justify-between rounded-full bg-ict-ink-800 px-3 py-1.5 font-mono text-xs text-ict-paper-50">
                <span>{name}</span>
                <span className="text-ict-ink-300">{marks}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Window>
  );
}

/* -------------------------------------------------------------------------- */

/** Minutes as an exam clock, `3:00`. */
function clock(minutes: number) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

function MocksScene({ active, labels, reduced }: SceneProps) {
  const step = useSequence(active, 14, 150, reduced);
  const filled = Math.min(step * 4, 50);
  const done = step >= 14;
  const R = 34;
  const C = 2 * Math.PI * R;
  // The clock drains in step with the answer sheet filling, a notch per beat.
  const remaining = 1 - (Math.min(step, 14) / 14) * 0.36;
  return (
    <Window className="p-4">
      <div className="flex items-center gap-4">
        <div className="relative size-[84px] shrink-0">
          <svg viewBox="0 0 80 80" className="size-full -rotate-90">
            <circle cx="40" cy="40" r={R} fill="none" strokeWidth="6" className="stroke-ict-ink-700" />
            <circle
              cx="40"
              cy="40"
              r={R}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className="stroke-ict-paper-50 transition-[stroke-dashoffset] duration-[200ms] ease-ict motion-reduce:transition-none"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - remaining)}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <span className="font-display text-sm font-extrabold text-ict-paper-50 tabular-nums">
              {clock(Math.round(180 * remaining))}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-ict-ink-400">{labels.timeLeft}</p>
          <p className="mt-0.5 text-sm font-bold text-ict-paper-50 tabular-nums">
            {labels.answered.replace("{n}", String(filled))}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ict-ink-700">
            <div
              className="h-full rounded-full bg-ict-ink-300 transition-[width] duration-[200ms] ease-ict"
              style={{ width: `${(filled / 50) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-10 gap-1">
        {Array.from({ length: 50 }, (_, i) => (
          <span
            key={i}
            className={clsx(
              "aspect-square rounded-full transition-colors duration-[200ms] ease-ict",
              i < filled ? "bg-ict-ink-300" : "bg-ict-ink-700",
            )}
          />
        ))}
      </div>
      <Reveal show={done} className="mt-4">
        <div className="flex items-center justify-between rounded-ict-md bg-ict-ink-800 px-3.5 py-3">
          <span className="text-sm font-semibold text-ict-ink-200">{labels.score}</span>
          <span className="font-display text-2xl font-extrabold text-ict-paper-50">
            78<span className="text-ict-orange-500">.</span>
            <span className="text-sm font-semibold text-ict-ink-400"> / 100</span>
          </span>
        </div>
      </Reveal>
    </Window>
  );
}

/* -------------------------------------------------------------------------- */

function PracticeScene({ active, labels, reduced }: SceneProps) {
  const step = useSequence(active, 6, 480, reduced);
  const level = step >= 5 ? 72 : 48;
  return (
    <div className="relative w-full max-w-[340px]">
      <Window className="p-4">
        <Line w="88%" className="bg-ict-ink-500" />
        <Line w="62%" className="mt-1.5 bg-ict-ink-500" />
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => {
            const wrong = i === 0 && step >= 1;
            const right = i === 2 && step >= 3;
            return (
              <div
                key={i}
                className={clsx(
                  "flex h-10 items-center gap-2.5 rounded-full border px-3.5 transition-colors duration-[200ms] ease-ict",
                  wrong ? "border-ict-red-500" : right ? "border-ict-green-500" : "border-ict-border-dark",
                )}
              >
                <span
                  className={clsx(
                    "size-1.5 rounded-full",
                    wrong ? "bg-ict-red-500" : right ? "bg-ict-green-500" : "bg-ict-ink-500",
                  )}
                />
                <Line w={["58%", "44%", "66%"][i]} />
              </div>
            );
          })}
        </div>
        <Reveal show={step >= 2} className="mt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ict-border-dark px-2.5 py-1 text-xs font-semibold text-ict-ink-200">
            <Icon name="schedule" className="!text-sm" />
            {labels.comesBack}
          </span>
        </Reveal>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs font-bold text-ict-ink-300">Lv 4</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ict-ink-700">
            <div
              className="h-full rounded-full bg-ict-paper-50 transition-[width] duration-[340ms] ease-ict-out"
              style={{ width: `${level}%` }}
            />
          </div>
        </div>
      </Window>
      <Reveal show={step >= 4} className="absolute -top-3 right-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-ict-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-ict-brand">
          <Icon name="bolt" className="!text-sm" />
          {labels.xp}
        </span>
      </Reveal>
      <Reveal show={step >= 6} className="absolute -bottom-3 left-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-ict-border-dark bg-ict-ink-800 px-3 py-1.5 text-xs font-bold text-ict-paper-50">
          <Icon name="local_fire_department" className="!text-sm" />
          {labels.streak}
        </span>
      </Reveal>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const UNITS: [number, string, number][] = [
  [1, "Concept of ICT", 100],
  [3, "Data Representation", 100],
  [4, "Digital Circuits", 64],
  [8, "Database Management", 30],
  [9, "Programming", 0],
];

function SyllabusScene({ active, reduced }: SceneProps) {
  const step = useSequence(active, UNITS.length + 1, 260, reduced);
  return (
    <Window className="p-3">
      <div className="relative">
        <span aria-hidden className="absolute top-4 bottom-4 left-[17px] w-px bg-ict-ink-600" />
        <div className="space-y-1.5">
          {UNITS.map(([n, title, pct], i) => {
            const shown = step >= i + 1;
            const done = pct === 100;
            return (
              <Reveal key={n} show={shown} from="x">
                <div className="relative flex items-center gap-3 rounded-ict-md px-1.5 py-2">
                  <span
                    className={clsx(
                      "relative z-10 grid size-[22px] shrink-0 place-items-center rounded-full border text-[10px] font-bold",
                      done
                        ? "border-ict-paper-50 bg-ict-paper-50 text-ict-ink-900"
                        : pct > 0
                          ? "border-ict-orange-500 bg-ict-ink-900 text-ict-paper-50"
                          : "border-ict-ink-500 bg-ict-ink-900 text-ict-ink-400",
                    )}
                  >
                    {done ? <Icon name="done" className="!text-xs" strokeWidth={3} /> : n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ict-paper-50">{title}</p>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ict-ink-700">
                      <div
                        className="h-full rounded-full bg-ict-ink-300 transition-[width] duration-[340ms] ease-ict-out"
                        style={{ width: shown ? `${pct}%` : "0%" }}
                      />
                    </div>
                  </div>
                  <span className="w-9 text-right text-xs font-bold text-ict-ink-300 tabular-nums">{pct}%</span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Window>
  );
}

/* -------------------------------------------------------------------------- */

const DOCS: { title: string; meta: string; icon: IconName }[] = [
  { title: "2025 A/L ICT — Paper I", meta: "PDF · 50 MCQ", icon: "assignment" },
  { title: "2024 A/L ICT — Paper II", meta: "PDF · Structured", icon: "assignment" },
  { title: "Unit 8 — Normalisation", meta: "Notes", icon: "description" },
  { title: "Command words", meta: "Explain · Distinguish", icon: "edit_note" },
];

function LibraryScene({ active, reduced }: SceneProps) {
  const step = useSequence(active, DOCS.length, 220, reduced);
  return (
    <div className="w-full max-w-[340px] space-y-2">
      {DOCS.map((d, i) => (
        <Reveal key={d.title} show={step >= i + 1}>
          <div
            className="flex items-center gap-3 rounded-ict-md border border-ict-border-dark bg-ict-ink-900 px-3.5 py-3 shadow-ict-md"
            style={{ marginLeft: `${(i % 2) * 14}px`, marginRight: `${((i + 1) % 2) * 14}px` }}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-ict-sm bg-ict-ink-700 text-ict-paper-50">
              <Icon name={d.icon} className="!text-lg" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ict-paper-50">{d.title}</span>
              <span className="block truncate text-xs text-ict-ink-400">{d.meta}</span>
            </span>
            <Icon name="download" className="!text-lg text-ict-ink-300" />
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CertificateScene({ active, labels, reduced }: SceneProps) {
  const step = useSequence(active, 4, 380, reduced);
  return (
    <Reveal show={step >= 1} className="w-full max-w-[320px]">
      <div className="relative overflow-hidden rounded-ict-card bg-ict-paper-50 p-5 text-ict-ink-900 shadow-ict-lg">
        <div aria-hidden className="absolute inset-2.5 rounded-ict-md border border-ict-paper-300" />
        <div className="relative text-center">
          <p className="text-[10px] font-bold tracking-[0.14em] text-ict-orange-600 uppercase">ICT Campus</p>
          <p className="mt-1.5 font-display text-base font-extrabold">{labels.certificate}</p>
          <Reveal show={step >= 2} className="mx-auto mt-4 w-3/4">
            <span className="block h-2.5 rounded-full bg-ict-ink-900" />
            <span className="mx-auto mt-2 block h-1.5 w-2/3 rounded-full bg-ict-paper-300" />
          </Reveal>
          <div className="mt-5 flex items-end justify-between">
            <span className="h-px w-16 bg-ict-paper-300" />
            <Reveal show={step >= 3}>
              <span className="grid size-12 place-items-center rounded-full bg-ict-orange-500 text-white shadow-ict-brand">
                <Icon name="military_tech" className="!text-2xl" />
              </span>
            </Reveal>
            <span className="h-px w-16 bg-ict-paper-300" />
          </div>
          <Reveal show={step >= 4} className="mt-3">
            <p className="text-xs font-bold text-ict-ink-500">A/L ICT · 100%</p>
          </Reveal>
        </div>
      </div>
    </Reveal>
  );
}

/* -------------------------------------------------------------------------- */

function EverywhereScene({ active, labels, reduced }: SceneProps) {
  const query = "normalisation";
  const typed = useTyped(query, active, 70, reduced);
  const step = useSequence(active && typed.length === query.length, 4, 380, reduced);
  const sinhala = step >= 3;
  return (
    <div className="relative mx-auto w-[210px]">
      <div className="overflow-hidden rounded-[30px] border-[5px] border-ict-ink-700 bg-ict-ink-900 shadow-ict-lg">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-ict-ink-700" />
        <div className="p-3">
          <div className="flex h-9 items-center gap-2 rounded-full border border-ict-border-dark bg-ict-ink-800 px-3">
            <Icon name="search" className="!text-sm text-ict-ink-300" />
            <span className="truncate text-xs text-ict-paper-50">
              {typed || <span className="text-ict-ink-400">{labels.search}</span>}
            </span>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {["8.4", "8.5", "8.6"].map((code, i) => (
              <Reveal key={code} show={step >= 1} className="" from="y">
                <div
                  className="flex items-center gap-2 rounded-ict-sm bg-ict-ink-800 px-2.5 py-2"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <span className="text-[10px] font-bold text-ict-ink-300">{code}</span>
                  <Line w={["70%", "55%", "62%"][i]} />
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-3 flex rounded-full bg-ict-ink-800 p-0.5 text-[11px] font-bold">
            <span
              className={clsx(
                "flex-1 rounded-full py-1.5 text-center transition-colors duration-[200ms] ease-ict",
                !sinhala ? "bg-ict-paper-50 text-ict-ink-900" : "text-ict-ink-300",
              )}
            >
              {labels.english}
            </span>
            <span
              className={clsx(
                "flex-1 rounded-full py-1.5 text-center transition-colors duration-[200ms] ease-ict",
                sinhala ? "bg-ict-paper-50 text-ict-ink-900" : "text-ict-ink-300",
              )}
            >
              {labels.sinhala}
            </span>
          </div>
          <div className="h-8" />
        </div>
      </div>
      <Reveal show={step >= 4} className="absolute -right-12 -bottom-5 w-[190px]">
        <div className="flex items-start gap-2 rounded-ict-md border border-ict-border-dark bg-ict-ink-800 p-2.5 shadow-ict-lg">
          <span className="grid size-7 shrink-0 place-items-center rounded-ict-sm bg-ict-orange-500 text-white">
            <Icon name="notifications_active" className="!text-sm" />
          </span>
          <span className="text-xs leading-snug font-semibold text-ict-paper-50">{labels.reminder}</span>
        </div>
      </Reveal>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function DoneScene({ active, reduced }: SceneProps) {
  const step = useSequence(active, 2, 300, reduced);
  return (
    <div className="flex flex-col items-center">
      <Reveal show={step >= 1}>
        <span className="grid size-24 place-items-center rounded-full bg-ict-orange-500 text-white shadow-ict-brand">
          <Icon name="done" className="!text-5xl" strokeWidth={2.4} />
        </span>
      </Reveal>
      <Reveal show={step >= 2} className="mt-6 flex gap-2">
        {(["videocam", "code", "schedule", "quiz"] as IconName[]).map((icon) => (
          <span
            key={icon}
            className="grid size-10 place-items-center rounded-full border border-ict-border-dark bg-ict-ink-900 text-ict-paper-50"
          >
            <Icon name={icon} className="!text-lg" />
          </span>
        ))}
      </Reveal>
    </div>
  );
}
