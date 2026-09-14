#!/usr/bin/env node
/**
 * Downloads every document in sources.json and writes the manifest.
 *
 * Runs in a build session, never on the server. The PDFs are not committed —
 * they are large and they are the UGC's to publish — so this plus the manifest
 * is what lets anyone re-fetch and check the bytes we extracted from.
 *
 * A file whose cover does not carry its declared academic year is refused. The
 * UGC re-points these URLs between cycles, and silently extracting next year's
 * table into a report that prints this year's is the one failure the
 * no-stale-data rule exists to stop.
 *
 * Usage: node scripts/campus-match/fetch.mjs [--out <dir>]
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");

const outFlag = process.argv.indexOf("--out");
/** Where the PDFs land. Outside the repo by default: they are not committed. */
const PDF_DIR = outFlag > -1 ? process.argv[outFlag + 1] : join(REPO, ".campus-match-pdfs");
const MANIFEST = join(REPO, "lib", "content", "ugc", "SOURCES.md");

async function download(url, dest) {
  // curl rather than fetch: these are 1–3MB PDFs from a slow origin behind a
  // proxy, and curl's retry and redirect handling is the battle-tested path.
  await run("curl", ["-sSL", "--max-time", "300", "--retry", "3", "-o", dest, url], {
    maxBuffer: 1024 * 1024 * 64,
  });
  return readFile(dest);
}

/**
 * Text from the opening pages, for the cover-year check.
 *
 * Five pages, not one: the 2023/2024 round opens with a one-page Notice about a
 * single course and only reaches its own title on page 3. Checking page 1 alone
 * rejected a document that was perfectly correct.
 */
async function coverText(pdfPath, python) {
  const script = `
import sys, pdfplumber
with pdfplumber.open(sys.argv[1]) as pdf:
    for page in pdf.pages[:5]:
        print((page.extract_text() or "")[:3000])
`;
  const { stdout } = await run(python, ["-c", script, pdfPath], {
    maxBuffer: 1024 * 1024 * 16,
  });
  return stdout;
}

function normalise(text) {
  // The cover prints "2025/2026"; extraction sometimes spaces the slash.
  return text.replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ");
}

async function main() {
  const python = process.env.CAMPUS_MATCH_PYTHON ?? "python3";
  const sources = JSON.parse(await readFile(join(HERE, "sources.json"), "utf8"));
  await mkdir(PDF_DIR, { recursive: true });
  await mkdir(dirname(MANIFEST), { recursive: true });

  const fetchedAt = new Date().toISOString().slice(0, 10);
  const entries = [];
  const problems = [];

  const all = [
    ...sources.cutoffs.map((s) => ({ ...s, kind: "cutoff", name: s.round })),
    ...sources.handbook.map((s) => ({ ...s, kind: "handbook", name: s.key })),
  ];

  for (const source of all) {
    const dest = join(PDF_DIR, `${source.name}.pdf`);
    process.stdout.write(`fetching ${source.name} … `);
    let bytes;
    try {
      bytes = await download(source.url, dest);
    } catch (err) {
      problems.push(`${source.name}: download failed — ${err.message}`);
      console.log("FAILED");
      continue;
    }

    if (bytes.subarray(0, 4).toString() !== "%PDF") {
      problems.push(`${source.name}: not a PDF (the URL may have moved)`);
      console.log("NOT A PDF");
      continue;
    }

    const sha256 = createHash("sha256").update(bytes).digest("hex");
    let cover = "";
    try {
      cover = normalise(await coverText(dest, python));
    } catch (err) {
      problems.push(`${source.name}: could not read page 1 — ${err.message}`);
    }

    const coverOk = cover.includes(source.coverYear);
    if (!coverOk) {
      problems.push(
        `${source.name}: cover does not carry "${source.coverYear}" — refusing to treat this as that round`,
      );
    }

    // The exam year the round was based on, printed on the cover. This is the
    // line that fixes the results-year to admission-year mapping; see the
    // handoff's Appendix A.1.
    const basis = cover.match(/Based on the results of the G\.C\.E\.[^\]]{0,80}/i)?.[0]?.trim();

    entries.push({
      ...source,
      sha256,
      bytes: bytes.length,
      fetchedAt,
      coverOk,
      basis,
      title: cover.split("\n")[0]?.slice(0, 120) ?? "",
    });
    console.log(coverOk ? `ok (${(bytes.length / 1024).toFixed(0)}KB)` : "COVER MISMATCH");
  }

  await writeFile(MANIFEST, renderManifest(entries, problems, fetchedAt), "utf8");
  console.log(`\nmanifest -> ${MANIFEST}`);

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exitCode = 1;
  }
}

function renderManifest(entries, problems, fetchedAt) {
  const cutoffs = entries.filter((e) => e.kind === "cutoff");
  const inSeries = cutoffs.filter((e) => e.series);
  const newest = cutoffs.find((e) => e.newest);

  const row = (e) =>
    `| \`${e.name}\` | ${e.coverYear} | ${e.series ? "yes" : "no"} | ${e.fetchedAt} | \`${e.sha256.slice(0, 16)}…\` | ${e.url} |`;

  return `# UGC source manifest — Campus Match

Generated by \`scripts/campus-match/fetch.mjs\` on ${fetchedAt}. Do not edit by hand.

Every figure in \`lib/content/ugc/\` comes from a document listed here. A dataset
without an entry does not ship (handoff §2). The PDFs themselves are not
committed; re-fetch them from these URLs and check the hash.

**Newest round: ${newest ? newest.coverYear : "UNKNOWN"}**${newest?.basis ? ` — ${newest.basis}` : ""}

Rounds in the forecast series: **${inSeries.length}** (the handoff requires at least five).

## Cut-off rounds

| Round | Cover year | In series | Fetched | SHA-256 | Source |
|---|---|---|---|---|---|
${cutoffs.map(row).join("\n")}

## Handbook

| Document | Cover year | Fetched | SHA-256 | Source |
|---|---|---|---|---|
${entries
  .filter((e) => e.kind === "handbook")
  .map(
    (e) =>
      `| \`${e.name}\` | ${e.coverYear} | ${e.fetchedAt} | \`${e.sha256.slice(0, 16)}…\` | ${e.url} |`,
  )
  .join("\n")}

## Full hashes

${entries.map((e) => `- \`${e.name}\`  \`${e.sha256}\`  ${e.bytes} bytes`).join("\n")}

## Cover-year verification

Each file's first page was read and checked for its declared academic year.

${entries.map((e) => `- \`${e.name}\`: ${e.coverOk ? "cover carries " + e.coverYear : "**MISMATCH**"}`).join("\n")}

${problems.length > 0 ? `## Problems\n\n${problems.map((p) => `- ${p}`).join("\n")}\n` : "No problems reported by the fetcher.\n"}
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
