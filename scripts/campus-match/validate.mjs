#!/usr/bin/env node
/**
 * Cross-checks the extracted cut-off data and writes QA.md.
 *
 * Exits non-zero on any error, so a bad extraction stops the build session
 * rather than reaching the forecast. The forecast cannot tell a mis-parsed
 * number from a real one, and a wrong cut-off on a report a student pays for is
 * the worst thing this product can do.
 *
 * Usage: node scripts/campus-match/validate.mjs
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const CUTOFFS = join(REPO, "lib", "content", "ugc", "cutoffs");
const COURSES = join(REPO, "lib", "content", "ugc", "courses.json");
const QA = join(REPO, "lib", "content", "ugc", "QA.md");

const DISTRICTS = 25;
/** A Z-score outside this is a parse error, not a result. */
const Z_MIN = -3.5;
const Z_MAX = 3.5;

/** Eye-checks done against the rendered PDF pages, recorded for QA.md. */
const EYE_CHECKS = [
  {
    round: "2025-2026",
    page: 2,
    what: "BIOLOGICAL SCIENCE at Peradeniya, Sri Jayewardenepura and Kelaniya, first 13 districts",
    cells: 39,
    result: "39 of 39 matched",
  },
  {
    round: "2022-2023",
    page: 2,
    what: "BIOLOGICAL SCIENCE at Peradeniya and Sri Jayewardenepura, all 25 districts",
    cells: 50,
    result: "50 of 50 matched",
  },
];

async function main() {
  const files = (await readdir(CUTOFFS)).filter((f) => f.endsWith(".json")).sort();
  const errors = [];
  const rounds = [];

  for (const file of files) {
    const data = JSON.parse(await readFile(join(CUTOFFS, file), "utf8"));
    const round = data.round;
    let numeric = 0;
    let nqc = 0;
    let min = Infinity;
    let max = -Infinity;

    let unresolved = 0;
    for (const row of data.rows) {
      if (!row.university) unresolved += 1;
      const keys = Object.keys(row.districts);
      if (keys.length !== DISTRICTS) {
        errors.push(`${round}: "${row.course}" has ${keys.length} districts, expected ${DISTRICTS}`);
      }
      if (!row.course) {
        errors.push(`${round}: a column on page ${row.page} has no course name`);
      }
      for (const [district, value] of Object.entries(row.districts)) {
        if (value === "NQC") {
          nqc += 1;
          continue;
        }
        if (typeof value !== "number" || Number.isNaN(value)) {
          errors.push(`${round}: ${row.course}/${district} is ${JSON.stringify(value)}`);
          continue;
        }
        if (value < Z_MIN || value > Z_MAX) {
          errors.push(`${round}: ${row.course}/${district} is ${value}, outside ${Z_MIN}..${Z_MAX}`);
        }
        numeric += 1;
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }

    // A row whose institution could not be resolved still carries its cut-offs,
    // but it cannot join to itself in the next round, so it is dead weight in
    // the series. A few is the cost of these PDFs; a lot is a broken extractor.
    const unresolvedPct = Math.round((unresolved / data.rows.length) * 100);
    if (unresolvedPct > 5) {
      errors.push(
        `${round}: ${unresolved} of ${data.rows.length} rows (${unresolvedPct}%) have no resolved institution`,
      );
    }

    rounds.push({
      round,
      coverYear: data.coverYear,
      courses: data.rows.length,
      unresolved,
      numeric,
      nqc,
      min: numeric ? min : null,
      max: numeric ? max : null,
      keys: new Set(data.rows.map((r) => `${r.course}||${r.university}`)),
    });
  }

  if (rounds.length < 5) {
    errors.push(`only ${rounds.length} rounds extracted; the forecast needs at least five`);
  }

  // Courses must join across rounds, or the series the forecast is built on is
  // really a different course each year wearing the same row.
  const joins = [];
  for (let i = 1; i < rounds.length; i += 1) {
    const prev = rounds[i - 1];
    const cur = rounds[i];
    const shared = [...cur.keys].filter((k) => prev.keys.has(k)).length;
    const pct = Math.round((shared / cur.keys.size) * 100);
    joins.push({ from: prev.round, to: cur.round, shared, pct });
    if (pct < 60) {
      errors.push(`${prev.round} -> ${cur.round}: only ${pct}% of courses join across the rounds`);
    }
  }

  // Does the newest round's course list reach the handbook? Eligibility lives
  // there, so a cut-off row that cannot find its handbook entry is a row the
  // free checker can price but not say who may apply for.
  const handbook = await readHandbook();
  const newest = JSON.parse(
    await readFile(join(CUTOFFS, files[files.length - 1]), "utf8"),
  );
  const names = [...new Set(newest.rows.map((r) => r.course))];
  const matched = names.filter((n) => matches(handbook, n));
  const courseJoin = {
    total: names.length,
    matched: matched.length,
    pct: Math.round((matched.length / names.length) * 100),
    unmatched: names.filter((n) => !matches(handbook, n)).sort(),
  };

  await writeFile(QA, renderQa(rounds, joins, errors, courseJoin), "utf8");
  console.log(`QA -> ${QA}`);

  for (const round of rounds) {
    console.log(
      `${round.round}: ${round.courses} courses, ${round.numeric} numeric, ${round.nqc} NQC, ` +
        `range ${round.min?.toFixed(4)}..${round.max?.toFixed(4)}`,
    );
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s):`);
    for (const e of errors.slice(0, 30)) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("\nvalidate: clean");
}

/**
 * Course titles as the two documents print them, reduced to something joinable.
 *
 * The cut-off tables set titles in capitals with footnote markers and
 * abbreviations — "APPLIED SCIENCES (BIO.SC) *" — while the handbook writes
 * them out in sentence case. Neither spelling is wrong; they just have to meet.
 */
function normaliseCourse(name) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[*#]/g, " ")
    // Joining words are the commonest difference: the tables print "BANKING &
    // INSURANCE" where the handbook writes "Banking and Insurance".
    .replace(/\b(and|the|of|in|for)\b/g, " ")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * The same lookup `lib/campus-match/check.ts` uses, so the figure reported here
 * is the one the product achieves rather than a stricter one nobody runs.
 */
function matches(keys, title) {
  const key = normaliseCourse(title);
  if (keys.has(key)) return true;
  if (key.length < 12) return false;
  let found = 0;
  for (const candidate of keys) {
    if (candidate.startsWith(key) || key.startsWith(candidate)) found += 1;
    if (found > 1) return false;
  }
  return found === 1;
}

async function readHandbook() {
  try {
    const data = JSON.parse(await readFile(COURSES, "utf8"));
    return new Set(data.courses.map((c) => normaliseCourse(c.name)));
  } catch {
    return new Set();
  }
}

function renderQa(rounds, joins, errors, courseJoin) {
  return `# Campus Match data QA

Generated by \`scripts/campus-match/validate.mjs\`. Do not edit by hand.

Every figure here comes from a document in \`SOURCES.md\`. The checks below are
the ones in the handoff §2.1: 25 districts on every row, every Z-score inside a
plausible range, and courses that join across rounds.

## Rounds

| Round | Cover year | Courses | Institution unresolved | Numeric cells | NQC cells | Lowest Z | Highest Z |
|---|---|---|---|---|---|---|---|
${rounds
  .map(
    (r) =>
      `| \`${r.round}\` | ${r.coverYear} | ${r.courses} | ${r.unresolved} | ${r.numeric} | ${r.nqc} | ${r.min?.toFixed(4) ?? "—"} | ${r.max?.toFixed(4) ?? "—"} |`,
  )
  .join("\n")}

