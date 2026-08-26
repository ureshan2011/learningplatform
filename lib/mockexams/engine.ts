import "server-only";

import { adminDb, col, mockExamAttemptId } from "@/lib/firebase/admin";
import { shuffle, updateProgress } from "@/lib/practice/engine";
import type { MockExam, MockExamAttempt, Question } from "@/lib/types";

/** How many mock-exam attempt documents to scan before narrowing in memory — see lib/queries.ts. */
const SCAN_WINDOW = 300;

/** Minutes of clock drift / submit-latency tolerated past the paper's duration before a submission is refused. */
const GRACE_MS = 90 * 1000;

const XP_PER_CORRECT = 10;
/** Rewards finishing a full timed paper, not just answering — mock exams are harder than practice. */
const XP_COMPLETION_BONUS = 20;

/** A question stripped of its answer — what the client sees while the paper is still open. */
export interface MockExamQuestion {
  id: string;
  topic: string;
  text: string;
  options: string[];
}

export interface MockExamStart {
  mockExamId: string;
  title: string;
  durationMinutes: number;
  negativeMarking: number;
  /** When this student's clock started — the deadline is `startedAt + durationMinutes*60000`. */
  startedAt: number;
  questions: MockExamQuestion[];
}

/** A scored question, revealed only once the paper is submitted. */
export interface MockExamResultQuestion extends MockExamQuestion {
  correctIndex: number;
  explanation: string;
  /** Absent when the student left it blank. */
  yourChoice?: number;
}

export interface MockExamResult {
  mockExamId: string;
  title: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  negativeMarking: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  rank: number;
  totalAttempts: number;
  /** You scored higher than this % of everyone who has sat this paper. */
  percentile: number;
  xpAwarded: number;
  submittedAt: number;
  questions: MockExamResultQuestion[];
}

function toMockExamQuestion(q: Question): MockExamQuestion {
  return { id: q.id, topic: q.topic, text: q.text, options: q.options };
}

/**
 * Picks `count` active questions for a subject, optionally narrowed to one
 * topic and/or year — the year filter is what turns this into "a timed
 * sitting of the real 2019 paper" once past-paper questions are tagged with
 * their year, not just a random MCQ set.
 */
async function selectQuestionsForMockExam(
  subjectId: string,
  count: number,
  filters: { topic?: string; year?: number },
): Promise<string[]> {
  const snap = await col.questions().where("subjectId", "==", subjectId).limit(SCAN_WINDOW).get();
  let candidates = snap.docs.map((d) => d.data() as Question).filter((q) => q.active);
  if (filters.topic) candidates = candidates.filter((q) => q.topic === filters.topic);
  if (filters.year) candidates = candidates.filter((q) => q.year === filters.year);

  if (candidates.length < count) {
    const err = new Error("NOT_ENOUGH_QUESTIONS") as Error & { available?: number };
    err.available = candidates.length;
    throw err;
  }

  return shuffle(candidates)
    .slice(0, count)
    .map((q) => q.id);
}

/**
 * Creates a mock exam: a fixed snapshot of question ids, chosen once, so
 * every student who sits it gets the identical paper — same reasoning a
 * printed past paper is fixed once typeset.
 */
export async function createMockExam(params: {
  tenantId: string;
  subjectId: string;
  title: string;
  durationMinutes: number;
  negativeMarking: number;
  questionCount: number;
  createdBy: string;
  topic?: string;
  year?: number;
}): Promise<MockExam> {
  const questionIds = await selectQuestionsForMockExam(params.subjectId, params.questionCount, {
    topic: params.topic,
    year: params.year,
  });

  const ref = col.mockExams().doc();
  const exam: MockExam = {
    id: ref.id,
    tenantId: params.tenantId,
    subjectId: params.subjectId,
    title: params.title,
    questionIds,
    durationMinutes: params.durationMinutes,
    negativeMarking: params.negativeMarking,
    active: true,
    createdAt: Date.now(),
    createdBy: params.createdBy,
  };
  await ref.set(exam);
  return exam;
}

/**
 * Starts (or resumes) a student's sitting of a mock exam.
 *
 * Idempotent by design: a page refresh mid-exam calls this again and gets
 * back the same `questionOrder` and the same `startedAt`, so the timer and
 * paper stay stable across reloads instead of resetting the clock.
 */
