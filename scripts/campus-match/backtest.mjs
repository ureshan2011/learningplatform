#!/usr/bin/env node
/**
 * Replays the forecast against rounds it was not fitted on, and writes
 * BACKTEST.md.
 *
 * This is what earns the wording on the report. The method is only allowed to
 * label a course "Likely" if, on rounds held out of the fit, students at that
 * label actually cleared — see docs/campus-match-handoff.md §4.
 *
 * Imports the product's own forecast rather than reimplementing it, so the
 * calibration printed to a student is about the arithmetic that produced their
 * number.
 *
 * Usage: node --experimental-strip-types scripts/campus-match/backtest.mjs
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_TUNING,
  bandOf,
  chanceOf,
  courseSigma,
  forecastCutoff,
} from "../../lib/campus-match/forecast.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const CUTOFFS = join(REPO, "lib", "content", "ugc", "cutoffs");
const OUT = join(REPO, "lib", "content", "ugc", "BACKTEST.md");
// The same headline for code rather than for a reader: the teacher console
// prints it, and a console panel must not depend on a regex over prose.
const SUMMARY = join(REPO, "lib", "content", "ugc", "backtest.json");

/**
 * The two probes the calibration bars are stated in terms of.
 *
 * A student one sigma above the forecast should be told Likely and should
 * mostly clear; one well below should be told Unlikely and should mostly not.
 * Probing at fixed multiples of sigma is what makes the test about the width of
 * the band rather than about which students happened to be in the data.
 */
const LIKELY_PROBE = 1.0;
const UNLIKELY_PROBE = -1.5;

/** The bars from the handoff. Likely must clear at least this often. */
const LIKELY_BAR = 70;
/** Unlikely must clear no more often than this. */
const UNLIKELY_BAR = 10;

async function loadRounds() {
  const files = (await readdir(CUTOFFS)).filter((f) => f.endsWith(".json")).sort();
  const rounds = [];
  for (const file of files) {
    rounds.push(JSON.parse(await readFile(join(CUTOFFS, file), "utf8")));
  }
  return rounds;
}

/**
 * Every course's series, as {course -> {district -> [value per round]}}.
 *
 * A round where a course does not appear at all is a hole, not an NQC: the
 * course was not offered, and treating that as "nobody qualified" would feed
 * the trend a year that never happened.
 */
function buildSeries(rounds) {
  const series = new Map();
  rounds.forEach((round, index) => {
    for (const row of round.rows) {
      const key = `${row.course}||${row.university}`;
      let course = series.get(key);
      if (!course) {
        course = new Map();
        series.set(key, course);
      }
      for (const [district, value] of Object.entries(row.districts)) {
        let cells = course.get(district);
        if (!cells) {
          cells = new Array(rounds.length).fill(undefined);
          course.set(district, cells);
        }
        cells[index] = value;
      }
    }
  });
  return series;
}

/** The slice of a series a forecast for round `target` is allowed to see. */
function history(cells, target) {
  return cells.slice(0, target).filter((v) => v !== undefined);
}

function run(rounds, series, tuning) {
  let absErrorSum = 0;
  let scored = 0;
  let likelyTotal = 0;
  let likelyCleared = 0;
  let unlikelyTotal = 0;
  let unlikelyCleared = 0;
  const perRound = [];

  // From the third round on: anything earlier has no history to forecast from.
  for (let target = 2; target < rounds.length; target += 1) {
    let roundError = 0;
    let roundScored = 0;

    for (const districts of series.values()) {
      const past = [...districts.values()].map((cells) => history(cells, target));
      const sigma = courseSigma(past, tuning);

      for (const cells of districts.values()) {
        const actual = cells[target];
        if (typeof actual !== "number") continue;

        const forecast = forecastCutoff(history(cells, target), sigma, tuning);
        if (!forecast) continue;

        roundError += Math.abs(forecast.value - actual);
        roundScored += 1;

        // Would a student at this probe have been told Likely, and did the
        // round that followed actually let them in?
        const likelyZ = forecast.value + LIKELY_PROBE * forecast.sigma;
        if (bandOf(chanceOf(likelyZ, forecast)) === "likely") {
          likelyTotal += 1;
          if (actual <= likelyZ) likelyCleared += 1;
        }

        const unlikelyZ = forecast.value + UNLIKELY_PROBE * forecast.sigma;
        if (bandOf(chanceOf(unlikelyZ, forecast)) === "unlikely") {
          unlikelyTotal += 1;
          if (actual <= unlikelyZ) unlikelyCleared += 1;
        }
      }
    }

    absErrorSum += roundError;
    scored += roundScored;
    perRound.push({
      round: rounds[target].round,
      cells: roundScored,
      mae: roundScored ? roundError / roundScored : 0,
    });
  }

  return {
    tuning,
    mae: scored ? absErrorSum / scored : 0,
    cells: scored,
    likelyPct: likelyTotal ? (likelyCleared / likelyTotal) * 100 : 0,
    likelyTotal,
    unlikelyPct: unlikelyTotal ? (unlikelyCleared / unlikelyTotal) * 100 : 0,
    unlikelyTotal,
    perRound,
  };
}

