"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSession, signInHref } from "@/lib/auth/session-client";

/**
 * A submitted paper, held locally until the server has actually taken it.
 *
 * The only case this covers is a session that lapsed between starting the
 * paper and submitting it — rare, but the cost is an hour of a student's exam
 * practice, so it is worth twenty lines.
 */
const DRAFT_PREFIX = "ictclass.mockDraft.";

function saveDraft(mockExamId: string, answers: Record<string, number>): void {
  try {
    sessionStorage.setItem(DRAFT_PREFIX + mockExamId, JSON.stringify(answers));
  } catch {
    // Storage blocked. The in-memory answers are still on screen.
  }
}

function readDraft(mockExamId: string): Record<string, number> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_PREFIX + mockExamId);
    return raw ? (JSON.parse(raw) as Record<string, number>) : null;
  } catch {
    return null;
  }
}

function clearDraft(mockExamId: string): void {
  try {
    sessionStorage.removeItem(DRAFT_PREFIX + mockExamId);
  } catch {
    // Nothing to clean up.
  }
}

interface MockExamQuestion {
  id: string;
  topic: string;
  text: string;
  options: string[];
}

interface StartResponse {
  mockExamId: string;
  title: string;
  durationMinutes: number;
  negativeMarking: number;
  startedAt: number;
  questions: MockExamQuestion[];
}

type Phase = "loading" | "running" | "submitting" | "error";

/**
 * Runs one timed mock-exam sitting: countdown, a question navigator (like
 * real exam software, not one-question-at-a-time like Practice), and a
 * submit that server-scores with negative marking.
 *
 * The deadline is computed from the server's `startedAt`, never the client
 * clock, so pausing the tab or winding the system clock back cannot buy
 * extra time — the server enforces the same deadline again on submit.
 */
