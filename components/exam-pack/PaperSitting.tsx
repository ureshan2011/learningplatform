"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { fetchWithSession } from "@/lib/auth/session-client";
import { track } from "@/lib/analytics";
import { Badge, Button, Card, Notice, ProgressBar, StatusChip } from "@/components/ds";
import { Icon } from "@/components/ui/Icon";
import { weakestTopics } from "@/lib/exam-pack/scoring";
import { CodeBlock, OptionBadge } from "@/components/exam-pack/parts";
import type { Bilingual, PaperId } from "@/lib/exam-pack/config";
import type { ReviewQuestion, SittingQuestion, SittingResult, SittingStart } from "@/lib/exam-pack/paper-types";

type Lang = "en" | "si";
type Phase = "intro" | "loading" | "attempting" | "submitting" | "result";
type Filter = "all" | "wrong" | "skipped" | "correct";

/** The screen's own words. The language toggle switches these and the questions together. */
const T = {
  questions: { en: "{n} questions", si: "ප්‍රශ්න {n}යි" },
  time: { en: "{n} minutes — the clock runs on our server, so a reload does not reset it", si: "විනාඩි {n}යි — clock එක server එකේ, reload කළාට reset වෙන්නේ නෑ" },
  noNegative: { en: "No negative marking — answer every question", si: "වැරදි answer වලට marks කපන්නේ නෑ — හැම ප්‍රශ්නයකටම answer කරන්න" },
  ranked: { en: "Your first sitting is ranked against every Exam Pack student", si: "ඔයාගේ පළවෙනි sitting එක හැම Exam Pack student කෙනෙක් එක්කම rank කරනවා" },
  saved: { en: "Answers save as you go — switch phones and carry on", si: "Answers save වෙනවා — phone එක මාරු කළත් දිගටම කරන්න පුළුවන්" },
  start: { en: "Start the paper", si: "Paper එක පටන් ගන්න" },
  resume: { en: "Carry on — your clock is still running", si: "දිගටම කරන්න — clock එක තාම යනවා" },
  answered: { en: "Answered {a}/{n}", si: "Answer කළා {a}/{n}" },
  submit: { en: "Submit", si: "Submit" },
  confirm: { en: "{n} left blank — tap again to submit", si: "{n}ක් හිස් — submit කරන්න ආපහු tap කරන්න" },
  submitting: { en: "Marking…", si: "Marks දානවා…" },
  failed: { en: "Could not reach the server. Your answers are saved — try again.", si: "Server එකට යන්න බැරි වුණා. Answers save වෙලා — ආපහු try කරන්න." },
  timeUp: { en: "Time is up — marking your paper.", si: "වෙලාව ඉවරයි — paper එකට marks දානවා." },
  score: { en: "{s} out of {n}", si: "{n}න් {s}" },
  rank: { en: "Rank {r} of {t} Exam Pack students", si: "Exam Pack students {t}න් rank {r}" },
  better: { en: "Better than {p}% of them", si: "ඒ අයගෙන් {p}%කට වඩා හොඳයි" },
  firstSitter: { en: "You are the first to sit this paper — others will be ranked against you.", si: "මේ paper එක කරපු පළවෙනි කෙනා ඔයා — අනිත් අය rank වෙන්නේ ඔයා එක්ක." },
  late: { en: "Your submit arrived after the time was up, so the answers saved inside the two hours were marked.", si: "Submit එක ආවේ වෙලාව ඉවර වුණාට පස්සේ, ඒ නිසා වෙලාව ඇතුළත save වුණ answers වලට marks දුන්නා." },
  revise: { en: "Revise these first", si: "මුලින්ම මේවා revise කරන්න" },
  allRight: { en: "Every topic right. Sit the other paper next.", si: "හැම topic එකක්ම හරි. ඊළඟට අනිත් paper එක කරන්න." },
  filterAll: { en: "All", si: "ඔක්කොම" },
  filterWrong: { en: "Wrong", si: "වැරදි" },
  filterSkipped: { en: "Skipped", si: "හිස්" },
  filterCorrect: { en: "Correct", si: "හරි" },
  correct: { en: "Correct", si: "හරි" },
  wrong: { en: "Wrong", si: "වැරදි" },
  skipped: { en: "Skipped", si: "හිස්" },
  walkthrough: { en: "Walkthrough", si: "Walkthrough" },
  why: { en: "Why it is here", si: "මේක තියෙන්නේ ඇයි" },
  printAnswers: { en: "Print the answers", si: "Answers print කරන්න" },
  nothing: { en: "Nothing here.", si: "මෙතන කිසිම දෙයක් නෑ." },
} satisfies Record<string, Bilingual>;

