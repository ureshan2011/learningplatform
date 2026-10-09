import "server-only";

import { adminDb, col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { EXAM_PACK_ID, PAPER_IDS, type PaperId } from "@/lib/exam-pack/config";
import { getPaper, markable, toReviewQuestion, toSittingQuestion } from "@/lib/exam-pack/papers";
import { cleanAnswers, markPaper, rankAmong } from "@/lib/exam-pack/scoring";
import type { SittingResult, SittingStart } from "@/lib/exam-pack/paper-types";
import type { PaperSitting } from "@/lib/types";

/**
 * Timed, server-scored sittings of the Exam Pack's papers.
 *
 * The mock-exam engine's rules, applied to static bilingual papers: the clock
 * starts on the server and survives a reload, the key never reaches the
 * browser until the paper is locked, and the first sitting is the one that is
 * ranked against every other pack holder. A student cannot submit twice and
 * cannot revise after seeing the answers.
 *
 * Callers check `hasAccess(uid, EXAM_PACK_ID)` first. Nothing in here does —
 * the access check stays in exactly one function (CLAUDE.md, rule 1).
 */

/** Clock drift and a slow phone's submit are forgiven this long past the deadline. */
const GRACE_MS = 90 * 1000;

/** How many sittings to scan for a rank — the single-filter, narrow-in-memory rule in lib/queries.ts. */
const SCAN_WINDOW = 1000;

export function sittingId(uid: string, paperId: PaperId): string {
  return `${uid}_${paperId}`;
}

export type StartOutcome = { state: "open"; start: SittingStart } | { state: "submitted" };

/**
 * Starts this student's sitting, or resumes it.
 *
 * Idempotent: a refresh mid-paper gets the same `startedAt` back, so the timer
 * carries on rather than resetting to two hours.
 */
export async function startSitting(params: {
  uid: string;
  tenantId: string;
  paperId: PaperId;
  /** A teacher, admin or test account rehearsing — never ranked against students. */
  unranked: boolean;
}): Promise<StartOutcome> {
  const paper = getPaper(params.paperId);
  const ref = col.paperSittings().doc(sittingId(params.uid, params.paperId));

  const sitting = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? (snap.data() as PaperSitting) : undefined;
    if (existing) return existing;

    const now = Date.now();
    const fresh: PaperSitting = {
      id: ref.id,
      tenantId: params.tenantId,
      uid: params.uid,
      subjectId: EXAM_PACK_ID,
      paperId: params.paperId,
      startedAt: now,
      ...(params.unranked ? { unranked: true } : {}),
      updatedAt: now,
    };
    tx.set(ref, fresh);
    return fresh;
  });

  if (sitting.submittedAt) return { state: "submitted" };

  // Opened again after the time ran out — the tab was closed mid-paper. Lock
  // it on what was saved rather than reopening a clock that is already at zero.
  if (Date.now() > deadlineOf(sitting, paper.durationMinutes)) {
    await expireSitting({ uid: params.uid, paperId: params.paperId });
    return { state: "submitted" };
  }

  return {
    state: "open",
    start: {
      paperId: paper.id,
      title: paper.title,
      durationMinutes: paper.durationMinutes,
      startedAt: sitting.startedAt,
      questions: paper.questions.map(toSittingQuestion),
      answers: sitting.answers ?? {},
    },
  };
}

/** The instant after which a sitting's answers can no longer change. */
function deadlineOf(sitting: PaperSitting, durationMinutes: number): number {
  return sitting.startedAt + durationMinutes * 60 * 1000 + GRACE_MS;
}

/**
 * Saves the answers so far. Called by the paper screen as the student goes.
 *
 * Refused once the time is up, so the saved answers are always ones given
 * inside the paper's two hours — which is what lets a late submit be marked on
 * them fairly instead of being thrown away.
 */
export async function saveSittingAnswers(params: {
  uid: string;
  paperId: PaperId;
  answers: Record<string, unknown>;
}): Promise<"saved" | "closed"> {
  const paper = getPaper(params.paperId);
  const answers = cleanAnswers(params.answers, markable(paper));
  const ref = col.paperSittings().doc(sittingId(params.uid, params.paperId));

  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return "closed";
    const sitting = snap.data() as PaperSitting;
    const now = Date.now();
    if (sitting.submittedAt || now > deadlineOf(sitting, paper.durationMinutes)) return "closed";
    tx.update(ref, { answers, savedAt: now, updatedAt: now });
    return "saved";
  });
}

/**
 * Marks and locks a sitting.
 *
 * The score is computed here from the key this process holds — never taken
 * from the browser. The lock is a transaction, so two submits racing from two
 * tabs score the paper once.
 *
 * A submit that arrives after the deadline is not refused: a phone that went
 * to sleep on the last question should not cost a student the paper. It is
 * marked on the last answers saved *inside* the time instead, so nothing
 * answered after the clock ran out can count.
 */
export async function submitSitting(params: {
  uid: string;
  paperId: PaperId;
  answers: Record<string, unknown>;
}): Promise<SittingResult> {
  const paper = getPaper(params.paperId);
  const questions = markable(paper);
  const ref = col.paperSittings().doc(sittingId(params.uid, params.paperId));

  const snap = await ref.get();
  if (!snap.exists) throw new Error("NOT_STARTED");
  const current = snap.data() as PaperSitting;
  if (current.submittedAt) throw new Error("ALREADY_SUBMITTED");

  const late = Date.now() > deadlineOf(current, paper.durationMinutes);
  const answers = late ? cleanAnswers(current.answers ?? {}, questions) : cleanAnswers(params.answers, questions);
  return lock({ ref: ref.id, paperId: params.paperId, answers, late });
}