export async function startMockExam(params: {
  uid: string;
  tenantId: string;
  subjectId: string;
  mockExamId: string;
}): Promise<MockExamStart> {
  const examSnap = await col.mockExams().doc(params.mockExamId).get();
  if (!examSnap.exists) throw new Error("EXAM_NOT_FOUND");
  const exam = examSnap.data() as MockExam;
  if (exam.subjectId !== params.subjectId || !exam.active) throw new Error("EXAM_NOT_FOUND");

  const attemptRef = col.mockExamAttempts().doc(mockExamAttemptId(params.uid, params.mockExamId));
  const attemptSnap = await attemptRef.get();
  let attempt = attemptSnap.data() as MockExamAttempt | undefined;

  if (attempt?.submittedAt) throw new Error("ALREADY_SUBMITTED");

  if (!attempt) {
    const now = Date.now();
    attempt = {
      id: attemptRef.id,
      tenantId: params.tenantId,
      uid: params.uid,
      subjectId: params.subjectId,
      mockExamId: params.mockExamId,
      questionOrder: shuffle(exam.questionIds),
      startedAt: now,
      updatedAt: now,
    };
    await attemptRef.set(attempt);
  }

  const questionSnaps = await adminDb().getAll(...attempt.questionOrder.map((id) => col.questions().doc(id)));
  const questions = questionSnaps.filter((s) => s.exists).map((s) => toMockExamQuestion(s.data() as Question));

  return {
    mockExamId: exam.id,
    title: exam.title,
    durationMinutes: exam.durationMinutes,
    negativeMarking: exam.negativeMarking,
    startedAt: attempt.startedAt,
    questions,
  };
}

/**
 * Scores a submitted paper server-side, locks the attempt, and awards XP.
 *
 * Never trust a client-computed score — the correct index lives only in
 * this function until the attempt is locked, the same reasoning
 * `recordAnswer` uses for a single practice question, just for a whole paper
 * at once. A second submission on an already-submitted attempt is refused,
 * not re-scored, so a student cannot revise answers after seeing the key.
 */
export async function submitMockExam(params: {
  uid: string;
  tenantId: string;
  subjectId: string;
  mockExamId: string;
  answers: Record<string, number>;
}): Promise<MockExamResult> {
  const attemptRef = col.mockExamAttempts().doc(mockExamAttemptId(params.uid, params.mockExamId));
  const attemptSnap = await attemptRef.get();
  if (!attemptSnap.exists) throw new Error("NOT_STARTED");
  const attempt = attemptSnap.data() as MockExamAttempt;
  if (attempt.submittedAt) throw new Error("ALREADY_SUBMITTED");

  const examSnap = await col.mockExams().doc(params.mockExamId).get();
  if (!examSnap.exists) throw new Error("EXAM_NOT_FOUND");
  const exam = examSnap.data() as MockExam;

  const now = Date.now();
  if (now > attempt.startedAt + exam.durationMinutes * 60 * 1000 + GRACE_MS) {
    throw new Error("TIME_EXPIRED");
  }

  const questionSnaps = await adminDb().getAll(...attempt.questionOrder.map((id) => col.questions().doc(id)));
  const questions = questionSnaps.filter((s) => s.exists).map((s) => s.data() as Question);

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let rawScore = 0;
  const topicBreakdown: Record<string, { correct: number; total: number }> = {};
  const resultQuestions: MockExamResultQuestion[] = [];

  for (const q of questions) {
    const bucket = topicBreakdown[q.topic] ?? { correct: 0, total: 0 };
    bucket.total += 1;

    const choice = params.answers[q.id];
    if (choice === undefined) {
      unansweredCount += 1;
    } else if (choice === q.correctIndex) {
      correctCount += 1;
      bucket.correct += 1;
      rawScore += 1;
    } else {
      wrongCount += 1;
      rawScore -= exam.negativeMarking;
    }
    topicBreakdown[q.topic] = bucket;

    resultQuestions.push({
      ...toMockExamQuestion(q),
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      ...(choice !== undefined ? { yourChoice: choice } : {}),
    });
  }
  // Round away float dust from repeated fractional subtraction (e.g. 0.33 x N).
  rawScore = Math.round(rawScore * 100) / 100;

  const { rank, totalAttempts, percentile } = await rankAmongAttempts(params.mockExamId, attemptRef.id, rawScore);

  const xpAwarded = correctCount * XP_PER_CORRECT + XP_COMPLETION_BONUS;
  await Promise.all([
    attemptRef.set(
      {
        answers: params.answers,
        submittedAt: now,
        score: rawScore,
        correctCount,
        wrongCount,
        unansweredCount,
        topicBreakdown,
        rank,
        totalAttempts,
        percentile,
        updatedAt: now,
      } satisfies Partial<MockExamAttempt>,
      { merge: true },
    ),
    updateProgress({ uid: params.uid, tenantId: params.tenantId, subjectId: params.subjectId, xpDelta: xpAwarded, now }),
  ]);

  return {
    mockExamId: exam.id,
    title: exam.title,
    score: rawScore,
    correctCount,
    wrongCount,
    unansweredCount,
    totalQuestions: questions.length,
    negativeMarking: exam.negativeMarking,
    topicBreakdown,
    rank,
    totalAttempts,
    percentile,
    xpAwarded,
    submittedAt: now,
    questions: resultQuestions,
  };
}

