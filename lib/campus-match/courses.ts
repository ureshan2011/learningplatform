import "server-only";

import handbook from "@/lib/content/ugc/courses.json";
import newest from "@/lib/content/ugc/cutoffs/2025-2026.json";
import { buildJoin, type Match } from "@/lib/campus-match/join";

/**
 * The handbook, joined to the cut-off tables.
 *
 * Shared by the free checker and the paid report so they cannot disagree about
 * which courses exist or which stream may apply for them — a course a student
 * saw for free and then could not find in the report they paid for would be the
 * worst possible first impression of it.
 *
 * The matching itself is in `join.ts`, which takes its data as arguments so the
 * validation script can measure the join this product actually makes.
 */

export type HandbookCourse = (typeof handbook.courses)[number];
export type CourseMatch = Match<HandbookCourse>;

/** Built once per server instance — both files are static and never change under it. */
const join = buildJoin(
  handbook.courses,
  [...new Set(newest.rows.map((r) => r.university).filter(Boolean))],
);

/**
 * The handbook entry behind a cut-off row's title, if there is one.
 *
 * The university is passed because it disambiguates: two universities run a
 * course of the same name and the handbook tells them apart by an abbreviation
 * in the title's bracket.
 */
export function findCourse(title: string, university?: string): CourseMatch | undefined {
  return join.find(title, university);
}

/** Whether this stream may apply for this course, per the handbook's own sections. */
export function admitsStream(course: HandbookCourse, stream: string): boolean {
  return course.streams.includes(stream) || course.streams.includes("any");
}