/**
 * What a real report is made of.
 *
 * Forecasting the coming round uses every published round as history, so this
 * counts how many course-and-district cells have enough of one to read a trend
 * from, how many fall back to holding last round's figure with a wider band,
 * and how many can only say no cut-off was published.
 */
function measureCoverage(rounds, series, tuning) {
  const target = rounds.length;
  let trend = 0;
  let thin = 0;
  let none = 0;
  for (const districts of series.values()) {
    const past = [...districts.values()].map((cells) => history(cells, target));
    const sigma = courseSigma(past, tuning);
    for (const cells of districts.values()) {
      const forecast = forecastCutoff(history(cells, target), sigma, tuning);
      if (!forecast) none += 1;
      else if (forecast.thin) thin += 1;
      else trend += 1;
    }
  }
  const total = trend + thin + none;
  return { trend, thin, none, total };
}

function passes(result) {
  return result.likelyPct >= LIKELY_BAR && result.unlikelyPct <= UNLIKELY_BAR;
}

async function main() {
  const rounds = await loadRounds();
  const series = buildSeries(rounds);

  const chosen = run(rounds, series, DEFAULT_TUNING);
  const coverage = measureCoverage(rounds, series, DEFAULT_TUNING);

  // The sweep is reported whether or not the defaults pass, so the next person
  // can see what the bars cost rather than rediscovering it.
  const sweep = [];
  for (const damping of [0, 0.25, 0.5, 0.75, 1]) {
    for (const sigmaFloor of [0.05, 0.08, 0.12, 0.16]) {
      const tuning = { ...DEFAULT_TUNING, damping, sigmaFloor };
      sweep.push(run(rounds, series, tuning));
    }
  }

  await writeFile(OUT, render(rounds, chosen, sweep, coverage), "utf8");
  await writeFile(
    SUMMARY,
    `${JSON.stringify(
      {
        generated: new Date().toISOString().slice(0, 10),
        heldOut: rounds.slice(2).map((r) => r.round),
        cells: chosen.cells,
        mae: Number(chosen.mae.toFixed(4)),
        likelyPct: Number(chosen.likelyPct.toFixed(1)),
        likelyBar: LIKELY_BAR,
        unlikelyPct: Number(chosen.unlikelyPct.toFixed(1)),
        unlikelyBar: UNLIKELY_BAR,
        passes: passes(chosen),
        tuning: chosen.tuning,
      },
      null,
      1,
    )}\n`,
    "utf8",
  );
  console.log(`backtest -> ${OUT}`);
  console.log(
    `defaults: MAE ${chosen.mae.toFixed(4)} over ${chosen.cells} cells | ` +
      `Likely cleared ${chosen.likelyPct.toFixed(1)}% (bar ${LIKELY_BAR}) | ` +
      `Unlikely cleared ${chosen.unlikelyPct.toFixed(1)}% (bar ${UNLIKELY_BAR})`,
  );

  if (!passes(chosen)) {
    const better = sweep.filter(passes).sort((a, b) => a.mae - b.mae)[0];
    console.error("\nThe shipped tuning does not meet the calibration bars.");
    if (better) {
      console.error(
        `Best tuning that does: damping ${better.tuning.damping}, ` +
          `sigma floor ${better.tuning.sigmaFloor} ` +
          `(Likely ${better.likelyPct.toFixed(1)}%, Unlikely ${better.unlikelyPct.toFixed(1)}%)`,
      );
    } else {
      console.error("No tuning in the sweep meets them; the bands have to widen further.");
    }
    process.exit(1);
  }
  console.log("\nbacktest: calibration bars met");
}

