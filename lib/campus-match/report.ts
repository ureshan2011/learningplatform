import "server-only";

import r2019 from "@/lib/content/ugc/cutoffs/2018-2019.json";
import r2020 from "@/lib/content/ugc/cutoffs/2019-2020.json";
import r2021 from "@/lib/content/ugc/cutoffs/2020-2021.json";
import r2022 from "@/lib/content/ugc/cutoffs/2021-2022.json";
import r2023 from "@/lib/content/ugc/cutoffs/2022-2023.json";
import r2024 from "@/lib/content/ugc/cutoffs/2023-2024.json";
import r2025 from "@/lib/content/ugc/cutoffs/2024-2025.json";
import r2026 from "@/lib/content/ugc/cutoffs/2025-2026.json";
import districts from "@/lib/content/ugc/districts.json";
import handbook from "@/lib/content/ugc/courses.json";
import { admitsStream, findCourse } from "@/lib/campus-match/courses";
import {
  NQC,
  bandOf,
  chanceOf,
  courseSigma,
  forecastCutoff,
  type Band,
  type CutoffValue,
} from "@/lib/campus-match/forecast";

/**
 * The paid report: an estimated chance at every course a student's stream can
 * apply for, in their own district, for the coming round.
 *
 * Built here rather than in the page so the arithmetic is testable and the page
 * only arranges it. Everything comes from the published rounds and the forecast
 * in `forecast.ts`; nothing calls a model, and no cut-off data reaches the
 * browser — the page ships the finished rows.
 */

const ROUNDS = [r2019, r2020, r2021, r2022, r2023, r2024, r2025, r2026];
const DISTRICT_NAMES = new Map(districts.districts.map((d) => [d.key, d.name]));

export interface ReportRow {
  key: string;
  course: string;
  university: string;
  code?: string;
  /** The forecast for the coming round, or null where none can be made. */
  forecast: number | null;
  /** The spread behind the chance, in Z. */
  sigma: number;
  /** 3 to 97, or null where there is no cut-off to forecast from. */
  chance: number | null;
  band: Band | null;
  lastCutoff: number | null;
  /** True where the series was too short to read a trend from. */
  thin: boolean;
  aptitudeTest?: boolean;
  checkHandbook: boolean;
  handbookPage?: number;
  /** How far the student's Z sits above (+) or below (−) the forecast. */
  gap: number | null;
}

export interface Report {
  districtName: string;
  bands: Record<Band, ReportRow[]>;
  /** Courses with no published cut-off in this district last round. */
  noCutoff: ReportRow[];
  counts: Record<Band, number>;
  /** Typical year-to-year movement across the courses shown, in plain Z. */
  typicalMove: number;
}

/**
 * Every round indexed by course, once per server instance.
 *
 * Without this, finding one course's history meant scanning 260 rows per round
 * per district — about thirteen million comparisons to render a single report.
 * Built lazily so a request that never reaches the report does not pay for it.
 */
const INDEX = ROUNDS.map(
  (round) =>
    new Map(
      round.rows.map((r) => [
        `${r.course}||${r.university}`,
        r.districts as Record<string, CutoffValue>,
      ]),
    ),
);

/** Every (course, university) series for one district, in round order. */
function seriesFor(district: string): Map<string, CutoffValue[]> {
  const out = new Map<string, CutoffValue[]>();
  INDEX.forEach((round, index) => {
    for (const [key, byDistrict] of round) {
      let cells = out.get(key);
      if (!cells) {
        cells = new Array(ROUNDS.length).fill(NQC) as CutoffValue[];
        out.set(key, cells);
      }
      const value = byDistrict[district];
      if (value !== undefined) cells[index] = value;
    }
  });
  return out;
}

/**
 * Pooled spread per course, across every district it admits to.
 *
 * Computed once for all districts rather than per request: it is the same
 * number whichever district a student is in, and it is what makes a course
 * usable where that district's own history is two or three years long.
 */
