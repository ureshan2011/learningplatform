import "server-only";

import { adminDb, col, attemptId, progressId } from "@/lib/firebase/admin";
import { colomboDateString } from "@/lib/format";
import { DEFAULT_EASE_FACTOR, nextSchedule } from "@/lib/practice/spaced-repetition";
import type { Progress, Question, QuestionAttempt } from "@/lib/types";

/** How many attempt/question documents to scan before narrowing in memory — see lib/queries.ts. */
const SCAN_WINDOW = 300;

/** A question stripped of everything that would let a client see the answer before submitting. */
export interface PracticeQuestion {
  id: string;
  subjectId: string;
  topic: string;
  medium: string;
  commandWord?: string;
  text: string;
  options: string[];
}

export interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  misconception?: string;
  xpAwarded: number;
  progress: { xp: number; level: number; streakDays: number };
}

const XP_CORRECT = 10;
const XP_ATTEMPT = 2;
const WEAK_TOPIC_THRESHOLD = 0.6;
const WEAK_TOPIC_MIN_ATTEMPTS = 2;

function toPracticeQuestion(q: Question): PracticeQuestion {
  return {
    id: q.id,
    subjectId: q.subjectId,
    topic: q.topic,
    medium: q.medium,
    commandWord: q.commandWord,
    text: q.text,
    options: q.options,
  };
}

/** Fisher-Yates, seeded only by call order — good enough to avoid the same five questions every time. */
export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function attemptsForSubject(uid: string, subjectId: string): Promise<QuestionAttempt[]> {
  const snap = await col.attempts().where("uid", "==", uid).limit(SCAN_WINDOW).get();
  return snap.docs.map((d) => d.data() as QuestionAttempt).filter((a) => a.subjectId === subjectId);
}

/**
 * Builds one practice session: questions due for review first (oldest due
 * first), then new questions biased toward the student's weak topics, then
 * anything else. Never re-serves a question already due in the future — that
 * would defeat the point of spacing it out.
 */
export async function nextQuestionBatch(
  uid: string,
  subjectId: string,
  count = 10,
): Promise<PracticeQuestion[]> {
  const now = Date.now();
  const attempts = await attemptsForSubject(uid, subjectId);
  const seenIds = new Set(attempts.map((a) => a.questionId));

  const due = attempts
    .filter((a) => a.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, count);

  const dueQuestions =
    due.length === 0
      ? []
      : (await adminDb().getAll(...due.map((a) => col.questions().doc(a.questionId))))
          .filter((s) => s.exists)
          .map((s) => s.data() as Question);

  const picked: Question[] = [...dueQuestions];

  if (picked.length < count) {
    const progressSnap = await col.progress().doc(progressId(uid, subjectId)).get();
    const weakTopics = new Set((progressSnap.data() as Progress | undefined)?.weakTopics ?? []);

    const bankSnap = await col.questions().where("subjectId", "==", subjectId).limit(SCAN_WINDOW).get();
    const candidates = bankSnap.docs
      .map((d) => d.data() as Question)
      .filter((q) => q.active && !seenIds.has(q.id));

    const weak = shuffle(candidates.filter((q) => weakTopics.has(q.topic)));
    const rest = shuffle(candidates.filter((q) => !weakTopics.has(q.topic)));

    for (const q of [...weak, ...rest]) {
      if (picked.length >= count) break;
      picked.push(q);
    }
  }

  return shuffle(picked).map(toPracticeQuestion);
}

/**
 * Scores one answer, updates the spaced-repetition schedule, and awards XP —
 * the only writer of `attempts` and `progress`, matching the rest of the
 * codebase's rule that anything gamified is server-owned.
 */
export async function recordAnswer(params: {
  uid: string;
  tenantId: string;
  subjectId: string;
  questionId: string;
  choiceIndex: number;
}): Promise<AnswerResult> {
  const { uid, tenantId, subjectId, questionId, choiceIndex } = params;

  const questionSnap = await col.questions().doc(questionId).get();
  if (!questionSnap.exists) throw new Error("QUESTION_NOT_FOUND");
  const question = questionSnap.data() as Question;

  const correct = choiceIndex === question.correctIndex;
  const now = Date.now();

  const attemptRef = col.attempts().doc(attemptId(uid, questionId));
  const attemptSnap = await attemptRef.get();
  const existing = attemptSnap.data() as QuestionAttempt | undefined;

  const schedule = nextSchedule(
    { easeFactor: existing?.easeFactor ?? DEFAULT_EASE_FACTOR, intervalDays: existing?.intervalDays ?? 0 },
    correct,
    now,
  );

  const attempt: QuestionAttempt = {
    id: attemptRef.id,
    uid,
    tenantId,
    subjectId,
    questionId,
    topic: question.topic,
    timesSeen: (existing?.timesSeen ?? 0) + 1,
    timesCorrect: (existing?.timesCorrect ?? 0) + (correct ? 1 : 0),
    easeFactor: schedule.easeFactor,
    intervalDays: schedule.intervalDays,
    dueAt: schedule.dueAt,
    lastChoice: choiceIndex,
    lastCorrect: correct,
    lastAnsweredAt: now,
  };
  await attemptRef.set(attempt);

  const xpAwarded = correct ? XP_CORRECT : XP_ATTEMPT;
  const progress = await updateProgress({ uid, tenantId, subjectId, xpDelta: xpAwarded, now });

  return {
    correct,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    misconception: correct ? undefined : question.misconceptions?.[choiceIndex],
    xpAwarded,
    progress: { xp: progress.xp, level: progress.level, streakDays: progress.streakDays },
  };
}

