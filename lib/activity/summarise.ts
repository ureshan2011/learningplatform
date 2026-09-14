import type { ActivityDay } from "@/lib/types";
import { describeEvent, type ActivityGroup } from "@/lib/activity/describe";

/**
 * The four or five facts a teacher wants before reading any rows.
 *
 * A timeline answers "what did they do"; this answers "are they using it",
 * which is the question actually being asked when someone opens a student's
 * record. Days active matters more than page count — a student with 200 views
 * in one panicked evening is not the same as one who shows up twice a week.
 */
export interface ActivitySummary {
  /** Days in the window on which they did anything at all. */
  activeDays: number;
  /**
   * Study actions in the window — practice, a mock exam, the Code Lab, a live
   * class. Not page views: ordinary browsing is not logged (see
   * `lib/activity/policy.ts`), so this counts things done, not screens opened.
   */
  studyActions: number;
  downloads: number;
  lastActiveAt: number | null;
  /** Where their time went, most-used first. Empty when there is nothing yet. */
  topAreas: { group: ActivityGroup; count: number }[];
  /** The longest run of consecutive active days, ending at the most recent one. */
  currentStreak: number;
}

export function summariseActivity(days: ActivityDay[]): ActivitySummary {
  let studyActions = 0;
  let downloads = 0;
  let lastActiveAt: number | null = null;
  const areas = new Map<ActivityGroup, number>();

  for (const day of days) {
    for (const event of day.events) {
      if (event.kind === "download") downloads += 1;
      else if (event.kind === "page") studyActions += 1;

      if (lastActiveAt === null || event.at > lastActiveAt) lastActiveAt = event.at;

      const { group } = describeEvent(event);
      areas.set(group, (areas.get(group) ?? 0) + 1);
    }
  }

  return {
    activeDays: days.filter((d) => d.events.length > 0).length,
    studyActions,
    downloads,
    lastActiveAt,
    topAreas: [...areas]
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4),
    currentStreak: streak(days.map((d) => d.date)),
  };
}

/**
 * Consecutive active days counting back from the most recent one.
 *
 * Counted from their last active day rather than from today, so a student who
 * studied every day last week and has not opened it since reads as a 7-day run
 * that has stopped — which is the useful thing to know — instead of zero.
 */
function streak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort((a, b) => b.localeCompare(a));

  let count = 1;
  let previous = Date.parse(`${sorted[0]}T00:00:00Z`);

  for (const date of sorted.slice(1)) {
    const current = Date.parse(`${date}T00:00:00Z`);
    if (previous - current !== 24 * 60 * 60 * 1000) break;
    count += 1;
    previous = current;
  }
  return count;
}
