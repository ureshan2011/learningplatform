/**
 * SM-2-lite spaced repetition.
 *
 * Simplified from SuperMemo SM-2 to two grades — correct / incorrect —
 * because a practice MCQ carries no finer signal than "got it" or "didn't".
 * The ease factor still adapts per question, so a question a student keeps
 * missing comes back the same day, while one they've clearly mastered drifts
 * out to weeks. This is what turns "quiz" into "revision that remembers what
 * you're weak on."
 */

export const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

export interface SchedulingState {
  easeFactor: number;
  intervalDays: number;
}

export function nextSchedule(
  state: SchedulingState,
  correct: boolean,
  now: number = Date.now(),
): SchedulingState & { dueAt: number } {
  if (!correct) {
    // A miss resurfaces almost immediately rather than in a few days — the
    // whole point is catching the gap while the student is still thinking
    // about the topic, not three sessions later.
    return {
      easeFactor: Math.max(MIN_EASE_FACTOR, state.easeFactor - 0.2),
      intervalDays: 0,
      dueAt: now,
    };
  }

  const easeFactor = Math.max(MIN_EASE_FACTOR, state.easeFactor + 0.1);
  const intervalDays =
    state.intervalDays <= 0 ? 1 : state.intervalDays === 1 ? 3 : Math.round(state.intervalDays * easeFactor);

  return { easeFactor, intervalDays, dueAt: now + intervalDays * 24 * 60 * 60 * 1000 };
}
