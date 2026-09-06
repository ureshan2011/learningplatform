"use client";

import { useEffect, useState } from "react";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import { fetchWithSession } from "@/lib/auth/session-client";
import { Icon } from "@/components/ui/Icon";
import {
  Button,
  ButtonLink,
  Card,
  Chip,
  EmptyState,
  ProgressBar,
  StatCard,
  StatusChip,
} from "@/components/ds";

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
    return <p className="text-sm text-ict-ink-300">Preparing your questions…</p>;
  }

  if (phase === "error") {
    return (
      <Card radius="card" className="p-5">
        <p className="flex items-center gap-2 text-sm text-[#f0685a]">
          <Icon name="cancel" className="!text-base" />
          Something went wrong loading practice.
        </p>
        <Button variant="outline" size="sm" arrow="none" onClick={loadBatch} className="mt-4">
          Try again
        </Button>
      </Card>
    );
  }

  if (phase === "empty") {
    return (
      <EmptyState
        icon="quiz"
        title="No practice questions yet"
        body={`Nothing is ready for ${subjectName} yet. Check back once your teacher has added some.`}
      />
    );
  }

  if (phase === "summary") {
    const shareText = `I just practised ${subjectName} on ICT Campus — ${correctCount}/${questions.length} correct${
      latestProgress ? ` and a ${latestProgress.streakDays}-day streak` : ""
    }!`;
    return (
      <Card radius="panel" className="p-6 text-center sm:p-8">
        <p className="text-sm text-ict-ink-300">Session complete</p>
        <p className="mt-2 font-display text-4xl font-extrabold text-ict-paper-50">
          {correctCount}/{questions.length}
        </p>
        <p className="mt-1.5 text-sm text-ict-ink-300">+{xpEarned} XP earned</p>

        {latestProgress ? (
          <div className="mt-5 grid grid-cols-2 gap-3 text-left">
            <StatCard icon="workspace_premium" label="Level" value={latestProgress.level} />
            <StatCard
              icon="local_fire_department"
              label="Streak"
              value={`${latestProgress.streakDays}d`}
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={loadBatch}>Practice again</Button>
          <WhatsAppShareButton
            text={shareText}
            label="Share result"
            className="ict-press inline-flex h-10 items-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-black"
          />
          <ButtonLink href={`/subjects/${subjectId}`} variant="outline" arrow="none">
            Back to subject
          </ButtonLink>
        </div>
      </Card>
    );
  }

  const question = questions[index];
  const progressPct = ((index + (result ? 1 : 0)) / questions.length) * 100;

  return (
    <Card radius="panel" className="p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-ict-ink-300">
          Question {index + 1} of {questions.length}
        </span>
        <Chip>{question.topic}</Chip>
      </div>
      <ProgressBar value={progressPct} showLabel={false} className="mt-3" />

      <p className="mt-6 text-lg font-semibold text-ict-paper-50">{question.text}</p>

      <div className="mt-5 space-y-2.5">
        {question.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrectOption = Boolean(result && i === result.correctIndex);
          const isWrongSelected = Boolean(result && isSelected && !result.correct);

          let style = "border-ict-border-dark bg-ict-ink-800 hover:border-ict-ink-500";
          if (isCorrectOption) style = "border-ict-green-500/50 bg-ict-green-500/10";
          else if (isWrongSelected) style = "border-ict-red-500/50 bg-ict-red-500/10";
          else if (isSelected) style = "border-ict-orange-500/60 bg-ict-orange-500/10";

          return (
            <button
              key={i}
              type="button"
              onClick={() => submitAnswer(i)}
              disabled={selected !== null}
              className={`ict-press flex w-full items-center justify-between gap-3 rounded-ict-md border px-4 py-3 text-left text-sm text-ict-paper-50 transition-colors duration-[120ms] ease-ict disabled:cursor-default ${style}`}
            >
              <span>{option}</span>
              {isCorrectOption ? <Icon name="done" className="!text-base shrink-0 text-ict-green-500" /> : null}
              {isWrongSelected ? <Icon name="cancel" className="!text-base shrink-0 text-[#f0685a]" /> : null}
            </button>
          );
        })}
      </div>

      {result ? (
        <Card variant="raised" radius="card" className="mt-5 p-4 text-sm">
          <StatusChip tone={result.correct ? "success" : "danger"}>
            {result.correct ? `Correct — +${result.xpAwarded} XP` : `Not quite — +${result.xpAwarded} XP`}
          </StatusChip>
          <p className="mt-3 text-ict-ink-300">{result.explanation}</p>
          {result.misconception ? (
            <p className="mt-2 rounded-ict-md bg-ict-ink-900 p-3 text-ict-ink-300">
              <span className="font-medium text-ict-paper-50">Why that answer felt right: </span>
              {result.misconception}
            </p>
          ) : null}
          <Button onClick={next} size="sm" className="mt-4">
            {index + 1 >= questions.length ? "See results" : "Next question"}
          </Button>
        </Card>
      ) : null}
    </Card>
  );
}
