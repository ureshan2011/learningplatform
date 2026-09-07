"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { Icon } from "@/components/ui/Icon";
import { Badge, Button, ButtonLink, Card } from "@/components/ds-cream";
import { DisclaimerNote } from "@/components/papers/DisclaimerNote";
import { track } from "@/lib/analytics";
import {
  AL_ICT_2026_PAPER1,
  PAPER_DURATION_MINUTES,
  PAPER_QUESTION_COUNT,
  type McqQuestion,
} from "@/lib/content/al-ict-2026-paper1";

type Lang = "en" | "si";
type Phase = "intro" | "attempting" | "submitted";

const DURATION_SECONDS = PAPER_DURATION_MINUTES * 60;

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Q40's options carry literal code blocks; render those on their own lines. */
function OptionText({ text }: { text: string }) {
  if (!text.includes("\\n")) return <>{text}</>;
  return (
    <pre className="mt-1 overflow-x-auto rounded-ict-sm bg-ict-paper-100 p-2 font-mono text-xs whitespace-pre">
      {text.split("\\n").join("\n")}
    </pre>
  );
}

export function PaperAttempt() {
  const [lang, setLang] = useState<Lang>("si");
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const submittedRef = useRef(false);

  const answeredCount = Object.keys(answers).length;

  const submit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase("submitted");
    const correct = AL_ICT_2026_PAPER1.filter((q) => answers[q.id] === q.correctIndex).length;
    track("mock_paper_submitted", {
      paper: "al-ict-2026-paper1",
      score: correct,
      total: PAPER_QUESTION_COUNT,
      answered: answeredCount,
      timed_out: secondsLeft <= 0,
    });
  }, [answers, answeredCount, secondsLeft]);

  useEffect(() => {
    if (phase !== "attempting") return;
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          submit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, submit]);

  const score = useMemo(
    () => AL_ICT_2026_PAPER1.filter((q) => answers[q.id] === q.correctIndex).length,
    [answers],
  );

  function start() {
    setPhase("attempting");
    track("mock_paper_started", { paper: "al-ict-2026-paper1" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function select(questionId: number, optionIndex: number) {
    if (phase !== "attempting") return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  const low = secondsLeft <= 5 * 60;

  return (
    <div className="bg-ict-paper-100">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <LangToggle lang={lang} onChange={setLang} />

        {phase === "intro" ? (
          <IntroScreen lang={lang} onStart={start} />
        ) : (
          <>
            <div
              className={clsx(
                "sticky top-0 z-20 -mx-5 mb-6 flex items-center justify-between gap-3 border-b px-5 py-3 backdrop-blur",
                phase === "attempting" && low
                  ? "border-ict-red-500/30 bg-ict-red-50/95"
                  : "border-ict-paper-300 bg-ict-paper-100/95",
              )}
            >
              <div className="flex items-center gap-2 font-mono text-lg font-bold tabular-nums text-ict-ink-900">
                <Icon
                  name="timer"
                  className={clsx("!text-xl", phase === "attempting" && low ? "text-ict-red-500" : "text-ict-orange-500")}
                />
                {phase === "attempting" ? formatClock(secondsLeft) : "—"}
              </div>
              <div className="text-sm text-ict-ink-400">
                {phase === "attempting"
                  ? lang === "si"
                    ? `පිළිතුරු ${answeredCount}/${PAPER_QUESTION_COUNT}`
                    : `Answered ${answeredCount}/${PAPER_QUESTION_COUNT}`
                  : lang === "si"
                    ? `ලකුණු ${score}/${PAPER_QUESTION_COUNT}`
                    : `Score ${score}/${PAPER_QUESTION_COUNT}`}
              </div>
              {phase === "attempting" ? (
                <Button onClick={submit} size="sm" arrow="none">
                  {lang === "si" ? "ඉදිරිපත් කරන්න" : "Submit"}
                </Button>
              ) : null}
            </div>

            {phase === "submitted" ? <ResultBanner lang={lang} score={score} /> : null}

            <ol className="space-y-6">
              {AL_ICT_2026_PAPER1.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  index={i + 1}
                  question={q}
                  lang={lang}
                  phase={phase}
                  selected={answers[q.id]}
                  onSelect={(optionIndex) => select(q.id, optionIndex)}
                />
              ))}
            </ol>

            {phase === "attempting" ? (
              <Button onClick={submit} size="lg" arrow="none" className="mt-8 w-full justify-center">
                {lang === "si"
                  ? `ඉදිරිපත් කරන්න (${answeredCount}/${PAPER_QUESTION_COUNT} පිළිතුරු දී ඇත)`
                  : `Submit (${answeredCount}/${PAPER_QUESTION_COUNT} answered)`}
              </Button>
            ) : (
              <Card radius="card" className="mt-8 flex flex-wrap items-center justify-between gap-3 p-5">
                <p className="text-sm text-ict-ink-400">
                  {lang === "si"
                    ? "වැඩිදුර පුහුණුව අවශ්‍යද? සජීවී පන්තියක් සමඟ ගුරුවරයාගෙන් සෘජුව ඉගෙන ගන්න."
                    : "Want more practice like this? Learn live with a teacher who marks your work."}
                </p>
                <ButtonLink href="/signin" variant="secondary" size="md" className="shrink-0">
                  {lang === "si" ? "නොමිලේ අත්හදා බලන්න" : "Start free trial"}
                </ButtonLink>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="mb-4 flex justify-end">
      <div className="inline-flex rounded-full border border-ict-paper-300 bg-ict-paper-0 p-1 text-xs font-semibold shadow-ict-xs">
        <button
          onClick={() => onChange("si")}
          className={clsx(
            "ict-press rounded-full px-3 py-1.5 transition-colors duration-[120ms]",
            lang === "si" ? "bg-ict-orange-500 text-white" : "text-ict-ink-400",
          )}
        >
          සිංහල
        </button>
        <button
          onClick={() => onChange("en")}
          className={clsx(
            "ict-press rounded-full px-3 py-1.5 transition-colors duration-[120ms]",
            lang === "en" ? "bg-ict-orange-500 text-white" : "text-ict-ink-400",
          )}
        >
          English
        </button>
      </div>
    </div>
  );
}

function IntroScreen({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  const replacedCount = AL_ICT_2026_PAPER1.filter((q) => q.replaced).length;
  return (
    <Card radius="card" className="p-6">
      <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-ink-900">
        <Icon name="quiz" className="text-ict-orange-500" />
        {lang === "si"
          ? "උසස් පෙළ තොරතුරු හා සන්නිවේදන තාක්ෂණය 2026 — I ප්‍රශ්න පත්‍රය"
          : "A/L ICT 2026 — Paper I (MCQ)"}
      </h1>
      <ul className="mt-4 space-y-2 text-sm text-ict-ink-400">
        <li className="flex items-center gap-2">
          <Icon name="quiz" className="!text-base text-ict-orange-500" />
          {lang === "si" ? `ප්‍රශ්න 50ක්` : `${PAPER_QUESTION_COUNT} questions`}
        </li>
        <li className="flex items-center gap-2">
          <Icon name="timer" className="!text-base text-ict-orange-500" />
          {lang === "si" ? "පැය දෙකයි — ආරම්භ කළ පසු ගණන් වැටෙයි" : "Two hours — the timer starts the moment you click Start"}
        </li>
        <li className="flex items-center gap-2">
          <Icon name="lock_open" className="!text-base text-ict-orange-500" />
          {lang === "si" ? "ලියාපදිංචි වීමක් අවශ්‍ය නොවේ, නොමිලේ" : "No sign-in required, completely free"}
        </li>
        <li className="flex items-center gap-2">
          <Icon name="check_circle" className="!text-base text-ict-orange-500" />
          {lang === "si" ? "ඉදිරිපත් කළ පසු නිවැරදි පිළිතුරු වහාම පෙන්වයි" : "Correct answers revealed instantly on submit"}
        </li>
      </ul>

      <div className="mt-4">
        <DisclaimerNote lang={lang} replacedCount={replacedCount} />
      </div>

      <Button onClick={onStart} size="lg" className="mt-6 w-full justify-center">
        {lang === "si" ? "විභාගය අරඹන්න" : "Start the paper"}
      </Button>
    </Card>
  );
}

function ResultBanner({ lang, score }: { lang: Lang; score: number }) {
  const pct = Math.round((score / PAPER_QUESTION_COUNT) * 100);
  return (
    <div className="mb-6 rounded-ict-card border border-ict-green-500/30 bg-ict-green-50 p-5 text-center">
      <p className="font-display text-3xl font-extrabold text-ict-green-500">
        {score}/{PAPER_QUESTION_COUNT}
      </p>
      <p className="mt-1 text-sm text-ict-ink-400">
        {lang === "si" ? `(${pct}%) — නිවැරදි පිළිතුරු පහත දැක්වේ` : `(${pct}%) — correct answers shown below`}
      </p>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  lang,
  phase,
  selected,
  onSelect,
}: {
  index: number;
  question: McqQuestion;
  lang: Lang;
  phase: Phase;
  selected: number | undefined;
  onSelect: (optionIndex: number) => void;
}) {
  const t = question[lang];
  const isSubmitted = phase === "submitted";
  const isCorrectOverall = selected === question.correctIndex;

  return (
    <li id={`q${question.id}`} className="rounded-ict-card border border-ict-paper-300 bg-ict-paper-0 p-5 shadow-ict-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-ict-ink-900">
          <span className="text-ict-ink-400">{index}.</span> {t.stem}
        </p>
        {isSubmitted ? (
          <Badge tone={isCorrectOverall ? "success" : selected === undefined ? "neutral" : "danger"} className="shrink-0">
            {isCorrectOverall ? "Correct" : selected === undefined ? (lang === "si" ? "දුන්නේ නැත" : "Skipped") : "Wrong"}
          </Badge>
        ) : null}
      </div>

      {question.replaced ? (
        <p className="mt-1 text-xs text-ict-ink-400 italic">
          {lang === "si" ? "* ප්‍රතිස්ථාපිත ප්‍රශ්නයකි — හැඳින්වීම බලන්න." : "* Replacement question — see the note above."}
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        {t.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === question.correctIndex;
          let stateClass = "border-ict-paper-300";
          if (isSubmitted) {
            if (isCorrect) stateClass = "border-ict-green-500 bg-ict-green-50";
            else if (isSelected) stateClass = "border-ict-red-500 bg-ict-red-50";
          } else if (isSelected) {
            stateClass = "border-ict-orange-500 bg-ict-orange-50";
          }
          return (
            <button
              key={i}
              type="button"
              disabled={isSubmitted}
              onClick={() => onSelect(i)}
              className={clsx(
                "ict-press flex w-full items-start gap-2.5 rounded-ict-md border px-3.5 py-2.5 text-left text-sm text-ict-ink-900 transition-colors duration-[120ms] disabled:cursor-default",
                stateClass,
              )}
            >
              <span
                className={clsx(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                  isSubmitted && isCorrect
                    ? "border-ict-green-500 bg-ict-green-500 text-white"
                    : isSelected
                      ? "border-ict-orange-500 bg-ict-orange-500 text-white"
                      : "border-ict-paper-300 text-ict-ink-400",
                )}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <OptionText text={opt} />
              </span>
              {isSubmitted && isCorrect ? (
                <Icon name="check_circle" className="!text-base shrink-0 text-ict-green-500" />
              ) : null}
            </button>
          );
        })}
      </div>
    </li>
  );
}
