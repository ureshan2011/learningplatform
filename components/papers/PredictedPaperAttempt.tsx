"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PredictedPaperDisclaimer } from "@/components/papers/PredictedPaperDisclaimer";
import { track } from "@/lib/analytics";
import { Badge, Button, Card, StatusChip } from "@/components/ds";
import {
  AL_ICT_2027_PREDICTED_PAPER1,
  PREDICTED_PAPER1_DURATION_MINUTES,
  PREDICTED_PAPER1_QUESTION_COUNT,
  type PredictedMcqQuestion,
} from "@/lib/content/al-ict-2027-predicted-paper1";

type Lang = "en" | "si";
type Phase = "intro" | "attempting" | "submitted";

const DURATION_SECONDS = PREDICTED_PAPER1_DURATION_MINUTES * 60;
const BAND_LABEL: Record<PredictedMcqQuestion["confidenceBand"], { en: string; si: string }> = {
  high: { en: "High confidence", si: "ඉහළ විශ්වාසය" },
  medium: { en: "Medium confidence", si: "මධ්‍යම විශ්වාසය" },
  low: { en: "Low confidence", si: "අඩු විශ්වාසය" },
};
const BAND_TONE: Record<PredictedMcqQuestion["confidenceBand"], "success" | "warning" | "neutral"> = {
  high: "success",
  medium: "warning",
  low: "neutral",
};

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** This is a full paper attempt, not a teaser — pass a plain array to render only some questions. */
export function PredictedPaperAttempt() {
  const [lang, setLang] = useState<Lang>("en");
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const submittedRef = useRef(false);

  const answeredCount = Object.keys(answers).length;

  const submit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase("submitted");
    const correct = AL_ICT_2027_PREDICTED_PAPER1.filter((q) => answers[q.id] === q.correctIndex).length;
    track("predicted_paper_submitted", {
      paper: "al-ict-2027-predicted-paper1",
      score: correct,
      total: PREDICTED_PAPER1_QUESTION_COUNT,
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
    () => AL_ICT_2027_PREDICTED_PAPER1.filter((q) => answers[q.id] === q.correctIndex).length,
    [answers],
  );

  function start() {
    setPhase("attempting");
    track("predicted_paper_started", { paper: "al-ict-2027-predicted-paper1" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function select(questionId: number, optionIndex: number) {
    if (phase !== "attempting") return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  const low = secondsLeft <= 5 * 60;

  return (
    <div>
      <LangToggle lang={lang} onChange={setLang} />

      {phase === "intro" ? (
        <IntroScreen lang={lang} onStart={start} />
      ) : (
        <>
          <div
            className={`sticky top-0 z-20 mb-5 flex items-center justify-between gap-3 rounded-ict-card border px-4 py-3 backdrop-blur ${
              phase === "attempting" && low
                ? "border-ict-red-500/30 bg-ict-ink-900/95"
                : "border-ict-border-dark bg-ict-ink-850/95"
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-lg font-bold tabular-nums text-ict-paper-50">
              <Icon
                name="timer"
                className={`!text-xl ${phase === "attempting" && low ? "text-[#f0685a]" : "text-ict-orange-400"}`}
              />
              {phase === "attempting" ? formatClock(secondsLeft) : "—"}
            </div>
            <div className="text-sm text-ict-ink-300">
              {phase === "attempting"
                ? lang === "si"
                  ? `පිළිතුරු ${answeredCount}/${PREDICTED_PAPER1_QUESTION_COUNT}`
                  : `Answered ${answeredCount}/${PREDICTED_PAPER1_QUESTION_COUNT}`
                : lang === "si"
                  ? `ලකුණු ${score}/${PREDICTED_PAPER1_QUESTION_COUNT}`
                  : `Score ${score}/${PREDICTED_PAPER1_QUESTION_COUNT}`}
            </div>
            {phase === "attempting" ? (
              <Button size="sm" arrow="none" onClick={submit}>
                {lang === "si" ? "ඉදිරිපත් කරන්න" : "Submit"}
              </Button>
            ) : null}
          </div>

          {phase === "submitted" ? <ResultBanner lang={lang} score={score} /> : null}

          <ol className="space-y-3">
            {AL_ICT_2027_PREDICTED_PAPER1.map((q, i) => (
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
            <Button onClick={submit} arrow="none" className="mt-6 w-full justify-center">
              {lang === "si"
                ? `ඉදිරිපත් කරන්න (${answeredCount}/${PREDICTED_PAPER1_QUESTION_COUNT} පිළිතුරු දී ඇත)`
                : `Submit (${answeredCount}/${PREDICTED_PAPER1_QUESTION_COUNT} answered)`}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="mb-4 flex justify-end">
      <div className="inline-flex items-center gap-1 rounded-full bg-ict-ink-850 p-1 text-xs font-semibold">
        <button
          onClick={() => onChange("en")}
          className={`rounded-full px-3.5 py-1.5 transition-colors duration-[120ms] ${lang === "en" ? "bg-ict-orange-500 text-white" : "text-ict-ink-300 hover:text-ict-paper-50"}`}
        >
          English
        </button>
        <button
          onClick={() => onChange("si")}
          className={`rounded-full px-3.5 py-1.5 transition-colors duration-[120ms] ${lang === "si" ? "bg-ict-orange-500 text-white" : "text-ict-ink-300 hover:text-ict-paper-50"}`}
        >
          සිංහල
        </button>
      </div>
    </div>
  );
}

function IntroScreen({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  return (
    <Card radius="panel" className="p-6 sm:p-8">
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-paper-50">
        <Icon name="auto_awesome" className="text-ict-orange-400" />
        {lang === "si"
          ? "උසස් පෙළ තොරතුරු හා සන්නිවේදන තාක්ෂණය 2027 — පුරෝකථනය කළ I ප්‍රශ්න පත්‍රය"
          : "A/L ICT 2027 — Predicted Paper I (MCQ)"}
      </h1>
      <ul className="mt-4 space-y-2 text-sm text-ict-ink-300">
        <li className="flex items-center gap-2">
          <Icon name="quiz" className="!text-base text-ict-orange-400" />
          {lang === "si" ? `ප්‍රශ්න 50ක්` : `${PREDICTED_PAPER1_QUESTION_COUNT} questions`}
        </li>
        <li className="flex items-center gap-2">
          <Icon name="timer" className="!text-base text-ict-orange-400" />
          {lang === "si" ? "පැය දෙකයි — ආරම්භ කළ පසු ගණන් වැටෙයි" : "Two hours — the timer starts the moment you click Start"}
        </li>
        <li className="flex items-center gap-2">
          <Icon name="insights" className="!text-base text-ict-orange-400" />
          {lang === "si"
            ? "සෑම ප්‍රශ්නයකටම විශ්වාසය මට්ටමක් සහ එය තෝරාගත් හේතුව පෙන්වයි"
            : "Every question shows its confidence band and why it was chosen"}
        </li>
      </ul>

      <div className="mt-5">
        <PredictedPaperDisclaimer lang={lang} />
      </div>

      <Button onClick={onStart} arrow="right" className="mt-6 w-full justify-center">
        {lang === "si" ? "විභාගය අරඹන්න" : "Start the paper"}
      </Button>
    </Card>
  );
}

function ResultBanner({ lang, score }: { lang: Lang; score: number }) {
  const pct = Math.round((score / PREDICTED_PAPER1_QUESTION_COUNT) * 100);
  return (
    <Card variant="feature" radius="panel" className="mb-5 p-6 text-center">
      <p className="font-display text-4xl font-extrabold text-ict-paper-50">
        {score}/{PREDICTED_PAPER1_QUESTION_COUNT}
      </p>
      <p className="mt-1.5 text-sm text-ict-orange-200">
        {lang === "si" ? `(${pct}%) — නිවැරදි පිළිතුරු පහත දැක්වේ` : `(${pct}%) — correct answers shown below`}
      </p>
    </Card>
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
  question: PredictedMcqQuestion;
  lang: Lang;
  phase: Phase;
  selected: number | undefined;
  onSelect: (optionIndex: number) => void;
}) {
  const t = question[lang];
  const isSubmitted = phase === "submitted";
  const isCorrectOverall = selected === question.correctIndex;
  const band = BAND_LABEL[question.confidenceBand];

  return (
    <li>
      <Card id={`pq${question.id}`} radius="card" className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold text-ict-paper-50">
            <span className="text-ict-ink-300">{index}.</span> {t.stem}
          </p>
          {isSubmitted ? (
            <StatusChip tone={isCorrectOverall ? "success" : selected === undefined ? "neutral" : "danger"}>
              {isCorrectOverall ? "Correct" : selected === undefined ? (lang === "si" ? "දුන්නේ නැත" : "Skipped") : "Wrong"}
            </StatusChip>
          ) : null}
        </div>

        {question.code ? (
          <pre className="mt-2.5 overflow-x-auto rounded-ict-md bg-ict-ink-900 p-3 font-mono text-xs whitespace-pre text-ict-paper-50">
            {question.code}
          </pre>
        ) : null}

        <div className="mt-3.5 space-y-2">
          {t.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === question.correctIndex;
            let stateClass = "border-ict-border-dark bg-ict-ink-800";
            let badgeClass = "bg-ict-ink-700 text-ict-ink-300";
            if (isSubmitted) {
              if (isCorrect) {
                stateClass = "border-ict-green-500/50 bg-ict-green-500/10";
                badgeClass = "bg-ict-green-500 text-white";
              } else if (isSelected) {
                stateClass = "border-ict-red-500/50 bg-ict-red-500/10";
              }
            } else if (isSelected) {
              stateClass = "border-ict-orange-500/60 bg-ict-orange-500/10";
              badgeClass = "bg-ict-orange-500 text-white";
            }
            return (
              <button
                key={i}
                type="button"
                disabled={isSubmitted}
                onClick={() => onSelect(i)}
                className={`ict-press flex w-full items-start gap-2.5 rounded-ict-md border px-3.5 py-2.5 text-left text-sm text-ict-paper-50 transition-colors duration-[120ms] disabled:cursor-default ${stateClass}`}
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${badgeClass}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">{opt}</span>
                {isSubmitted && isCorrect ? (
                  <Icon name="check_circle" className="!text-base shrink-0 text-ict-green-500" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-ict-border-dark pt-3 text-xs text-ict-ink-300">
          <Badge tone={BAND_TONE[question.confidenceBand]}>{band[lang]}</Badge>
          <span>
            {question.topic} — {question.rationale}
          </span>
        </div>
      </Card>
    </li>
  );
}
