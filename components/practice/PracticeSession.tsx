"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import { fetchWithSession } from "@/lib/auth/session-client";

interface PracticeQuestion {
  id: string;
  subjectId: string;
  topic: string;
  medium: string;
  commandWord?: string;
  text: string;
  options: string[];
}

interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  misconception?: string;
  xpAwarded: number;
  progress: { xp: number; level: number; streakDays: number };
}

type Phase = "loading" | "playing" | "summary" | "empty" | "error";

export function PracticeSession({
  subjectId,
  subjectName,
}: {
  subjectId: string;
  subjectName: string;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [latestProgress, setLatestProgress] = useState<AnswerResult["progress"] | null>(null);

  useEffect(() => {
    void loadBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  async function loadBatch() {
    setPhase("loading");
    setIndex(0);
    setSelected(null);
    setResult(null);
    setCorrectCount(0);
    setXpEarned(0);
    try {
      const res = await fetchWithSession(`/api/practice/${subjectId}/session`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { questions: PracticeQuestion[] };
      if (data.questions.length === 0) {
        setPhase("empty");
        return;
      }
      setQuestions(data.questions);
      setPhase("playing");
    } catch {
      setPhase("error");
    }
  }

  async function submitAnswer(choiceIndex: number) {
    if (submitting || selected !== null) return;
    setSelected(choiceIndex);
    setSubmitting(true);
    try {
      const question = questions[index];
      const res = await fetchWithSession(`/api/practice/${subjectId}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: question.id, choiceIndex }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as AnswerResult;
      setResult(data);
      setLatestProgress(data.progress);
      setXpEarned((x) => x + data.xpAwarded);
      if (data.correct) setCorrectCount((c) => c + 1);
    } catch {
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      setPhase("summary");
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setResult(null);
  }

  if (phase === "loading") {
    return <p className="text-sm text-(--color-awaken-ink-soft)">Preparing your questions…</p>;
  }

  if (phase === "error") {
    return (
      <div className="rounded-xl border border-(--color-awaken-danger)/30 bg-(--color-awaken-danger-soft) p-5 text-sm">
        <p className="text-(--color-awaken-danger)">Something went wrong loading practice.</p>
        <button onClick={loadBatch} className="mt-3 rounded-lg border border-(--color-awaken-line) px-4 py-2">
          Try again
        </button>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <p className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-sm text-(--color-awaken-ink-soft)">
        No practice questions are ready yet for {subjectName}. Check back once your teacher has
        added some.
      </p>
    );
  }

  if (phase === "summary") {
    const shareText = `I just practised ${subjectName} on ICT Campus — ${correctCount}/${questions.length} correct${
      latestProgress ? ` and a ${latestProgress.streakDays}-day streak 🔥` : ""
    }!`;
    return (
      <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 text-center">
        <p className="text-sm text-(--color-awaken-ink-soft)">Session complete</p>
        <p className="mt-2 text-4xl font-bold">
          {correctCount}/{questions.length}
        </p>
        <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">+{xpEarned} XP earned</p>
        {latestProgress ? (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) py-3">
              <p className="text-lg font-bold">Lvl {latestProgress.level}</p>
              <p className="text-[10px] uppercase tracking-wide text-(--color-awaken-ink-soft)">Level</p>
            </div>
            <div className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) py-3">
              <p className="text-lg font-bold">{latestProgress.streakDays}d</p>
              <p className="text-[10px] uppercase tracking-wide text-(--color-awaken-ink-soft)">Streak</p>
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={loadBatch}
            className="rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 text-sm font-semibold text-white"
          >
            Practice again
          </button>
          <WhatsAppShareButton text={shareText} label="Share result" />
          <Link
            href={`/subjects/${subjectId}`}
            className="rounded-lg border border-(--color-awaken-line) px-5 py-2.5 text-sm"
          >
            Back to subject
          </Link>
        </div>
      </div>
    );
  }

  const question = questions[index];

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-(--color-awaken-ink-soft)">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span>{question.topic}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-(--color-awaken-line)">
        <div
          className="h-full rounded-full bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) transition-all"
          style={{ width: `${((index + (result ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <p className="mt-6 text-lg font-medium">{question.text}</p>

      <div className="mt-5 space-y-2.5">
        {question.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrectOption = result && i === result.correctIndex;
          const isWrongSelected = result && isSelected && !result.correct;

          let style = "border-(--color-awaken-line) bg-(--color-awaken-card) hover:border-(--color-awaken-accent)/40";
          if (isCorrectOption) style = "border-(--color-awaken-success) bg-(--color-awaken-success-soft)";
          else if (isWrongSelected) style = "border-(--color-awaken-danger) bg-(--color-awaken-danger-soft)";
          else if (isSelected) style = "border-(--color-awaken-accent) bg-(--color-awaken-accent-soft)";

          return (
            <button
              key={i}
              onClick={() => submitAnswer(i)}
              disabled={selected !== null}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {result ? (
        <div
          className={`mt-5 rounded-xl border p-4 text-sm ${
            result.correct
              ? "border-(--color-awaken-success)/30 bg-(--color-awaken-success-soft)"
              : "border-(--color-awaken-danger)/30 bg-(--color-awaken-danger-soft)"
          }`}
        >
          <p className={`font-semibold ${result.correct ? "text-(--color-awaken-success)" : "text-(--color-awaken-danger)"}`}>
            {result.correct ? `Correct! +${result.xpAwarded} XP` : `Not quite. +${result.xpAwarded} XP for trying`}
          </p>
          <p className="mt-2 text-(--color-awaken-ink-soft)">{result.explanation}</p>
          {result.misconception ? (
            <p className="mt-2 rounded-lg bg-(--color-awaken-bg) p-3 text-(--color-awaken-ink-soft)">
              <span className="font-medium text-(--color-awaken-ink-soft)">Why that answer felt right: </span>
              {result.misconception}
            </p>
          ) : null}
          <button
            onClick={next}
            className="mt-4 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 font-semibold text-white"
          >
            {index + 1 >= questions.length ? "See results" : "Next question"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