const sigmaByCourse = new Map<string, number>();

function sigmaFor(courseKey: string): number {
  const cached = sigmaByCourse.get(courseKey);
  if (cached !== undefined) return cached;

  const perDistrict: CutoffValue[][] = [];
  for (const district of DISTRICT_NAMES.keys()) {
    perDistrict.push(INDEX.map((round) => round.get(courseKey)?.[district] ?? NQC));
  }
  const sigma = courseSigma(perDistrict);
  sigmaByCourse.set(courseKey, sigma);
  return sigma;
}

export function buildReport(input: { z: number; district: string; stream: string }): Report {
  const series = seriesFor(input.district);
  const bands: Record<Band, ReportRow[]> = { likely: [], possible: [], reach: [], unlikely: [] };
  const noCutoff: ReportRow[] = [];
  const moves: number[] = [];
  const listed = new Set<string>();

  for (const row of r2026.rows) {
    const match = findCourse(row.course, row.university);
    // A title that cannot be joined cannot be stream-checked, and showing a
    // Commerce course to a Biological Science student is worse than omitting it.
    if (!match || !admitsStream(match.course, input.stream)) continue;
    const course = match.course;
    listed.add(course.code);

    const key = `${row.course}||${row.university}`;
    const cells = series.get(key) ?? [];
    const sigma = sigmaFor(key);
    const forecast = forecastCutoff(cells, sigma);
    const last = cells[cells.length - 1];
    const lastCutoff = typeof last === "number" ? last : null;

    const base: ReportRow = {
      key,
      course: row.course,
      university: row.university,
      ...(match.approximate ? {} : { code: course.code }),
      forecast: forecast?.value ?? null,
      sigma: forecast?.sigma ?? sigma,
      chance: forecast ? chanceOf(input.z, forecast) : null,
      band: null,
      lastCutoff,
      thin: forecast?.thin ?? true,
      ...(course.aptitudeTest ? { aptitudeTest: true } : {}),
      checkHandbook: course.eligibilityVerify,
      ...(match.approximate ? {} : { handbookPage: course.handbookPage }),
      gap: forecast ? Math.round((input.z - forecast.value) * 10000) / 10000 : null,
    };

    if (!forecast || base.chance === null) {
      noCutoff.push(base);
      continue;
    }

    base.band = bandOf(base.chance);
    bands[base.band].push(base);
    moves.push(forecast.sigma);
  }

  // Courses the cut-off tables never list at all — Law and Optometry among
  // them. The published tables carry the district columns, and a course admitted
  // on all-island merit alone has none. Shown so a student learns the course
  // exists rather than concluding from its absence that it does not.
  for (const course of handbook.courses) {
    if (listed.has(course.code) || !admitsStream(course, input.stream)) continue;
    noCutoff.push({
      key: `code:${course.code}`,
      course: course.name,
      university: "",
      code: course.code,
      forecast: null,
      sigma: 0,
      chance: null,
      band: null,
      lastCutoff: null,
      thin: true,
      ...(course.aptitudeTest ? { aptitudeTest: true } : {}),
      checkHandbook: course.eligibilityVerify,
      handbookPage: course.handbookPage,
      gap: null,
    });
  }

  // Nearest the forecast first inside each band: those are the ones the
  // student's decision actually turns on.
  for (const band of Object.keys(bands) as Band[]) {
    bands[band].sort((a, b) => Math.abs(a.gap ?? 0) - Math.abs(b.gap ?? 0));
  }

  const typicalMove = moves.length
    ? Math.round((moves.reduce((s, v) => s + v, 0) / moves.length) * 100) / 100
    : 0;

  return {
    districtName: DISTRICT_NAMES.get(input.district) ?? input.district,
    bands,
    noCutoff,
    counts: {
      likely: bands.likely.length,
      possible: bands.possible.length,
      reach: bands.reach.length,
      unlikely: bands.unlikely.length,
    },
    typicalMove,
  };
}