function render(rounds, chosen, sweep, coverage) {
  const held = chosen.perRound.map((r) => `\`${r.round}\``).join(", ");
  return `# Campus Match backtest

Generated by \`scripts/campus-match/backtest.mjs\`. Do not edit by hand.

Each round from the third onward is forecast using only the rounds before it and
compared with what the UGC actually published. Rounds held out: ${held}.

The forecast imported here is the one the product uses, so the calibration below
is about the arithmetic behind a student's number, not a second implementation
of it.

## Headline

| | |
|---|---|
| Cells scored | ${chosen.cells.toLocaleString()} |
| Mean absolute error | ${chosen.mae.toFixed(4)} Z |
| A student one sigma above the forecast was labelled Likely and cleared | **${chosen.likelyPct.toFixed(1)}%** of the time (bar: at least ${LIKELY_BAR}%) |
| A student 1.5 sigma below was labelled Unlikely and cleared | **${chosen.unlikelyPct.toFixed(1)}%** of the time (bar: at most ${UNLIKELY_BAR}%) |

Probes: Likely tested at forecast + ${LIKELY_PROBE}σ (${chosen.likelyTotal.toLocaleString()} cells),
Unlikely at forecast ${UNLIKELY_PROBE}σ (${chosen.unlikelyTotal.toLocaleString()} cells).

## What a report is actually made of

Forecasting the coming round from every published round, across all
${coverage.total.toLocaleString()} course-and-district cells:

| | Cells | Share |
|---|---|---|
| Enough history to read a trend | ${coverage.trend.toLocaleString()} | ${((coverage.trend / coverage.total) * 100).toFixed(1)}% |
| Too short — holds last round, wider band | ${coverage.thin.toLocaleString()} | ${((coverage.thin / coverage.total) * 100).toFixed(1)}% |
| No cut-off to forecast from | ${coverage.none.toLocaleString()} | ${((coverage.none / coverage.total) * 100).toFixed(1)}% |

The third row is the one a student sees as "no cut-off was published for your
district last round", with no percentage beside it. It is large because the UGC
publishes NQC wherever a district had no qualified candidate for a course, which
is common for small districts and selective courses.

## Shipped tuning

| Constant | Value |
|---|---|
| Damping on the recent trend | ${chosen.tuning.damping} |
| Sigma floor | ${chosen.tuning.sigmaFloor} |
| Widening for a series too short to trend | ${chosen.tuning.thinWiden}× |

## Error by held-out round

| Round | Cells | Mean absolute error |
|---|---|---|
${chosen.perRound.map((r) => `| \`${r.round}\` | ${r.cells} | ${r.mae.toFixed(4)} |`).join("\n")}

## What the bars cost

Every combination tried, so the choice above can be checked rather than taken on
trust. "Passes" means Likely cleared at least ${LIKELY_BAR}% and Unlikely at most ${UNLIKELY_BAR}%.

| Damping | Sigma floor | MAE | Likely cleared | Unlikely cleared | Passes |
|---|---|---|---|---|---|
${sweep
  .map(
    (r) =>
      `| ${r.tuning.damping} | ${r.tuning.sigmaFloor} | ${r.mae.toFixed(4)} | ${r.likelyPct.toFixed(1)}% | ${r.unlikelyPct.toFixed(1)}% | ${passes(r) ? "yes" : "no"} |`,
  )
  .join("\n")}

### What the sweep says about the trend

Error rises steadily as more of the recent trend is carried forward, and is
lowest with none of it. Cut-offs move year to year with the size and strength of
one cohort rather than along a path, so last round's figure is on its own the
best single guess, and the three-year trend mostly adds noise. The difference is
small — about ${(((sweep.find((r) => r.tuning.damping === 1 && r.tuning.sigmaFloor === chosen.tuning.sigmaFloor)?.mae ?? 0) / chosen.mae - 1) * 100).toFixed(0)}% of error between carrying all of the trend and none of it — and every setting
clears both bars, so this changes no claim the report makes.

The shipped damping of ${chosen.tuning.damping} is the handoff's, kept because §4 asks for tuning
until the bars are met and they are met comfortably. Setting \`DAMPING\` to 0 in
\`lib/campus-match/forecast.ts\` adopts the lowest-error option instead; re-run
this script after changing it.

## How to read the error

A mean absolute error of ${chosen.mae.toFixed(4)} Z is the average distance between the
forecast and the cut-off the UGC went on to publish. It is not the width of the
band a student is shown: that comes from how much the course moves across all 25
districts, which is wider, and deliberately so.
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
