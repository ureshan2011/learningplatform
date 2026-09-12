/**
 * Prints the Sinhala subject terms still awaiting a check against the NIE
 * teachers' resource book and recent Sinhala past papers.
 *
 * Run it, sit with the book, and correct anything wrong in
 * `lib/i18n/ict-terms.ts` — one file, and every lesson, interactive and note
 * follows. Drop `verify: true` from a term once you have confirmed it, and it
 * stops appearing here.
 *
 *   node scripts/ict-terms-to-check.mjs
 *
 * Deliberately plain Node with no TypeScript step: this is a checklist for a
 * teacher, not part of the build, and it should run on any machine with Node
 * on it without installing anything first.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "..", "lib", "i18n", "ict-terms.ts"), "utf8");

// Matches: key: t("english", "සිංහල", true)
const ENTRY = /(\w+):\s*t\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*(?:,\s*(true|false))?\s*\)/g;

const rows = [];
let match;
while ((match = ENTRY.exec(source)) !== null) {
  const [, key, en, si, verify] = match;
  if (verify === "true") rows.push({ key, en, si });
}

if (rows.length === 0) {
  console.log("Every term has been checked. Nothing to do.");
  process.exit(0);
}

console.log(`${rows.length} Sinhala terms to check against the NIE resource book\n`);
const width = Math.max(...rows.map((r) => r.en.length));
for (const row of rows) {
  console.log(`  ${row.en.padEnd(width)}   ${row.si}`);
}
console.log(`\nCorrect any of these in lib/i18n/ict-terms.ts, then drop "true" from the`);
console.log(`term's line so it stops showing up here.`);
