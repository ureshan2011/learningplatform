import type { Unit } from "@/lib/types";

/**
 * The syllabus, trimmed to what the landing page's showcase actually renders.
 *
 * The full unit set is ~60 lessons deep, and every one of them carries its
 * complete exam-objective and focus-area lists (see lib/content/al-ict-units.ts).
 * Shipping all of that to the browser would triple the landing page's payload
 * for text no visitor reads on a marketing page — the full detail lives one
 * click away on /syllabus/al-ict. So each lesson keeps the two objectives and
 * the one focus note that make the depth credible, and drops the rest.
 */
export interface LandingLesson {
  /** Competency-level number, e.g. "3.2". */
  id: string;
  title: string;
  periods: number;
  /** At most two — enough to show these are real exam skills, not topic names. */
  objectives: string[];
  /** Where the marks are, in one line. */
  focus?: string;
}

export interface LandingUnit {
  id: string;
  competencyNumber: number;
  gradeYear: 12 | 13;
  title: string;
  statement: string;
  periods: number;
  lessons: LandingLesson[];
}

/** Accepts both a Firestore `Unit` and the static `UnitSeed` the seed file exports. */
type SyllabusSource = Omit<Unit, "tenantId" | "createdAt">;

export function toLandingUnits(units: readonly SyllabusSource[]): LandingUnit[] {
  return [...units]
    .sort((a, b) => a.order - b.order)
    .map((unit) => ({
      id: unit.id,
      competencyNumber: unit.competencyNumber,
      gradeYear: unit.gradeYear,
      title: unit.title,
      statement: unit.competencyStatement,
      periods: unit.periods,
      lessons: [...unit.lessons]
        .sort((a, b) => a.order - b.order)
        .map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          periods: lesson.periods,
          objectives: lesson.examObjectives.slice(0, 2),
          ...(lesson.importantAreas[0] ? { focus: lesson.importantAreas[0] } : {}),
        })),
    }));
}

export interface SyllabusTotals {
  units: number;
  lessons: number;
  periods: number;
  /** Teaching hours, at the syllabus's own 40-minute period. */
  hours: number;
}

export function syllabusTotals(units: readonly LandingUnit[]): SyllabusTotals {
  const periods = units.reduce((n, u) => n + u.periods, 0);
  return {
    units: units.length,
    lessons: units.reduce((n, u) => n + u.lessons.length, 0),
    periods,
    hours: Math.round((periods * 40) / 60),
  };
}
