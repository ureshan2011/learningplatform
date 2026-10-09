/**
 * The shapes the Exam Pack's paper screens pass between server and browser.
 *
 * Client-safe and answer-free by construction: a `SittingQuestion` has no
 * `correctIndex`, so a paper in progress cannot leak its key through the props
 * of the component rendering it. The key only travels inside a
 * `ReviewQuestion`, which the server builds after the sitting is locked.
 */

import type { Bilingual, PaperId } from "@/lib/exam-pack/config";

export interface SittingQuestion {
  id: number;
  topic: string;
  /** A short code listing shown between the stem and the options. */
  code?: string;
  en: { stem: string; options: string[] };
  si: { stem: string; options: string[] };
}

export interface ReviewQuestion extends SittingQuestion {
  correctIndex: number;
  /** Why the answer is right — the walkthrough. */
  walkthrough?: string;
  /** Extra context: a predicted question's confidence and reasoning, or a replaced question's note. */
  note?: string;
  /** Absent when the student left it blank. */
  yourChoice?: number;
}

export interface SittingStart {
  paperId: PaperId;
  title: Bilingual;
  durationMinutes: number;
  /** When this student's clock started. The deadline is `startedAt + durationMinutes`. */
  startedAt: number;
  questions: SittingQuestion[];
  /** Answers already saved on the server — a reload or a second device picks up where they were. */
  answers: Record<string, number>;
}

export interface SittingResult {
  paperId: PaperId;
  title: Bilingual;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  /** Rank among every pack holder who has submitted this paper, 1 = top. */
  rank: number;
  totalSittings: number;
  /** Scored higher than this percentage of the others. */
  percentile: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  submittedAt: number;
  /** Marked on the last answers saved inside the time, because the submit came after it. */
  late?: boolean;
  questions: ReviewQuestion[];
}
