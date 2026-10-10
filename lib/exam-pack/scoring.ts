/**
 * Marking an Exam Pack paper, and ranking it.
 *
 * Pure and dependency-free so `node --test` runs it as it is. The sitting
 * engine calls these with the answer key it holds server-side; nothing here is
 * ever given a score the browser worked out.
 *
 * No negative marking: A/L ICT Paper I does not deduct for a wrong answer, and
 * a practice paper that marks differently from the real one teaches students
 * the wrong habit — leaving questions blank.
 */

export interface MarkableQuestion {
  id: number;
  topic: string;
  correctIndex: number;
  optionCount: number;
}

export interface Marked {
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
}

/**
 * Keeps only answers to questions on this paper, with an option index that
 * exists. Anything else in the submission is dropped rather than refused: a
 * browser extension adding a stray field must not cost a student their paper.
 */
export function cleanAnswers(
  raw: Record<string, unknown>,
  questions: ReadonlyArray<Pick<MarkableQuestion, "id" | "optionCount">>,
): Record<string, number> {
  const byId = new Map(questions.map((q) => [String(q.id), q.optionCount]));
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    const options = byId.get(key);
    if (options === undefined) continue;
    if (typeof value !== "number" || !Number.isInteger(value)) continue;
    if (value < 0 || value >= options) continue;
    out[key] = value;
  }
  return out;
}

export function markPaper(questions: ReadonlyArray<MarkableQuestion>, answers: Record<string, number>): Marked {
  const topicBreakdown: Record<string, { correct: number; total: number }> = {};
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  for (const q of questions) {
    const bucket = topicBreakdown[q.topic] ?? { correct: 0, total: 0 };
    bucket.total += 1;
    const choice = answers[String(q.id)];
    if (choice === undefined) {
      unanswered += 1;
    } else if (choice === q.correctIndex) {
      correct += 1;
      bucket.correct += 1;
    } else {
      wrong += 1;
    }
    topicBreakdown[q.topic] = bucket;
  }

  return { correct, wrong, unanswered, total: questions.length, topicBreakdown };
}

/**
 * Where a score sits among everyone else's.
 *
 * Ties share the better rank — two students on 41 are both "3rd", never 3rd
 * and 4th by the order they happened to submit in. Percentile is the share of
 * the others this score beat outright.
 */
export function rankAmong(own: number, others: ReadonlyArray<number>): {
  rank: number;
  total: number;
  percentile: number;
} {
  const total = others.length + 1;
  const rank = 1 + others.filter((s) => s > own).length;
  const beaten = others.filter((s) => s < own).length;
  const percentile = others.length === 0 ? 100 : Math.round((beaten / others.length) * 100);
  return { rank, total, percentile };
}

/** The weakest topics first — what the result screen tells a student to revise. */
export function weakestTopics(
  breakdown: Record<string, { correct: number; total: number }>,
  limit = 3,
): Array<{ topic: string; correct: number; total: number }> {
  return Object.entries(breakdown)
    .map(([topic, b]) => ({ topic, ...b }))
    .filter((t) => t.correct < t.total)
    .sort((a, b) => a.correct / a.total - b.correct / b.total || b.total - a.total)
    .slice(0, limit);
}