export function MockExamRunner({
  subjectId,
  mockExamId,
}: {
  subjectId: string;
  mockExamId: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [exam, setExam] = useState<StartResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remainingMs, setRemainingMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** Set only when the session is genuinely gone, so the error can offer a way back. */
  const [signInLink, setSignInHref] = useState<string | null>(null);
  const submittingRef = useRef(false);
  // The countdown effect below intentionally does not depend on `answers` —
  // restarting a 1s interval on every option click would jitter the clock.
  // It reads this ref instead, so the auto-submit-on-timeout path always
  // sees whatever was answered up to that instant rather than the empty
  // object `answers` held on the render the interval was created from.
  const answersRef = useRef<Record<string, number>>({});
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchWithSession(`/api/mock-exams/${mockExamId}/start`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subjectId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.error === "already_submitted") {
            router.refresh();
            return;
          }
          throw new Error();
        }
        const data = (await res.json()) as StartResponse;
        if (cancelled) return;
        setExam(data);
        // Answers rescued from a submit that hit a lapsed session. The server
        // reissues the same `questionOrder` on restart, so these still line up.
        const draft = readDraft(mockExamId);
        if (draft) setAnswers(draft);
        setPhase("running");
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockExamId, subjectId]);

  const deadline = useMemo(
    () => (exam ? exam.startedAt + exam.durationMinutes * 60 * 1000 : 0),
    [exam],
  );

  const submit = useCallback(
    async (finalAnswers: Record<string, number>) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setPhase("submitting");
      try {
        const res = await fetchWithSession(`/api/mock-exams/${mockExamId}/submit`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subjectId, answers: finalAnswers }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          // A finished paper is the worst possible thing to lose. If the
          // session could not be recovered, park the answers where a reload
          // will find them and say what actually happened, rather than
          // blaming the student's connection and letting them retry into the
          // same 401 until they give up.
          if (res.status === 401 || res.status === 403) {
            saveDraft(mockExamId, finalAnswers);
            setSignInHref(signInHref());
            throw new Error(
              "Your sign-in expired before this could be submitted. Your answers are saved — sign in again and they will be sent.",
            );
          }
          throw new Error(
            data.error === "time_expired"
              ? "Time was already up when this reached the server."
              : "Could not submit. Check your connection and try again.",
          );
        }
        clearDraft(mockExamId);
        router.refresh();
      } catch (err) {
        submittingRef.current = false;
        setErrorMessage(err instanceof Error ? err.message : "Could not submit.");
        setPhase("running");
      }
    },
    [mockExamId, subjectId, router],
  );

  // Countdown, ticking from the server-issued deadline — auto-submits once,
  // whatever has been answered so far, the moment time runs out.
  useEffect(() => {
    if (phase !== "running" || !exam) return;
    const tick = () => {
      const left = deadline - Date.now();
      setRemainingMs(Math.max(0, left));
      if (left <= 0) {
        void submit(answersRef.current);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, exam, deadline]);

  if (phase === "loading") {
    return <p className="text-sm text-(--color-awaken-ink-soft)">Preparing your paper…</p>;
  }

  if (phase === "error" || !exam) {
    return (
      <div className="rounded-xl border border-(--color-awaken-danger)/30 bg-(--color-awaken-danger-soft) p-5 text-sm">
        <p className="text-(--color-awaken-danger)">Could not start this mock exam.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg border border-(--color-awaken-line) px-4 py-2"
        >
          Try again
        </button>
      </div>
    );
  }

  const question = exam.questions[index];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = exam.questions.length - answeredCount;
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const timeLow = remainingMs < 2 * 60 * 1000;
  const submitting = phase === "submitting";

  function selectAnswer(choiceIndex: number) {
    if (submitting) return;
    setAnswers((prev) => ({ ...prev, [question.id]: choiceIndex }));
  }

  function confirmSubmit() {
    if (submitting) return;
    if (
      unansweredCount > 0 &&
      !window.confirm(`You have ${unansweredCount} unanswered question${unansweredCount === 1 ? "" : "s"}. Submit anyway?`)
    ) {
      return;
    }
    void submit(answers);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4">
        <div>
          <p className="font-semibold">{exam.title}</p>
          <p className="text-xs text-(--color-awaken-ink-soft)">
            {answeredCount}/{exam.questions.length} answered
            {exam.negativeMarking > 0 ? ` · -${exam.negativeMarking} for each wrong answer` : ""}
          </p>
        </div>
        <div
          className={`rounded-lg px-3 py-1.5 font-mono text-lg font-bold ${
            timeLow ? "bg-(--color-awaken-danger-soft) text-(--color-awaken-danger)" : "bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)"
          }`}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {exam.questions.map((q, i) => {
          const isAnswered = answers[q.id] !== undefined;
          const isCurrent = i === index;
          let style = "border-(--color-awaken-line) bg-(--color-awaken-card) text-(--color-awaken-ink-soft)";
          if (isAnswered) style = "border-(--color-awaken-success) bg-(--color-awaken-success-soft) text-(--color-awaken-success)";
          if (isCurrent) style = "border-(--color-awaken-accent) bg-(--color-awaken-accent) text-white";
          return (
            <button
              key={q.id}
              onClick={() => setIndex(i)}
              disabled={submitting}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold ${style}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5">
        <p className="text-xs text-(--color-awaken-ink-soft)">
          Question {index + 1} of {exam.questions.length} · {question.topic}
        </p>
        <p className="mt-2 text-lg font-medium">{question.text}</p>

        <div className="mt-5 space-y-2.5">
          {question.options.map((option, i) => {
            const isSelected = answers[question.id] === i;
            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                disabled={submitting}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  isSelected
                    ? "border-(--color-awaken-accent) bg-(--color-awaken-accent-soft)"
                    : "border-(--color-awaken-line) bg-(--color-awaken-card) hover:border-(--color-awaken-accent)/40"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0 || submitting}
            className="rounded-lg border border-(--color-awaken-line) px-4 py-2 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            onClick={() => setIndex((i) => Math.min(exam.questions.length - 1, i + 1))}
            disabled={index === exam.questions.length - 1 || submitting}
            className="rounded-lg border border-(--color-awaken-line) px-4 py-2 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
        <button
          onClick={confirmSubmit}
          disabled={submitting}
          className="rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit paper"}
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-(--color-awaken-danger)">
          {errorMessage}
          {signInLink ? (
            <a href={signInLink} className="ml-1 font-semibold underline">
              Sign in again
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
