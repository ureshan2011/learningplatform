"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Icon } from "@/components/ui/Icon";
import { Badge, Button, Card, Eyebrow, Input, StatusChip } from "@/components/ds";
import { fetchWithSession } from "@/lib/auth/session-client";
import { useLiveRoom, type BoardRow, type LiveQuiz, type RaisedHand } from "@/components/live/useRoom";

/**
 * The room around the video.
 *
 * `database.rules.json` has described this in full since live classes were
 * designed — chat with a five-second throttle, presence, reactions, raised
 * hands, a quiz, a leaderboard, per-student answers — and until now nothing
 * read or wrote a byte of it. The live page carried a comment saying "Phase 2
 * mounts the Live Arena here" while the public pages sold "quizzes during
 * class" and "an island-wide leaderboard". A student paid, joined, and got a
 * Zoom embed.
 *
 * Two tabs rather than two columns: on the phone most students are on, the
 * video already owns the screen, and a chat that shares it with a quiz shows
 * four lines of each. The tab that has something new in it says so.
 */
export function LiveArena({
  sessionId,
  me,
  staff,
  labels,
}: {
  sessionId: string;
  me: { uid: string; name: string };
  /** Staff get the controls: launch a question, close it, read the hands. */
  staff: boolean;
  labels: LiveLabels;
}) {
  const room = useLiveRoom(sessionId, me);
  const [tab, setTab] = useState<"quiz" | "chat">("quiz");
  const [seenQuiz, setSeenQuiz] = useState<string | null>(null);

  const quizId = room.quiz?.id ?? null;

  // Adjusted during render rather than in an effect — the same pattern
  // `AppShell` uses to close its menu on a route change. Looking at the tab
  // *is* having seen the question; there is nothing to wait a commit for.
  // https://react.dev/learn/you-might-not-need-an-effect
  if (tab === "quiz" && quizId && quizId !== seenQuiz) setSeenQuiz(quizId);
  const unreadQuiz = quizId !== null && quizId !== seenQuiz && tab !== "quiz";

  if (!room.configured) {
    return (
      <Card radius="card" className="p-5">
        <p className="text-sm text-ict-fg-soft">{labels.notConfigured}</p>
      </Card>
    );
  }

  return (
    <Card radius="card" className="flex h-full min-h-[380px] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-ict-line p-2">
        <div className="inline-flex items-center gap-1 rounded-full bg-ict-surface-raised p-1">
          <Tab active={tab === "quiz"} onClick={() => setTab("quiz")} badge={unreadQuiz}>
            {labels.quizTab}
          </Tab>
          <Tab active={tab === "chat"} onClick={() => setTab("chat")}>
            {labels.chatTab}
          </Tab>
        </div>
        <span className="ml-auto flex items-center gap-1.5 pr-1 text-xs text-ict-fg-soft">
          <Icon name="group" className="!text-sm" />
          {room.present}
        </span>
      </div>

      {tab === "quiz" ? (
        <QuizPane room={room} sessionId={sessionId} staff={staff} labels={labels} />
      ) : (
        <ChatPane room={room} me={me} labels={labels} />
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Quiz                                                                        */
/* -------------------------------------------------------------------------- */

function QuizPane({
  room,
  sessionId,
  staff,
  labels,
}: {
  room: ReturnType<typeof useLiveRoom>;
  sessionId: string;
  staff: boolean;
  labels: LiveLabels;
}) {
  const { quiz, board, stats } = room;
  const [chosen, setChosen] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  // A new question clears the previous answer. Keyed off the quiz id rather
  // than an effect, so there is no frame where last question's choice is
  // highlighted against this question's options.
  const [answeredQuizId, setAnsweredQuizId] = useState<string | null>(null);
  if (quiz && answeredQuizId && quiz.id !== answeredQuizId && chosen !== null) {
    setChosen(null);
    setAnsweredQuizId(null);
  }

  const open = quiz?.state === "open";
  const closed = quiz?.state === "closed";

  async function answer(index: number) {
    if (!quiz || !open || chosen !== null || sending) return;
    setSending(true);
    setChosen(index);
    setAnsweredQuizId(quiz.id);
    try {
      await room.answer(quiz.id, index, quiz.startedAt);
    } catch {
      // The rules reject a second write, which is the only expected failure
      // and means the answer is already in. Leaving the choice highlighted is
      // the honest outcome either way.
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="scroll-pane flex-1 p-4">
      {staff ? (
        <>
          <TeacherControls sessionId={sessionId} quiz={quiz} labels={labels} />
          <Hands sessionId={sessionId} hands={room.hands} labels={labels} />
        </>
      ) : null}

      {!quiz ? (
        <p className="py-8 text-center text-sm text-ict-fg-soft">{labels.quizWaiting}</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <Eyebrow>{labels.quizTab}</Eyebrow>
            {open ? <Countdown quiz={quiz} labels={labels} /> : <Badge tone="neutral">{labels.quizClosed}</Badge>}
          </div>

          <p className="mt-3 text-base font-semibold text-ict-fg">{quiz.text}</p>

          <ul className="mt-4 space-y-2">
            {quiz.options.map((option, index) => {
              const isChosen = chosen === index;
              const isCorrect = closed && quiz.correctIndex === index;
              const isWrong = closed && isChosen && quiz.correctIndex !== index;
              const share =
                stats && stats.quizId === quiz.id && stats.answered > 0
                  ? Math.round((stats.counts[index] / stats.answered) * 100)
                  : null;

              return (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => answer(index)}
                    disabled={!open || chosen !== null}
                    className={clsx(
                      "ict-press relative flex w-full items-center gap-3 overflow-hidden rounded-ict-md border px-4 py-3 text-left text-sm transition-colors duration-[120ms] ease-ict disabled:cursor-default",
                      isCorrect
                        ? "border-ict-green-500 text-ict-fg"
                        : isWrong
                          ? "border-ict-red-500 text-ict-fg"
                          : isChosen
                            ? "border-ict-orange-500 text-ict-fg"
                            : "border-ict-line text-ict-fg",
                    )}
                  >
                    {/* How the class split, drawn behind the label once the
                        question is closed. A bar, not a fill: the option's
                        own border still carries right and wrong. */}
                    {share !== null && closed ? (
                      <span
                        aria-hidden
                        style={{ width: `${share}%` }}
                        className="absolute inset-y-0 left-0 bg-ict-surface-raised"
                      />
                    ) : null}
                    <span className="relative flex-1">{option}</span>
                    {closed && share !== null ? (
                      <span className="relative text-xs tabular-nums text-ict-fg-soft">{share}%</span>
                    ) : null}
                    {isCorrect ? (
                      <Icon name="done" className="relative !text-base shrink-0 text-ict-green-500" />
                    ) : null}
                    {isWrong ? (
                      <Icon name="cancel" className="relative !text-base shrink-0 text-ict-danger-fg" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {closed && quiz.explanation ? (
            <p className="mt-3 rounded-ict-md bg-ict-surface-raised p-3 text-sm text-ict-fg-soft">
              {quiz.explanation}
            </p>
          ) : null}

          {closed && board.length > 0 ? <Leaderboard board={board} labels={labels} /> : null}
        </>
      )}
    </div>
  );
}

/** Seconds left, ticking locally against the server's own start stamp. */
function Countdown({ quiz, labels }: { quiz: LiveQuiz; labels: LiveLabels }) {
  const [left, setLeft] = useState(() =>
    Math.max(0, quiz.durationSeconds - Math.floor((Date.now() - quiz.startedAt) / 1000)),
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft(Math.max(0, quiz.durationSeconds - Math.floor((Date.now() - quiz.startedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [quiz.durationSeconds, quiz.startedAt]);

  return (
    <StatusChip tone={left <= 5 ? "danger" : "brand"}>
      {left}
      {labels.seconds}
    </StatusChip>
  );
}

function Leaderboard({ board, labels }: { board: BoardRow[]; labels: LiveLabels }) {
  return (
    <div className="mt-5">
      <Eyebrow>{labels.leaderboard}</Eyebrow>
      <ol className="mt-2 space-y-1">
        {board.slice(0, 10).map((row) => (
          <li
            key={row.uid}
            className="flex items-center gap-3 rounded-ict-sm px-2 py-1.5 text-sm text-ict-fg"
          >
            <span className="w-5 shrink-0 text-center font-mono text-xs text-ict-fg-mute">
              {row.rank}
            </span>
            <span className="min-w-0 flex-1 truncate">{row.name}</span>
            <span className="shrink-0 tabular-nums text-ict-fg-soft">{row.points}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Chat                                                                        */
/* -------------------------------------------------------------------------- */

function ChatPane({
  room,
  me,
  labels,
}: {
  room: ReturnType<typeof useLiveRoom>;
  me: { uid: string; name: string };
  labels: LiveLabels;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const raised = room.hands.some((hand) => hand.uid === me.uid);

  async function raise() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await room.raiseHand(text);
      setText("");
    } catch {
      setError(labels.tooFast);
    } finally {
      setBusy(false);
    }
  }

  async function lower() {
    await room.lowerHand().catch(() => {});
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [room.chat.length]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await room.say(text);
      setText("");
    } catch {
      // The five-second throttle lives in the security rules, so this is what
      // being too quick looks like from here. Saying so is better than a
      // message that silently does not appear.
      setError(labels.tooFast);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scroll-pane flex-1 space-y-2 p-4">
        {room.chat.length === 0 ? (
          <p className="py-8 text-center text-sm text-ict-fg-soft">{labels.chatEmpty}</p>
        ) : (
          room.chat.map((line) => (
            <p key={line.id} className="text-sm">
              <span
                className={clsx(
                  "font-semibold",
                  line.uid === me.uid ? "text-ict-accent-fg" : "text-ict-fg",
                )}
              >
                {line.name}
              </span>{" "}
              <span className="text-ict-fg-soft">{line.text}</span>
            </p>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-ict-line p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={labels.chatPlaceholder}
          aria-label={labels.chatPlaceholder}
          maxLength={200}
          className="h-10 flex-1"
        />
        {/* Raising a hand sends the same text somewhere else: chat scrolls
            past and a teacher mid-explanation will not see it, while a hand
            stays in their panel until they take it down. */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          arrow="none"
          onClick={raise}
          disabled={busy || !text.trim()}
          aria-label={labels.raiseHand}
          title={labels.raiseHand}
        >
          <Icon name="priority_high" className="!text-base" />
        </Button>
        <Button type="submit" size="sm" arrow="none" disabled={busy || !text.trim()}>
          <Icon name="send" className="!text-base" />
        </Button>
      </form>
      {raised ? (
        <p className="flex items-center justify-between gap-2 px-3 pb-3 text-xs text-ict-fg-soft">
          {labels.handRaised}
          <button
            type="button"
            onClick={lower}
            className="font-semibold text-ict-accent-fg underline-offset-4 hover:underline"
          >
            {labels.lowerHand}
          </button>
        </p>
      ) : null}
      {error ? <p className="px-3 pb-3 text-xs text-ict-danger-fg">{error}</p> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Teacher controls                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Launch, close, clear.
 *
 * Every one of these is a write the rules forbid a browser from making, so
 * each goes through `/api/teacher/live/[sessionId]` and a staff session. The
 * question id is typed in rather than picked from a list for now — the class
 * is running, and a picker that loads the whole bank mid-lesson is a worse
 * first version than a field the teacher pastes into from the question bank.
 */
function TeacherControls({
  sessionId,
  quiz,
  labels,
}: {
  sessionId: string;
  quiz: LiveQuiz | null;
  labels: LiveLabels;
}) {
  const [questionId, setQuestionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession(`/api/teacher/live/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.reason ?? data.error ?? "failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-ict-md border border-ict-line bg-ict-surface-raised p-3">
      <Eyebrow>{labels.teacherControls}</Eyebrow>
      {quiz?.state === "open" ? (
        <Button
          size="sm"
          arrow="none"
          onClick={() => act({ action: "close" })}
          disabled={busy}
          className="mt-3"
        >
          {labels.closeQuestion}
        </Button>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            value={questionId}
            onChange={(e) => setQuestionId(e.target.value)}
            placeholder={labels.questionId}
            aria-label={labels.questionId}
            className="h-10 min-w-[10rem] flex-1"
          />
          <Button
            size="sm"
            arrow="none"
            onClick={() => act({ action: "open", questionId: questionId.trim() })}
            disabled={busy || !questionId.trim()}
          >
            {labels.askQuestion}
          </Button>
          {quiz ? (
            <Button
              variant="ghost"
              size="sm"
              arrow="none"
              onClick={() => act({ action: "clear" })}
              disabled={busy}
            >
              {labels.clear}
            </Button>
          ) : null}
        </div>
      )}
      {error ? <p className="mt-2 text-xs text-ict-danger-fg">{error}</p> : null}
    </div>
  );
}

/**
 * The questions students could not ask out loud.
 *
 * Staff only. A hand stays up until the teacher takes it down, which is the
 * point — chat scrolls away mid-explanation and a raised hand does not.
 */
function Hands({
  sessionId,
  hands,
  labels,
}: {
  sessionId: string;
  hands: RaisedHand[];
  labels: LiveLabels;
}) {
  if (hands.length === 0) return null;

  async function dismiss(uid: string) {
    await fetchWithSession(`/api/teacher/live/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss_hand", uid }),
    }).catch(() => {});
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow>{labels.hands}</Eyebrow>
        <Badge tone="brand">{hands.length}</Badge>
      </div>
      <ul className="mt-2 space-y-2">
        {hands.map((hand) => (
          <li
            key={hand.uid}
            className="flex items-start gap-2 rounded-ict-md border border-ict-line p-3 text-sm text-ict-fg"
          >
            <span className="min-w-0 flex-1">{hand.question}</span>
            <button
              type="button"
              onClick={() => dismiss(hand.uid)}
              aria-label={labels.dismissHand}
              className="grid size-7 shrink-0 place-items-center rounded-full text-ict-fg-mute transition-colors duration-[120ms] ease-ict hover:bg-ict-surface-hover hover:text-ict-fg"
            >
              <Icon name="close" className="!text-sm" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tab({
  active,
  badge,
  onClick,
  children,
}: {
  active: boolean;
  badge?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={clsx(
        "relative inline-flex h-8 items-center rounded-full px-3.5 text-sm font-semibold transition-colors duration-[120ms] ease-ict",
        active ? "bg-ict-orange-500 text-white" : "text-ict-fg-soft hover:text-ict-fg",
      )}
    >
      {children}
      {badge ? (
        <span aria-hidden className="absolute top-1 right-1 size-1.5 rounded-full bg-ict-orange-500" />
      ) : null}
    </button>
  );
}

export interface LiveLabels {
  quizTab: string;
  chatTab: string;
  quizWaiting: string;
  quizClosed: string;
  leaderboard: string;
  seconds: string;
  chatEmpty: string;
  chatPlaceholder: string;
  tooFast: string;
  notConfigured: string;
  teacherControls: string;
  questionId: string;
  askQuestion: string;
  closeQuestion: string;
  clear: string;
  raiseHand: string;
  handRaised: string;
  lowerHand: string;
  hands: string;
  dismissHand: string;
}