function say(key: keyof typeof T, lang: Lang, vars: Record<string, string | number> = {}): string {
  return T[key][lang].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

function clock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Autosave this long after the last change — often enough to lose little, rarely enough to cost little. */
const SAVE_DEBOUNCE_MS = 5000;

/**
 * A timed, server-scored sitting of one Exam Pack paper, and its review.
 *
 * The questions arrive without their key; the key arrives with the result,
 * after the server has locked the sitting. The clock is the server's: the
 * deadline is computed from the server's start time and the server's "now", so
 * a phone with the wrong time cannot give itself an extra hour.
 */
export function PaperSitting({
  paperId,
  title,
  durationMinutes,
  questionCount,
  kind,
  defaultLang,
  inProgress,
  initialResult,
  disclaimer,
}: {
  paperId: PaperId;
  title: Bilingual;
  durationMinutes: number;
  questionCount: number;
  kind: "predicted" | "past";
  defaultLang: Lang;
  /** A sitting already started on this or another device. */
  inProgress: boolean;
  initialResult: SittingResult | null;
  /** Rendered under the intro — the predicted paper's framing statement. */
  disclaimer?: React.ReactNode;
}) {
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [phase, setPhase] = useState<Phase>(initialResult ? "result" : "intro");
  const [questions, setQuestions] = useState<SittingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [deadline, setDeadline] = useState(0);
  const [offset, setOffset] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SittingResult | null>(initialResult);

  const answersRef = useRef(answers);
  const dirty = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);
  const submitted = useRef(false);
  const lastAutoSubmit = useRef(0);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const save = useCallback(
    async (keepalive = false) => {
      if (!dirty.current || submitted.current) return;
      dirty.current = false;
      try {
        await fetchWithSession(`/api/exam-pack/sittings/${paperId}/save`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ answers: answersRef.current }),
          keepalive,
        });
      } catch {
        // Offline for a moment; the next change, or the submit, carries them.
        dirty.current = true;
      }
    },
    [paperId],
  );

  const submit = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    window.clearTimeout(saveTimer.current);
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetchWithSession(`/api/exam-pack/sittings/${paperId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as SittingResult;
      setResult(data);
      setPhase("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
      track("exam_pack_paper_submitted", {
        paper: paperId,
        score: data.correctCount,
        total: data.totalQuestions,
        rank: data.rank,
      });
    } catch {
      submitted.current = false;
      setPhase("attempting");
      setError(say("failed", lang));
    }
  }, [lang, paperId]);

  async function start() {
    setPhase("loading");
    setError(null);
    try {
      const res = await fetchWithSession(`/api/exam-pack/sittings/${paperId}/start`, { method: "POST" });
      if (res.status === 409) {
        // Locked elsewhere — on another phone, or the time ran out. Show the result.
        window.location.reload();
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as SittingStart & { now: number };
      const clientNow = Date.now();
      setOffset(data.now - clientNow);
      setDeadline(data.startedAt + data.durationMinutes * 60 * 1000);
      setQuestions(data.questions);
      setAnswers(data.answers ?? {});
      setPhase("attempting");
      window.scrollTo({ top: 0, behavior: "smooth" });
      track("exam_pack_paper_started", { paper: paperId, resumed: inProgress });
    } catch {
      setPhase("intro");
      setError(say("failed", lang));
    }
  }

  // The countdown, from the server's deadline and the server's clock.
  useEffect(() => {
    if (phase !== "attempting") return;
    const tick = () => {
      const left = Math.round((deadline - (Date.now() + offset)) / 1000);
      setSecondsLeft(Math.max(0, left));
      // At zero the paper submits itself. If that fails (no signal), it tries
      // again every ten seconds rather than every tick — the server marks the
      // answers saved inside the time whenever the submit finally lands.
      if (left <= 0 && Date.now() - lastAutoSubmit.current > 10_000) {
        lastAutoSubmit.current = Date.now();
        void submit();
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, offset, phase, submit]);

  // Save when the tab is hidden — the moment a phone is most likely to be put away or killed.
  useEffect(() => {
    if (phase !== "attempting") return;
    const onHide = () => {
      if (document.visibilityState === "hidden") void save(true);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [phase, save]);

  function choose(questionId: number, option: number) {
    if (phase !== "attempting") return;
    setConfirming(false);
    setAnswers((prev) => ({ ...prev, [String(questionId)]: option }));
    dirty.current = true;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void save(), SAVE_DEBOUNCE_MS);
  }

  const answeredCount = Object.keys(answers).length;
  const blank = questions.length - answeredCount;

  function onSubmitClick() {
    if (blank > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    void submit();
  }

  const toggle = <LangToggle lang={lang} onChange={setLang} />;

  if (phase === "result" && result) {
    return (
      <div>
        {toggle}
        <Result result={result} lang={lang} paperId={paperId} />
      </div>
    );
  }

  if (phase === "intro" || phase === "loading") {
    return (
      <div>
        {toggle}
        <Card radius="panel" className="p-6 sm:p-8">
          <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-ict-fg sm:text-2xl">
            {title[lang]}
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-ict-fg-soft">
            {(
              [
                ["quiz", say("questions", lang, { n: questionCount })],
                ["timer", say("time", lang, { n: durationMinutes })],
                ["check_circle", say("noNegative", lang)],
                ["military_tech", say("ranked", lang)],
                ["save", say("saved", lang)],
              ] as const
            ).map(([icon, text]) => (
              <li key={icon} className="flex items-start gap-2.5">
                <Icon name={icon} className="mt-0.5 !text-base shrink-0 text-ict-accent-fg" />
                {text}
              </li>
            ))}
          </ul>
          {disclaimer && kind === "predicted" ? <div className="mt-5">{disclaimer}</div> : null}
          <Button onClick={start} disabled={phase === "loading"} className="mt-6 w-full justify-center">
            {phase === "loading" ? "…" : inProgress ? say("resume", lang) : say("start", lang)}
          </Button>
          {error ? <Notice tone="danger" className="mt-3">{error}</Notice> : null}
        </Card>
      </div>
    );
  }

  const low = secondsLeft <= 5 * 60;

  return (
    <div>
      {toggle}
      <div
        className={clsx(
          "sticky top-0 z-20 mb-4 flex items-center justify-between gap-3 rounded-ict-card border px-4 py-3 backdrop-blur",
          low ? "border-ict-red-500/40 bg-ict-surface-card/95" : "border-ict-line bg-ict-surface-card/95",
        )}
      >
        <span className="flex items-center gap-2 font-mono text-lg font-bold tabular-nums text-ict-fg">
          <Icon name="timer" className={clsx("!text-xl", low ? "text-ict-danger-fg" : "text-ict-accent-fg")} />
          {clock(secondsLeft)}
        </span>
        <span className="text-sm text-ict-fg-soft">
          {say("answered", lang, { a: answeredCount, n: questions.length })}
        </span>
        <Button size="sm" arrow="none" onClick={onSubmitClick} disabled={phase === "submitting"}>
          {phase === "submitting" ? say("submitting", lang) : say("submit", lang)}
        </Button>
      </div>

      {secondsLeft === 0 ? <Notice tone="info" className="mb-3">{say("timeUp", lang)}</Notice> : null}
      {error ? <Notice tone="danger" className="mb-3">{error}</Notice> : null}

      <ol className="space-y-3">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i + 1}
            question={q}
            lang={lang}
            selected={answers[String(q.id)]}
            onSelect={(option) => choose(q.id, option)}
          />
        ))}
      </ol>

      <Button
        onClick={onSubmitClick}
        arrow="none"
        disabled={phase === "submitting"}
        className="mt-6 w-full justify-center"
      >
        {phase === "submitting"
          ? say("submitting", lang)
          : confirming
            ? say("confirm", lang, { n: blank })
            : `${say("submit", lang)} · ${say("answered", lang, { a: answeredCount, n: questions.length })}`}
      </Button>
    </div>
  );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="mb-4 flex justify-end">
      <div className="inline-flex items-center gap-1 rounded-full bg-ict-surface-raised p-1 text-xs font-semibold">
        {(["en", "si"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            className={clsx(
              "rounded-full px-3.5 py-1.5 transition-colors duration-[120ms]",
              lang === l ? "bg-ict-orange-500 text-white" : "text-ict-fg-soft hover:text-ict-fg",
            )}
          >
            {l === "en" ? "English" : "සිංහල"}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  lang,
  selected,
  onSelect,
}: {
  index: number;
  question: SittingQuestion;
  lang: Lang;
  selected: number | undefined;
  onSelect: (option: number) => void;
}) {
  const text = question[lang];
  return (
    <li>
      <Card radius="card" className="p-5">
        <p className="font-semibold text-ict-fg">
          <span className="text-ict-fg-soft">{index}.</span> {text.stem}
        </p>
        {question.code ? <CodeBlock code={question.code} /> : null}
        <div className="mt-3.5 space-y-2">
          {text.options.map((option, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className={clsx(
                "ict-press flex w-full items-start gap-2.5 rounded-ict-md border px-3.5 py-2.5 text-left text-sm text-ict-fg transition-colors duration-[120ms]",
                selected === i ? "border-ict-orange-500/60 bg-ict-orange-500/10" : "border-ict-line bg-ict-surface-raised",
              )}
            >
              <OptionBadge n={i + 1} tone={selected === i ? "chosen" : "plain"} />
              <span className="min-w-0 flex-1">{option}</span>
            </button>
          ))}
        </div>
      </Card>
    </li>
  );
}

function Result({ result, lang, paperId }: { result: SittingResult; lang: Lang; paperId: PaperId }) {
  const [filter, setFilter] = useState<Filter>("all");
  const pct = Math.round((result.correctCount / Math.max(1, result.totalQuestions)) * 100);
  const weak = useMemo(() => weakestTopics(result.topicBreakdown, 4), [result.topicBreakdown]);

  const shown = result.questions.filter((q) => {
    if (filter === "all") return true;
    if (filter === "skipped") return q.yourChoice === undefined;
    if (filter === "correct") return q.yourChoice === q.correctIndex;
    return q.yourChoice !== undefined && q.yourChoice !== q.correctIndex;
  });

  return (
    <div className="space-y-4">
      <Card variant="feature" radius="panel" className="p-6 text-center sm:p-8">
        <p className="font-display text-5xl font-extrabold tracking-[-0.03em]">
          {result.correctCount}
          <span className="text-2xl opacity-70">/{result.totalQuestions}</span>
        </p>
        <p className="mt-1 text-sm opacity-80">{pct}%</p>
        <p className="mt-4 font-semibold">
          {result.totalSittings <= 1
            ? say("firstSitter", lang)
            : say("rank", lang, { r: result.rank, t: result.totalSittings })}
        </p>
        {result.totalSittings > 1 ? (
          <p className="mt-1 text-sm opacity-80">{say("better", lang, { p: result.percentile })}</p>
        ) : null}
      </Card>

      {result.late ? <Notice tone="info">{say("late", lang)}</Notice> : null}

      <Card radius="card" className="p-5">
        <p className="font-display text-base font-bold text-ict-fg">{say("revise", lang)}</p>
        {weak.length === 0 ? (
          <p className="mt-2 text-sm text-ict-fg-soft">{say("allRight", lang)}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {weak.map((t) => (
              <li key={t.topic}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-ict-fg">{t.topic}</span>
                  <span className="shrink-0 tabular-nums text-ict-fg-soft">
                    {t.correct}/{t.total}
                  </span>
                </div>
                <ProgressBar value={(t.correct / t.total) * 100} showLabel={false} className="mt-1.5" />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "filterAll"],
              ["wrong", "filterWrong"],
              ["skipped", "filterSkipped"],
              ["correct", "filterCorrect"],
            ] as const
          ).map(([value, key]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={clsx(
                "h-[30px] rounded-full px-3 text-xs font-semibold transition-colors duration-[120ms]",
                filter === value ? "bg-ict-orange-500 text-white" : "bg-ict-surface-raised text-ict-fg",
              )}
            >
              {say(key, lang)}
            </button>
          ))}
        </div>
        <Link
          href={`/exam-pack/print/${paperId}-answers${lang === "si" ? "?lang=si" : ""}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ict-fg-soft hover:text-ict-accent-fg"
        >
          <Icon name="print" className="!text-base" />
          {say("printAnswers", lang)}
        </Link>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-ict-fg-soft">{say("nothing", lang)}</p>
      ) : (
        <ol className="space-y-3">
          {shown.map((q) => (
            <ReviewCard key={q.id} index={result.questions.indexOf(q) + 1} question={q} lang={lang} />
          ))}
        </ol>
      )}
    </div>
  );
}