/**
 * Re-reads an already-submitted result — for a student navigating back to a
 * mock exam they finished earlier. Returns the rank/percentile as computed
 * at submit time, not recomputed live: a result, once released, should not
 * quietly shift under the student reading it.
 */
export async function getMockExamResult(uid: string, mockExamId: string): Promise<MockExamResult | null> {
  const attemptSnap = await col.mockExamAttempts().doc(mockExamAttemptId(uid, mockExamId)).get();
  if (!attemptSnap.exists) return null;
  const attempt = attemptSnap.data() as MockExamAttempt;
  if (!attempt.submittedAt || !attempt.answers) return null;

  const examSnap = await col.mockExams().doc(mockExamId).get();
  if (!examSnap.exists) return null;
  const exam = examSnap.data() as MockExam;

  const questionSnaps = await adminDb().getAll(...attempt.questionOrder.map((id) => col.questions().doc(id)));
  const questions = questionSnaps
    .filter((s) => s.exists)
    .map((s) => s.data() as Question)
    .map((q) => ({
      ...toMockExamQuestion(q),
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      ...(attempt.answers?.[q.id] !== undefined ? { yourChoice: attempt.answers[q.id] } : {}),
    }));

  return {
    mockExamId: exam.id,
    title: exam.title,
    score: attempt.score ?? 0,
    correctCount: attempt.correctCount ?? 0,
    wrongCount: attempt.wrongCount ?? 0,
    unansweredCount: attempt.unansweredCount ?? 0,
    totalQuestions: questions.length,
    negativeMarking: exam.negativeMarking,
    topicBreakdown: attempt.topicBreakdown ?? {},
    rank: attempt.rank ?? 1,
    totalAttempts: attempt.totalAttempts ?? 1,
    percentile: attempt.percentile ?? 100,
    xpAwarded: 0,
    submittedAt: attempt.submittedAt,
    questions,
  };
}

/**
 * Rank and percentile among everyone who has submitted this mock exam.
 *
 * A bounded scan-and-narrow, same convention as the rest of the codebase
 * (see the note at the top of lib/queries.ts): a single equality filter
 * needs no composite index a browser-only setup could never deploy.
 */
async function rankAmongAttempts(
  mockExamId: string,
  ownAttemptDocId: string,
  ownScore: number,
): Promise<{ rank: number; totalAttempts: number; percentile: number }> {
  const snap = await col.mockExamAttempts().where("mockExamId", "==", mockExamId).limit(SCAN_WINDOW).get();
  const otherScores = snap.docs
    .filter((d) => d.id !== ownAttemptDocId)
    .map((d) => d.data() as MockExamAttempt)
    .filter((a) => a.submittedAt !== undefined)
    .map((a) => a.score ?? 0);

  const totalAttempts = otherScores.length + 1;
  const rank = 1 + otherScores.filter((s) => s > ownScore).length;
  const percentile = totalAttempts <= 1 ? 100 : Math.round(((totalAttempts - rank) / (totalAttempts - 1)) * 100);

  return { rank, totalAttempts, percentile };
}
