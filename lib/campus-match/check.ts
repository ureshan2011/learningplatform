import "server-only";

import newest from "@/lib/content/ugc/cutoffs/2025-2026.json";
import previous from "@/lib/content/ugc/cutoffs/2022-2023.json";
import handbook from "@/lib/content/ugc/courses.json";
import districts from "@/lib/content/ugc/districts.json";
import { NQC, type CutoffValue } from "@/lib/campus-match/forecast";

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

/**
 * Course titles as the two documents print them, reduced to something joinable.
 *
 * The cut-off tables set titles in capitals with footnote markers and
 * abbreviations; the handbook writes them out in sentence case. Neither
 * spelling is wrong, they just have to meet.
 */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[*#]/g, " ")
    // Joining words are the commonest difference: the tables print "BANKING &
    // INSURANCE" where the handbook writes "Banking and Insurance".
    .replace(/\b(and|the|of|in|for)\b/g, " ")
    .replace(/[^a-z0-9]/g, "");
}

/** Built once per server instance — the files are static and never change under it. */
const byTitle = new Map(handbook.courses.map((c) => [normalise(c.name), c]));

type HandbookCourse = (typeof handbook.courses)[number];

/**
 * The handbook entry behind a cut-off row's title, if there is one.
 *
 * Falls back to a prefix match because the cut-off tables truncate long titles
 * to fit a column — "AGRICULTURAL RESOURCE MANAGEMENT AND" is a real course
 * with its tail cut off. Only accepted when exactly one handbook course starts
 * that way, so a truncation that could be two courses matches neither.
 */
function findCourse(title: string): HandbookCourse | undefined {
  const key = normalise(title);
  const exact = byTitle.get(key);
  if (exact) return exact;
  if (key.length < 12) return undefined;

  let found: HandbookCourse | undefined;
  for (const [candidate, course] of byTitle) {
    if (candidate.startsWith(key) || key.startsWith(candidate)) {
      if (found) return undefined;
      found = course;
    }
  }
  return found;
}

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
    const course = findCourse(row.course);

    // Stream is the filter, and the only one. The handbook writes its subject
    // rules as prose with alternatives, so none of them is reduced to a machine
    // rule — see `eligibilityVerify` in courses.json. Filtering on a guessed
    // subject rule would tell a student they cannot apply for something they
    // can, which is worse than showing a row with "check handbook" on it.
    if (!course) {
      unmatched += 1;
      continue;
    }
    if (!course.streams.includes(input.stream) && !course.streams.includes("any")) {
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
      code: course.code,
      handbookPage: course.handbookPage,
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
