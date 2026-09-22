/**
 * The worked example on `/z-score` and `/si/z-score`, computed rather than
 * typed, so the arithmetic on the page cannot be wrong.
 *
 * The marks, averages and standard deviations are **invented** for teaching
 * and the pages say so. The Department of Examinations does not publish each
 * subject's average and spread before results, which is exactly why nobody —
 * including the calculators that rank for "z score calculator" — can turn raw
 * marks into your real Z-score in advance.
 */

export interface ExampleSubject {
  subject: string;
  mark: number;
  average: number;
  sd: number;
}

export const EXAMPLE_SUBJECTS: ExampleSubject[] = [
  { subject: "Subject 1", mark: 72, average: 50, sd: 18 },
  { subject: "Subject 2", mark: 65, average: 48, sd: 17 },
  { subject: "Subject 3", mark: 58, average: 45, sd: 15 },
];

export function subjectZ(s: ExampleSubject): number {
  return (s.mark - s.average) / s.sd;
}

export const EXAMPLE_FINAL_Z =
  EXAMPLE_SUBJECTS.reduce((sum, s) => sum + subjectZ(s), 0) / EXAMPLE_SUBJECTS.length;

/** Four decimals, the way the Department of Examinations prints a Z-score. */
export function z4(n: number): string {
  return n.toFixed(4);
}
