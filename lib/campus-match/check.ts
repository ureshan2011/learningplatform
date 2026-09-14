import "server-only";

import newest from "@/lib/content/ugc/cutoffs/2025-2026.json";
import previous from "@/lib/content/ugc/cutoffs/2022-2023.json";
import districts from "@/lib/content/ugc/districts.json";
import { NQC, type CutoffValue } from "@/lib/campus-match/forecast";
import { admitsStream, findCourse } from "@/lib/campus-match/courses";

/**
 * The free checker's answer: which courses a student's stream can apply for,
 * and what each one's cut-off was in their district last round.
 *
 * Free tier only. Published cut-offs are public data and staying public is what
 * ranks; the forecast for the coming round is what is sold. Nothing here
 * forecasts anything.
 *
 * The dataset never leaves the server. The client sends five values and gets
 * back a few dozen rows, not ~52,000 cells.
 */

export type Trend = "up" | "down" | "flat" | "unknown";

export interface CheckRow {
  course: string;
  university: string;
  /** Last published cut-off in this district, or null where it was NQC. */
  lastCutoff: number | null;
  /** Which way it has moved across the rounds in between. */
  trend: Trend;
  /** How far the student's Z sits above (+) or below (−) that cut-off. */
  gap: number | null;
  /** The handbook course code, where the title could be matched. */
  code?: string;
  /** True where the handbook's rules were not reduced to a machine rule. */
  checkHandbook: boolean;
  /** Set where the handbook says a practical or aptitude test is required. */
  aptitudeTest?: boolean;
  /** Subjects this course's rules name that the student ticked. */
  matchedSubjects?: string[];
  handbookPage?: number;
}

export interface CheckResult {
  rows: CheckRow[];
  /** What the rows were read from, for the source line under them. */
  round: string;
  coverYear: string;
  districtName: string;
  /**
   * Courses published for this district whose title could not be matched to a
   * handbook entry, and so could not be stream-checked. Counted rather than
   * listed: showing a Commerce course to a Biological Science student because
   * its title did not join is worse than not showing it.
   */
  unmatched: number;
}

const DISTRICT_NAMES = new Map(districts.districts.map((d) => [d.key, d.name]));

const previousByKey = new Map(
  previous.rows.map((r) => [`${r.course}||${r.university}`, r.districts as Record<string, CutoffValue>]),
);

function trendOf(now: number, then: CutoffValue | undefined): Trend {
  if (typeof then !== "number") return "unknown";
  const change = now - then;
  // A tenth of a Z over three rounds is movement; anything less is noise.
  if (change > 0.1) return "up";
  if (change < -0.1) return "down";
  return "flat";
}

export interface CheckInput {
  z: number;
  district: string;
  stream: string;
  passes?: string[];
}

export function checkEligibility(input: CheckInput): CheckResult {
  const passes = new Set(input.passes ?? []);
  const rows: CheckRow[] = [];
  let unmatched = 0;

  for (const row of newest.rows) {
    const match = findCourse(row.course, row.university);

    // Stream is the filter, and the only one. The handbook writes its subject
    // rules as prose with alternatives, so none of them is reduced to a machine
    // rule — see `eligibilityVerify` in courses.json. Filtering on a guessed
    // subject rule would tell a student they cannot apply for something they
    // can, which is worse than showing a row with "check handbook" on it.
    if (!match) {
      unmatched += 1;
      continue;
    }
    const course = match.course;
    if (!admitsStream(course, input.stream)) {
      continue;
    }

    const value = (row.districts as Record<string, CutoffValue>)[input.district];
    const lastCutoff = typeof value === "number" ? value : null;
    const before = previousByKey.get(`${row.course}||${row.university}`)?.[input.district];

    rows.push({
      course: row.course,
      university: row.university,
      lastCutoff,
      trend: lastCutoff === null ? "unknown" : trendOf(lastCutoff, before),
      gap: lastCutoff === null ? null : Math.round((input.z - lastCutoff) * 10000) / 10000,
      ...(match.approximate ? {} : { code: course.code }),
      ...(match.approximate ? {} : { handbookPage: course.handbookPage }),
      // True for every course today: the handbook writes its rules as prose and
      // none of them is reduced to a machine rule.
      checkHandbook: course.eligibilityVerify,
      ...(course.aptitudeTest ? { aptitudeTest: true } : {}),
      ...(passes.size > 0
        ? { matchedSubjects: (course.subjects ?? []).filter((s) => passes.has(s)) }
        : {}),
    });
  }

  // Nearest the student's Z first: the courses they are closest to are the ones
  // the decision actually turns on. A district with no published cut-off sorts
  // last — there is nothing to be near.
  rows.sort((a, b) => {
    if (a.gap === null) return b.gap === null ? 0 : 1;
    if (b.gap === null) return -1;
    return Math.abs(a.gap) - Math.abs(b.gap);
  });

  return {
    rows,
    round: newest.round,
    coverYear: newest.coverYear,
    districtName: DISTRICT_NAMES.get(input.district) ?? input.district,
    unmatched,
  };
}

/** The NQC marker, re-exported so the route and the page agree on the word. */
export { NQC };
