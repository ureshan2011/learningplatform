import "server-only";

import profiles from "@/lib/content/campus-match/profiles.json";
import handbook from "@/lib/content/ugc/courses.json";
import r2019 from "@/lib/content/ugc/cutoffs/2018-2019.json";
import r2020 from "@/lib/content/ugc/cutoffs/2019-2020.json";
import r2021 from "@/lib/content/ugc/cutoffs/2020-2021.json";
import r2022 from "@/lib/content/ugc/cutoffs/2021-2022.json";
import r2023 from "@/lib/content/ugc/cutoffs/2022-2023.json";
import r2024 from "@/lib/content/ugc/cutoffs/2023-2024.json";
import r2025 from "@/lib/content/ugc/cutoffs/2024-2025.json";
import r2026 from "@/lib/content/ugc/cutoffs/2025-2026.json";
import { findCourse } from "@/lib/campus-match/courses";
import { NQC, type CutoffValue } from "@/lib/campus-match/forecast";
import type { Locale } from "@/lib/i18n/dictionary";

/**
 * A degree profile: what the subject is, who may apply, and what it has needed.
 *
 * Two sources, deliberately kept apart. Everything with a number in it comes
 * from `lib/content/ugc/` — the UGC's own cut-off tables and handbook. The
 * plain-language description of the field comes from
 * `lib/content/campus-match/profiles.json`, which is ICT Campus's own writing
 * and says so: no duration, no intake, no career claim, no figure.
 *
 * Nothing here calls a model. The descriptions were written once, into a file.
 */

const ROUNDS = [r2019, r2020, r2021, r2022, r2023, r2024, r2025, r2026];

export type HandbookCourse = (typeof handbook.courses)[number];

export interface Faculty {
  key: string;
  en: string;
  si: string;
}

export interface DegreeProfile {
  course: HandbookCourse;
  faculty: Faculty;
  /** The description in the reader's language. */
  about: string;
  /** Every university the newest round lists this course at. */
  universities: string[];
}

const BY_CODE = new Map(handbook.courses.map((c) => [c.code, c]));
const FACULTIES = new Map(profiles.faculties.map((f) => [f.key, f]));

type ProfileEntry = { faculty: string; en: string; si: string };
const ENTRIES = profiles.profiles as Record<string, ProfileEntry>;

/**
 * Which cut-off rows belong to a handbook code.
 *
 * Built by running the same join the report uses, in reverse: a row whose
 * handbook entry is only the nearest course rather than that course carries no
 * code at all, so it cannot claim a profile page it does not belong on.
 */
const ROWS_BY_CODE = (() => {
  const out = new Map<string, { course: string; university: string }[]>();
  for (const row of r2026.rows) {
    const match = findCourse(row.course, row.university);
    if (!match || match.approximate) continue;
    const list = out.get(match.course.code);
    if (list) list.push(row);
    else out.set(match.course.code, [row]);
  }
  return out;
})();

export function getProfile(code: string, locale: Locale): DegreeProfile | undefined {
  const course = BY_CODE.get(code);
  const entry = ENTRIES[code];
  if (!course || !entry) return undefined;
  const faculty = FACULTIES.get(entry.faculty);
  if (!faculty) return undefined;

  return {
    course,
    faculty,
    about: locale === "si" ? entry.si : entry.en,
    universities: [
      ...new Set((ROWS_BY_CODE.get(code) ?? []).map((r) => r.university).filter(Boolean)),
    ].sort(),
  };
}

export interface HistoryPoint {
  round: string;
  value: CutoffValue;
}

/**
 * This course's published cut-offs in one district, round by round.
 *
 * Across every university that offers it, the lowest is taken: that is the one
 * a student's Z-score actually has to clear to be offered the course somewhere,
 * which is the question the chart is asked.
 */
export function courseHistory(code: string, district: string): HistoryPoint[] {
  const rows = ROWS_BY_CODE.get(code) ?? [];
  if (rows.length === 0) return [];
  const keys = new Set(rows.map((r) => `${r.course}||${r.university}`));

  return ROUNDS.map((round) => {
    let lowest: number | undefined;
    for (const row of round.rows) {
      if (!keys.has(`${row.course}||${row.university}`)) continue;
      const value = (row.districts as Record<string, CutoffValue>)[district];
      if (typeof value === "number" && (lowest === undefined || value < lowest)) lowest = value;
    }
    return { round: round.round, value: lowest ?? NQC };
  });
}

/** Every code with a profile, for the sitemap and for a listing. */
export function profileCodes(): string[] {
  return Object.keys(ENTRIES).filter((code) => BY_CODE.has(code));
}
