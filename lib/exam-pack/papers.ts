import "server-only";

import {
  AL_ICT_2026_PAPER1,
  PAPER_DURATION_MINUTES,
  PAPER_TITLE_EN,
  PAPER_TITLE_SI,
} from "@/lib/content/al-ict-2026-paper1";
import {
  AL_ICT_2027_PREDICTED_PAPER1,
  PREDICTED_PAPER1_DURATION_MINUTES,
  PREDICTED_PAPER1_TITLE_EN,
  PREDICTED_PAPER1_TITLE_SI,
} from "@/lib/content/al-ict-2027-predicted-paper1";
import { AL_ICT_2026_PAPER1_WALKTHROUGH } from "@/lib/content/al-ict-2026-paper1-walkthrough";
import { AL_ICT_2027_PREDICTED_PAPER1_WALKTHROUGH } from "@/lib/content/al-ict-2027-predicted-paper1-walkthrough";
import type { Bilingual, PaperId } from "@/lib/exam-pack/config";
import type { ReviewQuestion, SittingQuestion } from "@/lib/exam-pack/paper-types";
import type { MarkableQuestion } from "@/lib/exam-pack/scoring";

/**
 * The Exam Pack's papers, with their answer keys — server-only.
 *
 * The content files are static TypeScript, and the free 2026 page already
 * imports its own; the difference here is what reaches a browser. A sitting
 * in progress is sent `SittingQuestion`s, which have no key. The key and the
 * walkthrough leave the server only inside a `ReviewQuestion`, built after the
 * sitting is locked, or on the gated print copy.
 *
 * Adding a paper is adding an entry here and an id to `PAPER_IDS`: the sitting
 * engine, the ranking and the screens are all driven from this list.
 */

export interface PaperQuestion extends SittingQuestion {
  correctIndex: number;
  walkthrough?: string;
  note?: string;
}

export interface PaperDef {
  id: PaperId;
  title: Bilingual;
  /** "Predicted" papers carry the framing disclaimer on every screen; a past paper does not need it. */
  kind: "predicted" | "past";
  year: number;
  durationMinutes: number;
  /** One line under the title on the pack page. */
  blurb: Bilingual;
  questions: PaperQuestion[];
  /** Shown free before purchase, answers and all — the "try before you buy" set. */
  previewIds: number[];
}

const BAND: Record<"high" | "medium" | "low", string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

const PREDICTED_2027_P1: PaperDef = {
  id: "predicted-2027-p1",
  title: { en: PREDICTED_PAPER1_TITLE_EN, si: PREDICTED_PAPER1_TITLE_SI },
  kind: "predicted",
  year: 2027,
  durationMinutes: PREDICTED_PAPER1_DURATION_MINUTES,
  blurb: {
    en: "50 questions on the topics most likely to come up in 2027, ranked by confidence.",
    si: "2027 එන්න වැඩිම ඉඩ තියෙන topics වලින් ප්‍රශ්න 50ක්, confidence එක අනුව.",
  },
  questions: AL_ICT_2027_PREDICTED_PAPER1.map((q) => ({
    id: q.id,
    topic: q.topic,
    ...(q.code ? { code: q.code } : {}),
    en: { stem: q.en.stem, options: [...q.en.options] },
    si: { stem: q.si.stem, options: [...q.si.options] },
    correctIndex: q.correctIndex,
    walkthrough: AL_ICT_2027_PREDICTED_PAPER1_WALKTHROUGH[q.id],
    note: `${BAND[q.confidenceBand]} — ${q.rationale}`,
  })),
  previewIds: [1, 4, 18, 31, 44],
};

const AL_2026_P1: PaperDef = {
  id: "al-2026-p1",
  title: { en: PAPER_TITLE_EN, si: PAPER_TITLE_SI },
  kind: "past",
  year: 2026,
  durationMinutes: PAPER_DURATION_MINUTES,
  blurb: {
    en: "Last year's real paper, under exam conditions, with every answer worked through.",
    si: "පහුගිය අවුරුද්දේ ඇත්ත paper එක, exam එකේ වගේම වෙලාවට, හැම answer එකක්ම පැහැදිලි කරලා.",
  },
  questions: AL_ICT_2026_PAPER1.map((q) => ({
    id: q.id,
    topic: q.topic,
    en: { stem: q.en.stem, options: [...q.en.options] },
    si: { stem: q.si.stem, options: [...q.si.options] },
    correctIndex: q.correctIndex,
    walkthrough: AL_ICT_2026_PAPER1_WALKTHROUGH[q.id],
    ...(q.replaced
      ? {
          note: "This question replaces one the original scan could not recover. It tests the same idea at the same difficulty.",
        }
      : {}),
  })),
  previewIds: [8, 16, 36],
};

const PAPERS: Record<PaperId, PaperDef> = {
  "predicted-2027-p1": PREDICTED_2027_P1,
  "al-2026-p1": AL_2026_P1,
};

export function getPaper(id: PaperId): PaperDef {
  return PAPERS[id];
}

export function listPapers(): PaperDef[] {
  return [PREDICTED_2027_P1, AL_2026_P1];
}

/** A question as a student sees it mid-paper. Built field by field so a new key field can never leak by spread. */
export function toSittingQuestion(q: PaperQuestion): SittingQuestion {
  return {
    id: q.id,
    topic: q.topic,
    ...(q.code ? { code: q.code } : {}),
    en: q.en,
    si: q.si,
  };
}

export function toReviewQuestion(q: PaperQuestion, yourChoice?: number): ReviewQuestion {
  return {
    ...toSittingQuestion(q),
    correctIndex: q.correctIndex,
    ...(q.walkthrough ? { walkthrough: q.walkthrough } : {}),
    ...(q.note ? { note: q.note } : {}),
    ...(yourChoice !== undefined ? { yourChoice } : {}),
  };
}

export function markable(paper: PaperDef): MarkableQuestion[] {
  return paper.questions.map((q) => ({
    id: q.id,
    topic: q.topic,
    correctIndex: q.correctIndex,
    optionCount: q.en.options.length,
  }));
}

/** The free sample, answers and walkthroughs included — what a visitor sees before paying. */
export function previewQuestions(): Array<{ paperTitle: Bilingual; question: ReviewQuestion }> {
  return listPapers().flatMap((paper) =>
    paper.questions
      .filter((q) => paper.previewIds.includes(q.id))
      .map((q) => ({ paperTitle: paper.title, question: toReviewQuestion(q) })),
  );
}
