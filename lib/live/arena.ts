import "server-only";

import { adminRtdb, col } from "@/lib/firebase/admin";
import { updateProgress } from "@/lib/practice/engine";
import { buildBoard, optionCounts, scoreAnswers } from "@/lib/live/scoring";
import type { ClassSession, Question } from "@/lib/types";

/**
 * The Live Arena's server half.
 *
 * `database.rules.json` has always described this room in full — chat,
 * presence, reactions, raised hands, quiz, leaderboard, stats, answers — and
 * nothing read or wrote any of it. The public pages meanwhile promised
 * "quizzes during class" and "an island-wide leaderboard". This is the half a
 * student's browser is not allowed to write.
 *
 * The split is the rules': a student may write their own chat line, their own
 * presence, their own reaction, their own raised hand and their own answer,
 * once each. `quiz`, `leaderboard` and `stats` are `".write": false` — they
 * are what the teacher controls and what scoring produces, and a client that
 * could write them could award itself first place.
 *
 * All of it lives in Realtime Database, never Firestore: a 1,000-student class
 * answering one question is 1,000 writes, which on Firestore would eat the
 * daily free quota in a single lesson (CLAUDE.md, rule 2).
 */

/** What students see while a question is open. Never includes the answer. */
export interface LiveQuizPublic {
  id: string;
  questionId: string;
  text: string;
  options: string[];
  /** Server clock, so a client with a wrong clock cannot extend its own timer. */
  startedAt: number;
  durationSeconds: number;
  state: "open" | "closed";
}

export interface LiveQuizResult extends LiveQuizPublic {
  correctIndex: number;
  explanation: string;
}

/** XP for getting one right in class. Matches practice's own per-question award. */
const XP_PER_CORRECT = 10;

function room(sessionId: string) {
  return adminRtdb().ref(`live/${sessionId}`);
}

/**
 * Puts a question on every student's screen at once.
 *
 * The answer is held back deliberately: `quiz` is world-readable to anyone
 * signed in, so `correctIndex` would be one devtools tab away from the whole
 * class. It is re-read from Firestore at scoring time instead.
 */
export async function openQuiz(params: {
  sessionId: string;
  question: Question;
  durationSeconds: number;
  now?: number;
}): Promise<LiveQuizPublic> {
  const now = params.now ?? Date.now();
  const quiz: LiveQuizPublic = {
    id: `q${now}`,
    questionId: params.question.id,
    text: params.question.text,
    options: params.question.options,
    startedAt: now,
    durationSeconds: params.durationSeconds,
    state: "open",
  };

  await room(params.sessionId).child("quiz").set(quiz);
  return quiz;
}

/**
 * Closes the current question, scores it, and publishes the board.
 *
 * Scoring reads the answers node — written by students under a rule that
 * allows exactly one write each and no overwrite — and the correct index from
 * Firestore, which no student can read. `msSinceShown` comes from the
 * client and is therefore not trusted for anything but the bonus: a student
 * who lies about it wins points in a class game, not marks in an exam, and
 * clamping it to the question's own window is enough.
 */
export async function closeQuiz(params: {
  sessionId: string;
  session: ClassSession;
}): Promise<{ scored: number } | null> {
  const ref = room(params.sessionId);
  const quizSnap = await ref.child("quiz").get();
  const quiz = quizSnap.val() as LiveQuizPublic | null;
  if (!quiz) return null;

  const questionSnap = await col.questions().doc(quiz.questionId).get();
  if (!questionSnap.exists) return null;
  const question = questionSnap.data() as Question;

  const answersSnap = await ref.child(`answers/${quiz.id}`).get();
  const answers = (answersSnap.val() ?? {}) as Record<
    string,
    { choice: number; msSinceShown: number }
  >;

  const raw = Object.entries(answers).map(([uid, answer]) => ({ uid, ...answer }));
  const scored = scoreAnswers(raw, question.correctIndex, quiz.durationSeconds * 1000);

  const names = await namesFor(scored.map((s) => s.uid));
  const board = buildBoard(scored, names);
  const counts = optionCounts(raw, question.options.length);

  await Promise.all([
    ref.child("quiz").update({
      state: "closed",
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    } satisfies Partial<LiveQuizResult>),
    ref.child("leaderboard").set(board),
    ref.child("stats").set({
      quizId: quiz.id,
      answered: Object.keys(answers).length,
      counts,
      correctIndex: question.correctIndex,
    }),
  ]);

  // XP is only ever written by the server (CLAUDE.md, rule 5). Failures here
  // must not fail the close — the board is already on screen and a retry that
  // re-scored would double-award.
  await Promise.all(
    scored
      .filter((s) => s.correct)
      .map((s) =>
        updateProgress({
          uid: s.uid,
          tenantId: params.session.tenantId,
          subjectId: params.session.subjectId,
          xpDelta: XP_PER_CORRECT,
          now: Date.now(),
        }).catch((err) => console.error("[arena] xp award failed", s.uid, err)),
      ),
  );

  return { scored: scored.length };
}

/** Clears the room's question so the panel goes back to "waiting". */
export async function clearQuiz(sessionId: string): Promise<void> {
  await Promise.all([
    room(sessionId).child("quiz").remove(),
    room(sessionId).child("stats").remove(),
  ]);
}

/** Takes a student's raised hand down once the teacher has read it. */
export async function dismissHand(sessionId: string, uid: string): Promise<void> {
  await room(sessionId).child(`hands/${uid}`).remove();
}

async function namesFor(uids: string[]): Promise<Map<string, string>> {
  if (uids.length === 0) return new Map();
  const docs = await col.users().firestore.getAll(...uids.map((uid) => col.users().doc(uid)));
  return new Map(
    docs
      .filter((d) => d.exists)
      .map((d) => [d.id, ((d.data() as { name?: string }).name ?? "Student").split(/\s+/)[0]]),
  );
}