## Courses joining across rounds

A course is keyed by its printed title and university. A low figure here would
mean the series the forecast is fitted on is not the same course year to year.

| From | To | Courses in both | Share of the later round |
|---|---|---|---|
${joins.map((j) => `| \`${j.from}\` | \`${j.to}\` | ${j.shared} | ${j.pct}% |`).join("\n")}

## Cut-off rows reaching the handbook

Eligibility comes from the handbook, so a course in the newest round that cannot
find its handbook entry is one the checker can price but cannot say who may
apply for. Titles are matched with brackets, footnote markers and punctuation
removed, because the two documents set the same course differently.

**${courseJoin.matched} of ${courseJoin.total} course titles (${courseJoin.pct}%)** in the newest round match a handbook entry.

${courseJoin.unmatched.length > 0 ? `Unmatched:\n\n${courseJoin.unmatched.map((n) => `- \`${n}\``).join("\n")}` : "All matched."}

## Checked by eye against the rendered page

The extractor reads character positions, so a column can silently shift by one
and still produce clean-looking numbers. These samples were rendered from the
PDF and read against the extracted JSON.

${EYE_CHECKS.map(
  (c) => `- **${c.round}**, page ${c.page} — ${c.what}. ${c.cells} cells, ${c.result}.`,
).join("\n")}

Both page layouts are covered: the newer rounds set the page upright with the
course titles rotated, and the older ones set \`/Rotate 90\` with interleaved
text layers. Those are the two ways these PDFs are built, and the second is the
one that had to be read by geometry rather than by text order.

## Column counts

Columns are taken from the district rows, not from the headers, and the header
text is then fitted to them. That is what makes the course count match the table
instead of falling short wherever a footnote overlapped a title.

${errors.length > 0 ? `## Errors\n\n${errors.map((e) => `- ${e}`).join("\n")}\n` : "No errors.\n"}
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