/**
 * Reads, updates and writes one subject's `Progress` doc: XP, level, streak
 * (one bump per calendar day, however many times this is called that day)
 * and weak-topic detection.
 *
 * Shared by practice (`recordAnswer`, one call per question) and mock exams
 * (`lib/mockexams/engine.ts`, one call per submitted paper) — the streak and
 * weak-topic logic is identical either way, only the XP amount differs.
 */
export async function updateProgress(params: {
  uid: string;
  tenantId: string;
  subjectId: string;
  xpDelta: number;
  now: number;
}): Promise<Progress> {
  const { uid, tenantId, subjectId, xpDelta, now } = params;
  const ref = col.progress().doc(progressId(uid, subjectId));
  const snap = await ref.get();
  const existing = snap.data() as Progress | undefined;

  const today = colomboDateString(now);
  const { streakDays, streakGraceRemaining } = advanceStreak(existing, today, now);

  const xp = (existing?.xp ?? 0) + xpDelta;
  const weakTopics = await recomputeWeakTopics(uid, subjectId);

  const progress: Progress = {
    uid,
    subjectId,
    tenantId,
    xp,
    level: 1 + Math.floor(xp / 150),
    streakDays,
    streakGraceRemaining,
    lastActiveDay: today,
    weakTopics,
    riskScore: existing?.riskScore ?? 0,
    updatedAt: now,
  };
  await ref.set(progress, { merge: true });
  return progress;
}

/** One grace day absorbs a missed day without snapping the streak — a broken streak makes students quit, not try harder. */
function advanceStreak(
  existing: Progress | undefined,
  today: string,
  now: number,
): { streakDays: number; streakGraceRemaining: number } {
  if (!existing || !existing.lastActiveDay) {
    return { streakDays: 1, streakGraceRemaining: 2 };
  }
  if (existing.lastActiveDay === today) {
    return { streakDays: existing.streakDays, streakGraceRemaining: existing.streakGraceRemaining };
  }

  const yesterday = colomboDateString(now - 24 * 60 * 60 * 1000);
  if (existing.lastActiveDay === yesterday) {
    return { streakDays: existing.streakDays + 1, streakGraceRemaining: existing.streakGraceRemaining };
  }
  if (existing.streakGraceRemaining > 0) {
    return { streakDays: existing.streakDays + 1, streakGraceRemaining: existing.streakGraceRemaining - 1 };
  }
  return { streakDays: 1, streakGraceRemaining: 2 };
}

export interface CertificateEligibility {
  eligible: boolean;
  questionsAnswered: number;
  accuracyPct: number;
  requiredQuestions: number;
  requiredAccuracyPct: number;
}

const CERTIFICATE_MIN_QUESTIONS = 15;
const CERTIFICATE_MIN_ACCURACY = 0.7;

/**
 * Whether a student has earned the Practice Mastery certificate for a
 * subject: a real bar tied to actual questions answered and accuracy, not
 * "signed up" — so the certificate stays meaningful enough that a parent or
 * a friend seeing it shared is genuine social proof, not noise.
 */
export async function getCertificateEligibility(
  uid: string,
  subjectId: string,
): Promise<CertificateEligibility> {
  const attempts = await attemptsForSubject(uid, subjectId);
  const totalSeen = attempts.reduce((s, a) => s + a.timesSeen, 0);
  const totalCorrect = attempts.reduce((s, a) => s + a.timesCorrect, 0);
  const accuracy = totalSeen === 0 ? 0 : totalCorrect / totalSeen;

  return {
    eligible: attempts.length >= CERTIFICATE_MIN_QUESTIONS && accuracy >= CERTIFICATE_MIN_ACCURACY,
    questionsAnswered: attempts.length,
    accuracyPct: Math.round(accuracy * 100),
    requiredQuestions: CERTIFICATE_MIN_QUESTIONS,
    requiredAccuracyPct: Math.round(CERTIFICATE_MIN_ACCURACY * 100),
  };
}

async function recomputeWeakTopics(uid: string, subjectId: string): Promise<string[]> {
  const attempts = await attemptsForSubject(uid, subjectId);
  const byTopic = new Map<string, { seen: number; correct: number }>();

  for (const a of attempts) {
    const bucket = byTopic.get(a.topic) ?? { seen: 0, correct: 0 };
    bucket.seen += a.timesSeen;
    bucket.correct += a.timesCorrect;
    byTopic.set(a.topic, bucket);
  }

  return [...byTopic.entries()]
    .filter(([, s]) => s.seen >= WEAK_TOPIC_MIN_ATTEMPTS && s.correct / s.seen < WEAK_TOPIC_THRESHOLD)
    .sort((a, b) => a[1].correct / a[1].seen - b[1].correct / b[1].seen)
    .slice(0, 3)
    .map(([topic]) => topic);
}
