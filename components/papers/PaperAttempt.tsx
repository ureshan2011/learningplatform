"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
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
    <pre className="mt-1 overflow-x-auto rounded-md bg-(--color-awaken-bg) p-2 font-mono text-xs whitespace-pre">
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
    <div className="mx-auto max-w-3xl px-5 py-8">
      <LangToggle lang={lang} onChange={setLang} />

      {phase === "intro" ? (
        <IntroScreen lang={lang} onStart={start} />
      ) : (
        <>
          <div
            className={`sticky top-0 z-20 -mx-5 mb-6 flex items-center justify-between gap-3 border-b px-5 py-3 backdrop-blur ${
              phase === "attempting" && low
                ? "border-(--color-awaken-danger)/30 bg-(--color-awaken-danger-soft)/95"
                : "border-(--color-awaken-line) bg-(--color-awaken-bg)/95"
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-lg font-bold tabular-nums">
              <Icon
                name="timer"
                className={`!text-xl ${phase === "attempting" && low ? "text-(--color-awaken-danger)" : "text-(--color-awaken-accent)"}`}
              />
              {phase === "attempting" ? formatClock(secondsLeft) : "—"}
            </div>
            <div className="text-sm text-(--color-awaken-ink-soft)">
              {phase === "attempting"
                ? lang === "si"
                  ? `පිළිතුරු ${answeredCount}/${PAPER_QUESTION_COUNT}`
                  : `Answered ${answeredCount}/${PAPER_QUESTION_COUNT}`
                : lang === "si"
                  ? `ලකුණු ${score}/${PAPER_QUESTION_COUNT}`
                  : `Score ${score}/${PAPER_QUESTION_COUNT}`}
            </div>
            {phase === "attempting" ? (
              <button
                onClick={submit}
                className="rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 text-sm font-semibold text-white"
              >
                {lang === "si" ? "ඉදිරිපත් කරන්න" : "Submit"}
              </button>
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
            <button
              onClick={submit}
              className="mt-8 w-full rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-3 font-semibold text-white"
            >
              {lang === "si"
                ? `ඉදිරිපත් කරන්න (${answeredCount}/${PAPER_QUESTION_COUNT} පිළිතුරු දී ඇත)`
                : `Submit (${answeredCount}/${PAPER_QUESTION_COUNT} answered)`}
            </button>
          ) : (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5">
              <p className="text-sm text-(--color-awaken-ink-soft)">
                {lang === "si"
                  ? "වැඩිදුර පුහුණුව අවශ්‍යද? සජීවී පන්තියක් සමඟ ගුරුවරයාගෙන් සෘජුව ඉගෙන ගන්න."
                  : "Want more practice like this? Learn live with a teacher who marks your work."}
              </p>
              <Link
                href="/signin"
                className="shrink-0 rounded-lg bg-(--color-awaken-deep) px-5 py-2.5 text-sm font-semibold text-white"
              >
                {lang === "si" ? "නොමිලේ අත්හදා බලන්න" : "Start free trial"}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="mb-4 flex justify-end">
      <div className="inline-flex rounded-full border border-(--color-awaken-line) bg-(--color-awaken-card) p-1 text-xs font-semibold">
        <button
          onClick={() => onChange("si")}
          className={`rounded-full px-3 py-1.5 ${lang === "si" ? "bg-(--color-awaken-accent) text-white" : "text-(--color-awaken-ink-soft)"}`}
        >
          සිංහල
        </button>
        <button
          onClick={() => onChange("en")}
          className={`rounded-full px-3 py-1.5 ${lang === "en" ? "bg-(--color-awaken-accent) text-white" : "text-(--color-awaken-ink-soft)"}`}
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
    <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Icon name="quiz" className="text-(--color-awaken-accent)" />
        {lang === "si"
          ? "උසස් පෙළ තොරතුරු හා සන්නිවේදන තාක්ෂණය 2026 — I ප්‍රශ්න පත්‍රය"
          : "A/L ICT 2026 — Paper I (MCQ)"}
      </h1>
      <ul className="mt-4 space-y-2 text-sm text-(--color-awaken-ink-soft)">
        <li className="flex items-center gap-2">
          <Icon name="quiz" className="!text-base text-(--color-awaken-accent)" />
          {lang === "si" ? `ප්‍රශ්න 50ක්` : `${PAPER_QUESTION_COUNT} questions`}
        </li>
        <li className="flex items-center gap-2">
          <Icon name="timer" className="!text-base text-(--color-awaken-accent)" />
          {lang === "si" ? "පැය දෙකයි — ආරම්භ කළ පසු ගණන් වැටෙයි" : "Two hours — the timer starts the moment you click Start"}
        </li>
        <li className="flex items-center gap-2">
          <Icon name="lock_open" className="!text-base text-(--color-awaken-accent)" />
          {lang === "si" ? "ලියාපදිංචි වීමක් අවශ්‍ය නොවේ, නොමිලේ" : "No sign-in required, completely free"}
        </li>
        <li className="flex items-center gap-2">
          <Icon name="check_circle" className="!text-base text-(--color-awaken-accent)" />
          {lang === "si" ? "ඉදිරිපත් කළ පසු නිවැරදි පිළිතුරු වහාම පෙන්වයි" : "Correct answers revealed instantly on submit"}
        </li>
      </ul>

      <div className="mt-5 rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) p-4 text-xs text-(--color-awaken-ink-soft)">
        <p className="flex items-start gap-1.5">
          <Icon name="info" className="!text-base shrink-0 text-(--color-awaken-accent)" />
          {lang === "si"
            ? `මෙම ප්‍රශ්න පත්‍රයේ සියලුම පිළිතුරු ස්වාධීනව පරීක්ෂා කරන ලදී — ක්‍රමලේඛන ප්‍රශ්න ක්‍රියාත්මක කර, තර්කනය සත්‍ය වගු මගින් සත්‍යාපනය කර. මුල් පිටපතේ පැහැදිලි නොවූ ප්‍රශ්න ${replacedCount}ක් සමාන දුෂ්කරතාවයකින් යුත් සමානක ප්‍රශ්නවලින් ප්‍රතිස්ථාපනය කර ඇත.`
            : `Every answer here was independently verified — programming questions were actually run, logic questions checked against truth tables. ${replacedCount} questions that were unclear or missing in the original scan were replaced with equivalent-difficulty questions on related topics.`}
        </p>
      </div>

      <button
        onClick={onStart}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-6 py-3.5 text-base font-semibold text-white"
      >
        <Icon name="play_arrow" className="!text-xl" />
        {lang === "si" ? "විභාගය අරඹන්න" : "Start the paper"}
      </button>
    </div>
  );
}

function ResultBanner({ lang, score }: { lang: Lang; score: number }) {
  const pct = Math.round((score / PAPER_QUESTION_COUNT) * 100);
  return (
    <div className="mb-6 rounded-xl border border-(--color-awaken-success)/30 bg-(--color-awaken-success-soft) p-5 text-center">
      <p className="text-3xl font-bold text-(--color-awaken-success)">
        {score}/{PAPER_QUESTION_COUNT}
      </p>
      <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
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
    <li
      id={`q${question.id}`}
      className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">
          <span className="text-(--color-awaken-ink-soft)">{index}.</span> {t.stem}
        </p>
        {isSubmitted ? (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
              isCorrectOverall
                ? "bg-(--color-awaken-success-soft) text-(--color-awaken-success)"
                : selected === undefined
                  ? "bg-(--color-awaken-bg) text-(--color-awaken-ink-soft)"
                  : "bg-(--color-awaken-danger-soft) text-(--color-awaken-danger)"
            }`}
          >
            {isCorrectOverall ? "✓" : selected === undefined ? (lang === "si" ? "දුන්නේ නැත" : "skipped") : "✗"}
          </span>
        ) : null}
      </div>

      {question.replaced ? (
        <p className="mt-1 text-xs text-(--color-awaken-ink-soft) italic">
          {lang === "si" ? "* ප්‍රතිස්ථාපිත ප්‍රශ්නයකි — හැඳින්වීම බලන්න." : "* Replacement question — see the note above."}
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        {t.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === question.correctIndex;
          let stateClass = "border-(--color-awaken-line)";
          if (isSubmitted) {
            if (isCorrect) stateClass = "border-(--color-awaken-success) bg-(--color-awaken-success-soft)";
            else if (isSelected) stateClass = "border-(--color-awaken-danger) bg-(--color-awaken-danger-soft)";
          } else if (isSelected) {
            stateClass = "border-(--color-awaken-accent) bg-(--color-awaken-accent-soft)";
          }
          return (
            <button
              key={i}
              type="button"
              disabled={isSubmitted}
              onClick={() => onSelect(i)}
              className={`flex w-full items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors disabled:cursor-default ${stateClass}`}
            >
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                  isSubmitted && isCorrect
                    ? "border-(--color-awaken-success) bg-(--color-awaken-success) text-white"
                    : isSelected
                      ? "border-(--color-awaken-accent) bg-(--color-awaken-accent) text-white"
                      : "border-(--color-awaken-line)"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <OptionText text={opt} />
              </span>
              {isSubmitted && isCorrect ? (
                <Icon name="check_circle" className="!text-base shrink-0 text-(--color-awaken-success)" />
              ) : null}
            </button>
          );
        })}
      </div>
    </li>
  );
}
