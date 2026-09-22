import "server-only";

import handbook from "@/lib/content/ugc/courses.json";
import newest from "@/lib/content/ugc/cutoffs/2025-2026.json";
import districts from "@/lib/content/ugc/districts.json";
import streams from "@/lib/content/ugc/streams.json";
import manifest from "@/lib/content/ugc/manifest.json";
import { findCourse, type HandbookCourse } from "@/lib/campus-match/courses";
import type { CutoffValue } from "@/lib/campus-match/forecast";

/**
 * The public cut-off pages: one per handbook course, from the newest round only.
 *
 * ## What is free and what is not
 *
 * The newest published round is public data — the UGC prints it — and the
 * Campus Match handoff is explicit that it stays free, because staying public
 * is what ranks. It used to be reachable only through the free checker's POST,
 * which a search engine never makes, so none of it was indexed. These pages
 * render the same round as plain HTML.
 *
 * The paid half is untouched: the eight-round history per district, the
 * forecast for the coming round and the chance of getting in. Nothing here
 * reads an older round.
 *
 * ## Grouping
 *
 * Rows join to the handbook through `findCourse`, the same join the checker
 * and the report use, so a course cannot appear here under one name and in
 * the report under another. The few rows that do not join (a handful of
 * aesthetic-studies courses whose titles the handbook prints differently) are
 * left out rather than guessed at.
 *
 * Server-only like the rest of the dataset: pages receive the rows for one
 * course, never the file.
 */

export interface CutoffUniversity {
  university: string;
  /** Title as the UGC prints it on the cut-off table. */
  printedTitle: string;
  /** One entry per district, in the UGC's column order. */
  districts: { key: string; name: string; cutoff: number | null }[];
  lowest: number | null;
  highest: number | null;
}

export interface CutoffCourse {
  slug: string;
  code: string;
  name: string;
  streams: { key: string; name: string }[];
  duration: string;
  medium: string;
  intake: number | null;
  aptitudeTest: boolean;
  handbookPage: number;
  /** The handbook's eligibility text with its bullet glyphs cleaned up. */
  eligibility: string;
  universities: CutoffUniversity[];
  lowest: number | null;
  highest: number | null;
}

export const CUTOFF_ROUND = {
  coverYear: newest.coverYear,
  basis: manifest.newestBasis,
  source: newest.source,
  handbookSource: handbook.source,
  handbookCoverYear: handbook.coverYear,
  fetchedAt: manifest.newestFetchedAt,
} as const;

const DISTRICTS = districts.districts;
const STREAM_NAMES = new Map(streams.streams.map((s) => [s.key, s.name]));

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function bounds(values: (number | null)[]): { lowest: number | null; highest: number | null } {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return { lowest: null, highest: null };
  return { lowest: round4(Math.min(...nums)), highest: round4(Math.max(...nums)) };
}

function cleanEligibility(text: string): string {
  return text
    .replace(/\uf0a7/g, " · ")
    .replace(/\s+/g, " ")
    .trim();
}

function streamsOf(course: HandbookCourse): { key: string; name: string }[] {
  if (course.streams.includes("any")) {
    return streams.streams.map((s) => ({ key: s.key, name: s.name }));
  }
  return course.streams.map((key) => ({ key, name: STREAM_NAMES.get(key) ?? key }));
}

function build(): CutoffCourse[] {
  const byCode = new Map<string, { course: HandbookCourse; rows: typeof newest.rows }>();
  for (const row of newest.rows) {
    const match = findCourse(row.course, row.university);
    if (!match) continue;
    const entry = byCode.get(match.course.code) ?? { course: match.course, rows: [] };
    entry.rows.push(row);
    byCode.set(match.course.code, entry);
  }

  const usedSlugs = new Set<string>();
  const out: CutoffCourse[] = [];

  for (const { course, rows } of byCode.values()) {
    let slug = slugify(course.name);
    if (usedSlugs.has(slug)) slug = `${slug}-${course.code}`;
    usedSlugs.add(slug);

    const universities: CutoffUniversity[] = rows.map((row) => {
      const cells = row.districts as Record<string, CutoffValue>;
      const ds = DISTRICTS.map((d) => {
        const v = cells[d.key];
        return { key: d.key, name: d.name, cutoff: typeof v === "number" ? v : null };
      });
      return {
        university: row.university,
        printedTitle: row.course,
        districts: ds,
        ...bounds(ds.map((d) => d.cutoff)),
      };
    });
    universities.sort((a, b) => (b.highest ?? -9) - (a.highest ?? -9));

    out.push({
      slug,
      code: course.code,
      name: course.name,
      streams: streamsOf(course),
      duration: course.duration,
      medium: course.medium,
      intake: typeof course.intake === "number" && course.intake > 0 ? course.intake : null,
      aptitudeTest: Boolean(course.aptitudeTest),
      handbookPage: course.handbookPage,
      eligibility: cleanEligibility(course.eligibility ?? ""),
      universities,
      ...bounds(universities.flatMap((u) => [u.lowest, u.highest])),
    });
  }

  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Built once per server instance; both files are static. */
const COURSES = build();
const BY_SLUG = new Map(COURSES.map((c) => [c.slug, c]));

export function listCutoffCourses(): CutoffCourse[] {
  return COURSES;
}

export function getCutoffCourse(slug: string): CutoffCourse | undefined {
  return BY_SLUG.get(slug);
}

/** Other courses the same stream can apply for, for the "also look at" links. */
export function siblingCourses(course: CutoffCourse, limit = 8): CutoffCourse[] {
  const keys = new Set(course.streams.map((s) => s.key));
  // A course open to every stream would call everything a sibling; use its
  // first-listed stream alone.
  const narrow = keys.size > 3 ? new Set([course.streams[0]?.key]) : keys;
  return COURSES.filter(
    (c) => c.slug !== course.slug && c.streams.some((s) => narrow.has(s.key)),
  ).slice(0, limit);
}

/** The streams, in the handbook's order, with the courses each can apply for. */
export function cutoffCoursesByStream(): { key: string; name: string; courses: CutoffCourse[] }[] {
  return streams.streams.map((s) => ({
    key: s.key,
    name: s.name,
    courses: COURSES.filter((c) => c.streams.some((cs) => cs.key === s.key)),
  }));
}

/** Formats a Z-score the way the UGC prints it: four decimals, or NQC where no one qualified. */
export function formatZ(z: number | null): string {
  return z === null ? "NQC" : z.toFixed(4);
}
