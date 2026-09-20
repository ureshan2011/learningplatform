/**
 * How a live-quiz answer turns into points.
 *
 * Split out of `arena.ts` because it is the only part of the Live Arena that
 * is arithmetic rather than I/O, and it is the part a student will argue
 * about. `arena.ts` reads the answers and writes the board; this decides what
 * goes on it.
 *
 * No `server-only` import: this is pure, and keeping it importable from a test
 * is the whole point of the split.
 */

/** Points for a correct answer, before the speed bonus. */
export const BASE_POINTS = 100;

/** The most speed can add — full at zero seconds, nothing at the buzzer. */
export const SPEED_POINTS = 50;

export interface RawAnswer {
  uid: string;
  choice: number;
  /** Reported by the client, and therefore clamped before it is believed. */
  msSinceShown: number;
}

export interface ScoredAnswer {
  uid: string;
  correct: boolean;
  points: number;
  /** The clamped elapsed time, used to break ties. */
  ms: number;
}

/**
 * Scores one question.
 *
 * `msSinceShown` comes from the student's own browser and is not trusted: it
 * is clamped to the question's window at both ends, so a skewed clock or a
 * hand-edited value buys a speed bonus in a class game and nothing that
 * affects a mark. A wrong answer scores zero regardless of speed — being fast
 * and wrong is not worth points.
 */
export function scoreAnswers(
  answers: RawAnswer[],
  correctIndex: number,
  windowMs: number,
): ScoredAnswer[] {
  return answers.map((answer) => {
    const correct = answer.choice === correctIndex;
    const ms = clamp(answer.msSinceShown, 0, windowMs);
    const bonus =
      correct && windowMs > 0 ? Math.round(SPEED_POINTS * (1 - ms / windowMs)) : 0;
    return { uid: answer.uid, correct, points: correct ? BASE_POINTS + bonus : 0, ms };
  });
}

export interface BoardRow {
  rank: number;
  uid: string;
  name: string;
  points: number;
}

/**
 * The top of the class, highest first, ties broken by who was quicker.
 *
 * Only students who scored appear: a board listing everyone who answered
 * wrongly with a zero beside their name is a punishment, not a game.
 */
export function buildBoard(
  scored: ScoredAnswer[],
  names: Map<string, string>,
  limit = 20,
): BoardRow[] {
  return scored
    .filter((s) => s.points > 0)
    .sort((a, b) => b.points - a.points || a.ms - b.ms)
    .slice(0, limit)
    .map((s, i) => ({
      rank: i + 1,
      uid: s.uid,
      name: names.get(s.uid) ?? "Student",
      points: s.points,
    }));
}

/** How the class split across the options — the bar chart under a closed question. */
export function optionCounts(answers: RawAnswer[], optionCount: number): number[] {
  const counts = new Array<number>(optionCount).fill(0);
  for (const answer of answers) {
    if (answer.choice >= 0 && answer.choice < optionCount) counts[answer.choice] += 1;
  }
  return counts;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}