/**
 * Locks a sitting whose time ran out with no submit at all — the tab was
 * closed. Marked on whatever was autosaved, so the student can review it
 * rather than finding a paper stuck open forever.
 */
export async function expireSitting(params: { uid: string; paperId: PaperId }): Promise<void> {
  const paper = getPaper(params.paperId);
  const ref = col.paperSittings().doc(sittingId(params.uid, params.paperId));
  const snap = await ref.get();
  if (!snap.exists) return;
  const sitting = snap.data() as PaperSitting;
  if (sitting.submittedAt || Date.now() <= deadlineOf(sitting, paper.durationMinutes)) return;

  try {
    await lock({
      ref: ref.id,
      paperId: params.paperId,
      answers: cleanAnswers(sitting.answers ?? {}, markable(paper)),
      late: true,
    });
  } catch (err) {
    // Another request locked it first — which is the outcome wanted.
    if ((err as Error).message !== "ALREADY_SUBMITTED") throw err;
  }
}

/** Marks, ranks and locks — the one write that turns a sitting into a result. */
async function lock(params: {
  ref: string;
  paperId: PaperId;
  answers: Record<string, number>;
  late: boolean;
}): Promise<SittingResult> {
  const paper = getPaper(params.paperId);
  const marked = markPaper(markable(paper), params.answers);
  const ref = col.paperSittings().doc(params.ref);

  // Rank against everyone already submitted. Read before the lock so the scan
  // stays outside the transaction; two sittings submitted in the same second
  // are a tie the next reader resolves, not a corruption.
  const others = await otherScores(params.paperId, ref.id);
  const { rank, total, percentile } = rankAmong(marked.correct, others);

  const now = Date.now();
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("NOT_STARTED");
    if ((snap.data() as PaperSitting).submittedAt) throw new Error("ALREADY_SUBMITTED");
    tx.set(
      ref,
      {
        answers: params.answers,
        submittedAt: now,
        ...(params.late ? { late: true } : {}),
        correctCount: marked.correct,
        wrongCount: marked.wrong,
        unansweredCount: marked.unanswered,
        totalQuestions: marked.total,
        topicBreakdown: marked.topicBreakdown,
        rank,
        totalSittings: total,
        percentile,
        updatedAt: now,
      } satisfies Partial<PaperSitting>,
      { merge: true },
    );
  });

  return {
    paperId: paper.id,
    title: paper.title,
    correctCount: marked.correct,
    wrongCount: marked.wrong,
    unansweredCount: marked.unanswered,
    totalQuestions: marked.total,
    rank,
    totalSittings: total,
    percentile,
    topicBreakdown: marked.topicBreakdown,
    submittedAt: now,
    ...(params.late ? { late: true } : {}),
    questions: paper.questions.map((q) => toReviewQuestion(q, params.answers[String(q.id)])),
  };
}

/** The locked result, as it was ranked when submitted — a result does not shift under the student reading it. */
export async function getSittingResult(uid: string, paperId: PaperId): Promise<SittingResult | null> {
  const snap = await col.paperSittings().doc(sittingId(uid, paperId)).get();
  if (!snap.exists) return null;
  const sitting = snap.data() as PaperSitting;
  if (!sitting.submittedAt) return null;

  const paper = getPaper(paperId);
  const answers = sitting.answers ?? {};
  return {
    paperId: paper.id,
    title: paper.title,
    correctCount: sitting.correctCount ?? 0,
    wrongCount: sitting.wrongCount ?? 0,
    unansweredCount: sitting.unansweredCount ?? paper.questions.length,
    totalQuestions: sitting.totalQuestions ?? paper.questions.length,
    rank: sitting.rank ?? 1,
    totalSittings: sitting.totalSittings ?? 1,
    percentile: sitting.percentile ?? 100,
    topicBreakdown: sitting.topicBreakdown ?? {},
    submittedAt: sitting.submittedAt,
    ...(sitting.late ? { late: true } : {}),
    questions: paper.questions.map((q) => toReviewQuestion(q, answers[String(q.id)])),
  };
}

/** Every paper's sitting for one student, for the status chips on the pack page. Two reads at most. */
export async function getMySittings(uid: string): Promise<Partial<Record<PaperId, PaperSitting>>> {
  const refs = PAPER_IDS.map((id) => col.paperSittings().doc(sittingId(uid, id)));
  const snaps = await adminDb().getAll(...refs);
  const out: Partial<Record<PaperId, PaperSitting>> = {};
  snaps.forEach((snap, i) => {
    if (snap.exists) out[PAPER_IDS[i]] = snap.data() as PaperSitting;
  });
  return out;
}

/** How many pack holders have submitted each paper — the "ranked against N students" line. */
export async function countSubmitted(paperId: PaperId): Promise<number> {
  const snap = await col.paperSittings().where("paperId", "==", paperId).limit(SCAN_WINDOW).get();
  return snap.docs
    .map((d) => d.data() as PaperSitting)
    .filter((s) => s.tenantId === publicEnv.tenantId && s.submittedAt && !s.unranked).length;
}

async function otherScores(paperId: PaperId, ownId: string): Promise<number[]> {
  const snap = await col.paperSittings().where("paperId", "==", paperId).limit(SCAN_WINDOW).get();
  return snap.docs
    .filter((d) => d.id !== ownId)
    .map((d) => d.data() as PaperSitting)
    .filter((s) => s.tenantId === publicEnv.tenantId && s.submittedAt !== undefined && !s.unranked)
    .map((s) => s.correctCount ?? 0);
}
