/**
 * The Campus Match forecast: what a cut-off is likely to be next round, and
 * what chance a given Z-score has against it.
 *
 * Pure functions, no I/O, no model call. Everything here is arithmetic over the
 * published UGC series in `lib/content/ugc/cutoffs/`, which is what keeps the
 * marginal cost of a sale at the PayHere fee — see docs/campus-match-handoff.md.
 *
 * The numbers this produces are printed beside the words "estimate, not a
 * promise", and `scripts/campus-match/backtest.mjs` is what earns that wording:
 * it replays the method against rounds it was not fitted on and checks the
 * labels hold up. Change a constant here and the backtest has to be re-run.
 */

/** A cell that was published as "no qualified candidates" rather than a score. */
export const NQC = "NQC";
export type CutoffValue = number | typeof NQC;

/**
 * How much of the recent trend to carry forward.
 *
 * Half, not all: cut-offs wander year to year with the size and strength of one
 * cohort, and a full-strength trend turns a single odd year into a confident
 * prediction of more of the same.
 */
export const DAMPING = 0.5;

/**
 * The narrowest band the forecast is allowed to claim.
 *
 * Without a floor, a course whose last few years happened to land close together
 * would be given near-certainty it has not earned.
 */
export const SIGMA_FLOOR = 0.08;

/** Extra width for a series too short to show a trend. */
export const THIN_WIDEN = 1.5;

/** Below this many usable changes a series cannot show a trend. */
const MIN_CHANGES = 3;

/**
 * The three constants above, in a form the backtest can sweep.
 *
 * They are parameters rather than fixed numbers so that one implementation
 * serves both the product and `scripts/campus-match/backtest.mjs`. A second
 * copy of this arithmetic written for tuning would drift from the one students
 * actually see, and the calibration printed in the report would stop being
 * about the forecast the report made.
 */
export interface Tuning {
  damping: number;
  sigmaFloor: number;
  thinWiden: number;
}

export const DEFAULT_TUNING: Tuning = {
  damping: DAMPING,
  sigmaFloor: SIGMA_FLOOR,
  thinWiden: THIN_WIDEN,
};

export interface Forecast {
  /** The estimated cut-off for the coming round. */
  value: number;
  /** The spread used for the chance, after any widening. */
  sigma: number;
  /** True when the series was too short to read a trend from. */
  thin: boolean;
}

export type Band = "likely" | "possible" | "reach" | "unlikely";

/**
 * Year-to-year changes, between adjacent rounds only.
 *
 * A gap where a district published NQC is a gap, not a zero: the jump across it
 * spans two years and would read as a change twice its real size.
 */
export function yearChanges(series: readonly CutoffValue[]): number[] {
  const changes: number[] = [];
  for (let i = 1; i < series.length; i += 1) {
    const previous = series[i - 1];
    const current = series[i];
    if (typeof previous === "number" && typeof current === "number") {
      changes.push(current - previous);
    }
  }
  return changes;
}

/** The most recent published score, or undefined if the series never had one. */
export function lastPublished(series: readonly CutoffValue[]): number | undefined {
  for (let i = series.length - 1; i >= 0; i -= 1) {
    const value = series[i];
    if (typeof value === "number") return value;
  }
  return undefined;
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Sample standard deviation. Zero for fewer than two values. */
export function stdev(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * The spread for one course, pooled across every district it admits to.
 *
 * Pooling is what makes a course usable in a district with only two or three
 * published years: a course's cut-off moves for reasons that apply everywhere —
 * the size of the cohort, how the paper marked — so the movement seen in 25
 * districts estimates next year's movement in one of them far better than that
 * district's own thin history does.
 */
export function courseSigma(
  seriesByDistrict: readonly (readonly CutoffValue[])[],
  tuning: Tuning = DEFAULT_TUNING,
): number {
  const pooled = seriesByDistrict.flatMap((series) => yearChanges(series));
  return Math.max(stdev(pooled), tuning.sigmaFloor);
}

/**
 * Next round's cut-off for one course in one district.
 *
 * Returns undefined where the district has never had a published cut-off, or
 * where the newest round was NQC — that student is told no cut-off was
 * published rather than shown a number derived from a year nobody sat.
 */
export function forecastCutoff(
  series: readonly CutoffValue[],
  sigma: number,
  tuning: Tuning = DEFAULT_TUNING,
): Forecast | undefined {
  if (series.length === 0) return undefined;
  if (series[series.length - 1] === NQC) return undefined;

  const last = lastPublished(series);
  if (last === undefined) return undefined;

  const changes = yearChanges(series);
  if (changes.length < MIN_CHANGES) {
    return { value: last, sigma: sigma * tuning.thinWiden, thin: true };
  }

  const recent = changes.slice(-MIN_CHANGES);
  return { value: last + tuning.damping * mean(recent), sigma, thin: false };
}

/**
 * Abramowitz and Stegun 7.1.26, good to about 1.5e-7.
 *
 * Written out rather than pulled in, because the whole product ships no chart
 * library and no maths library and this is the only special function it needs.
 */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-a * a);
  return sign * y;
}

/** P(X <= x) for X ~ Normal(mu, sigma). */
export function normalCdf(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return x >= mu ? 1 : 0;
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
}

/** Never 0, never 100: the data cannot support either and a student reads them as promises. */
export const CHANCE_MIN = 3;
export const CHANCE_MAX = 97;

/**
 * The chance this Z-score clears this forecast, as a whole percentage.
 *
 * The cut-off is the uncertain thing, not the student's score: they know their
 * Z exactly, and what they are asking is where next round's line will fall.
 */
export function chanceOf(z: number, forecast: Forecast): number {
  const p = normalCdf(z, forecast.value, forecast.sigma) * 100;
  return Math.round(Math.min(CHANCE_MAX, Math.max(CHANCE_MIN, p)));
}

export function bandOf(chance: number): Band {
  if (chance >= 70) return "likely";
  if (chance >= 35) return "possible";
  if (chance >= 10) return "reach";
  return "unlikely";
}

export interface PreferenceOutcome {
  /** Chance of being offered this course, given everything above it missed. */
  landing: number;
  /** Chance of no offer from the whole list. */
  noOffer: number;
}

/**
 * What an ordered preference list is likely to return.
 *
 * The UGC works down the list and gives the first course the student clears, so
 * the chance of landing on one is its own chance times the chance every course
 * above it missed. Treating the courses as independent slightly overstates
 * certainty — the screen says so, because a student reading 92% deserves to
 * know what it assumes.
 */
export function preferenceOutcomes(chances: readonly number[]): PreferenceOutcome[] {
  let remaining = 1;
  const landings: number[] = [];
  for (const chance of chances) {
    const p = chance / 100;
    landings.push(remaining * p);
    remaining *= 1 - p;
  }
  return landings.map((landing) => ({
    landing: Math.round(landing * 100),
    noOffer: Math.round(remaining * 100),
  }));
}

/** Chance the whole list returns nothing, as a whole percentage. */
export function noOfferChance(chances: readonly number[]): number {
  const remaining = chances.reduce((acc, chance) => acc * (1 - chance / 100), 1);
  return Math.round(remaining * 100);
}
