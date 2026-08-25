"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";

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
      const res = await fetch(`/api/practice/${subjectId}/session`);
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
      const res = await fetch(`/api/practice/${subjectId}/answer`, {
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
    return <p className="text-sm text-white/50">Preparing your questions…</p>;
  }

  if (phase === "error") {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm">
        <p className="text-red-300">Something went wrong loading practice.</p>
        <button onClick={loadBatch} className="mt-3 rounded-lg border border-white/20 px-4 py-2">
          Try again
        </button>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/55">
        No practice questions are ready yet for {subjectName}. Check back once your teacher has
        added some.
      </p>
    );
  }

  if (phase === "summary") {
    const shareText = `I just practised ${subjectName} on ICT Class — ${correctCount}/${questions.length} correct${
      latestProgress ? ` and a ${latestProgress.streakDays}-day streak 🔥` : ""
    }!`;
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="text-sm text-white/55">Session complete</p>
        <p className="mt-2 text-4xl font-bold">
          {correctCount}/{questions.length}
        </p>
        <p className="mt-1 text-sm text-white/60">+{xpEarned} XP earned</p>
        {latestProgress ? (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-white/10 bg-black/20 py-3">
              <p className="text-lg font-bold">Lvl {latestProgress.level}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/40">Level</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 py-3">
              <p className="text-lg font-bold">{latestProgress.streakDays}d</p>
              <p className="text-[10px] uppercase tracking-wide text-white/40">Streak</p>
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={loadBatch}
            className="rounded-lg bg-[--color-brand] px-5 py-2.5 text-sm font-semibold text-black"
          >
            Practice again
          </button>
          <WhatsAppShareButton text={shareText} label="Share result" />
          <Link
            href={`/subjects/${subjectId}`}
            className="rounded-lg border border-white/20 px-5 py-2.5 text-sm"
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
      <div className="flex items-center justify-between text-xs text-white/45">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span>{question.topic}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[--color-brand] transition-all"
          style={{ width: `${((index + (result ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <p className="mt-6 text-lg font-medium">{question.text}</p>

      <div className="mt-5 space-y-2.5">
        {question.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrectOption = result && i === result.correctIndex;
          const isWrongSelected = result && isSelected && !result.correct;

          let style = "border-white/15 bg-white/[0.03] hover:border-white/30";
          if (isCorrectOption) style = "border-[--color-success] bg-[--color-success]/10";
          else if (isWrongSelected) style = "border-[--color-danger] bg-[--color-danger]/10";
          else if (isSelected) style = "border-[--color-brand] bg-[--color-brand]/10";

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
              ? "border-[--color-success]/30 bg-[--color-success]/10"
              : "border-[--color-danger]/30 bg-[--color-danger]/10"
          }`}
        >
          <p className={`font-semibold ${result.correct ? "text-[--color-success]" : "text-[--color-danger]"}`}>
            {result.correct ? `Correct! +${result.xpAwarded} XP` : `Not quite. +${result.xpAwarded} XP for trying`}
          </p>
          <p className="mt-2 text-white/75">{result.explanation}</p>
          {result.misconception ? (
            <p className="mt-2 rounded-lg bg-black/20 p-3 text-white/60">
              <span className="font-medium text-white/80">Why that answer felt right: </span>
              {result.misconception}
            </p>
          ) : null}
          <button
            onClick={next}
            className="mt-4 rounded-lg bg-[--color-brand] px-4 py-2 font-semibold text-black"
          >
            {index + 1 >= questions.length ? "See results" : "Next question"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
