/**
 * Unit tests for the forecast, on series written out by hand.
 *
 * Run with `npm run test`. Node strips the types itself, so this costs the
 * project no test framework and no dependency.
 *
 * These check the rules the report's wording depends on — a gap is not a zero,
 * a chance is never 0 or 100, a thin series is given a wider band — rather than
 * the arithmetic, which the backtest exercises against real rounds.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CHANCE_MAX,
  CHANCE_MIN,
  DAMPING,
  NQC,
  SIGMA_FLOOR,
  THIN_WIDEN,
  bandOf,
  chanceOf,
  courseSigma,
  forecastCutoff,
  lastPublished,
  noOfferChance,
  normalCdf,
  preferenceOutcomes,
  stdev,
  yearChanges,
} from "./forecast.ts";

test("year-to-year changes skip a gap rather than jumping across it", () => {
  assert.deepEqual(yearChanges([1.0, 1.1, 1.3]), [
    0.10000000000000009, 0.19999999999999996,
  ]);
  // The jump from 1.0 to 1.3 spans two years; counting it would read as a
  // change twice its real size.
  assert.deepEqual(yearChanges([1.0, NQC, 1.3]), []);
  assert.deepEqual(yearChanges([NQC, NQC]), []);
});

test("the last published score ignores trailing gaps", () => {
  assert.equal(lastPublished([1.0, 1.2, NQC]), 1.2);
  assert.equal(lastPublished([NQC, NQC]), undefined);
});

test("a rising series is carried forward at the damping factor", () => {
  const series = [1.0, 1.1, 1.2, 1.3];
  const forecast = forecastCutoff(series, 0.1);
  assert.ok(forecast);
  // Three changes of +0.1, damped by half.
  assert.ok(Math.abs(forecast.value - (1.3 + DAMPING * 0.1)) < 1e-9);
  assert.equal(forecast.thin, false);
  assert.equal(forecast.sigma, 0.1);
});

test("only the last three changes count", () => {
  // The +1.0 first year must not move a forecast made from the recent three.
  const forecast = forecastCutoff([0.0, 1.0, 1.1, 1.2, 1.3], 0.1);
  assert.ok(forecast);
  assert.ok(Math.abs(forecast.value - (1.3 + DAMPING * 0.1)) < 1e-9);
});

test("a short series holds still and is given a wider band", () => {
  const forecast = forecastCutoff([1.0, 1.2], 0.1);
  assert.ok(forecast);
  assert.equal(forecast.value, 1.2);
  assert.equal(forecast.thin, true);
  assert.ok(Math.abs(forecast.sigma - 0.1 * THIN_WIDEN) < 1e-9);
});

test("a district whose newest round was NQC gets no forecast at all", () => {
  // The report says no cut-off was published rather than showing a number
  // derived from a year nobody sat.
  assert.equal(forecastCutoff([1.0, 1.1, 1.2, NQC], 0.1), undefined);
  assert.equal(forecastCutoff([NQC, NQC, NQC], 0.1), undefined);
  assert.equal(forecastCutoff([], 0.1), undefined);
});

test("sigma pools across districts and never falls below the floor", () => {
  const wobbly = courseSigma([
    [1.0, 1.3, 1.0, 1.3],
    [1.1, 1.4, 1.1, 1.4],
  ]);
  assert.ok(wobbly > SIGMA_FLOOR);

  // A course that barely moved anywhere still cannot claim certainty.
  const flat = courseSigma([
    [1.0, 1.0, 1.0],
    [1.2, 1.2, 1.2],
  ]);
  assert.equal(flat, SIGMA_FLOOR);
});

test("a chance is never printed as 0 or 100", () => {
  const forecast = { value: 1.5, sigma: 0.1, thin: false };
  assert.equal(chanceOf(9, forecast), CHANCE_MAX);
  assert.equal(chanceOf(-9, forecast), CHANCE_MIN);
  // A student exactly on the forecast is a coin toss.
  assert.equal(chanceOf(1.5, forecast), 50);
});

test("bands sit where the handoff puts them", () => {
  assert.equal(bandOf(70), "likely");
  assert.equal(bandOf(69), "possible");
  assert.equal(bandOf(35), "possible");
  assert.equal(bandOf(34), "reach");
  assert.equal(bandOf(10), "reach");
  assert.equal(bandOf(9), "unlikely");
});

test("the normal CDF matches known values", () => {
  assert.ok(Math.abs(normalCdf(0, 0, 1) - 0.5) < 1e-6);
  assert.ok(Math.abs(normalCdf(1, 0, 1) - 0.8413447) < 1e-5);
  assert.ok(Math.abs(normalCdf(-1.6449, 0, 1) - 0.05) < 1e-4);
});

test("stdev is the sample standard deviation", () => {
  assert.equal(stdev([2]), 0);
  assert.ok(Math.abs(stdev([2, 4, 4, 4, 5, 5, 7, 9]) - 2.1380899) < 1e-6);
});

test("a preference list gives the first course that clears", () => {
  const outcomes = preferenceOutcomes([50, 50]);
  // Top choice: 50%. Second: missed the first (50%) and cleared this (50%).
  assert.equal(outcomes[0].landing, 50);
  assert.equal(outcomes[1].landing, 25);
  assert.equal(noOfferChance([50, 50]), 25);
});

test("ordering changes what the list is likely to return", () => {
  const safeFirst = preferenceOutcomes([90, 20]);
  const reachFirst = preferenceOutcomes([20, 90]);
  assert.equal(safeFirst[0].landing, 90);
  assert.equal(reachFirst[0].landing, 20);
  // The same two courses leave the same chance of nothing either way.
  assert.equal(noOfferChance([90, 20]), noOfferChance([20, 90]));
});

test("a list of long shots still reports a real chance of nothing", () => {
  assert.equal(noOfferChance([]), 100);
  assert.equal(noOfferChance([5, 5, 5]), 86);
});