export function ReviewCard({
  index,
  question,
  lang,
  showStatus = true,
}: {
  index: number;
  question: ReviewQuestion;
  lang: Lang;
  showStatus?: boolean;
}) {
  const text = question[lang];
  const choice = question.yourChoice;
  const status =
    choice === undefined ? "skipped" : choice === question.correctIndex ? "correct" : "wrong";

  return (
    <li>
      <Card radius="card" className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold text-ict-fg">
            <span className="text-ict-fg-soft">{index}.</span> {text.stem}
          </p>
          {showStatus ? (
            <StatusChip
              tone={status === "correct" ? "success" : status === "wrong" ? "danger" : "neutral"}
              className="shrink-0"
            >
              {say(status, lang)}
            </StatusChip>
          ) : null}
        </div>
        {question.code ? <CodeBlock code={question.code} /> : null}
        <div className="mt-3.5 space-y-2">
          {text.options.map((option, i) => {
            const right = i === question.correctIndex;
            const mine = i === choice;
            return (
              <div
                key={i}
                className={clsx(
                  "flex items-start gap-2.5 rounded-ict-md border px-3.5 py-2.5 text-sm text-ict-fg",
                  right
                    ? "border-ict-green-500/50 bg-ict-green-500/10"
                    : mine
                      ? "border-ict-red-500/50 bg-ict-red-500/10"
                      : "border-ict-line bg-ict-surface-raised",
                )}
              >
                <OptionBadge n={i + 1} tone={right ? "right" : mine ? "chosen" : "plain"} />
                <span className="min-w-0 flex-1">{option}</span>
                {right ? <Icon name="check_circle" className="!text-base shrink-0 text-ict-green-500" /> : null}
              </div>
            );
          })}
        </div>
        {question.walkthrough ? (
          <div className="mt-3.5 rounded-ict-md border border-ict-line bg-ict-surface-sunken p-3.5 text-sm text-ict-fg">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-ict-accent-fg">
              <Icon name="fact_check" className="!text-sm" />
              {say("walkthrough", lang)}
            </p>
            <p className="leading-relaxed">{question.walkthrough}</p>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ict-fg-soft">
          <Badge tone="neutral">{question.topic}</Badge>
          {question.note ? <span className="min-w-0">{question.note}</span> : null}
        </div>
      </Card>
    </li>
  );
}
