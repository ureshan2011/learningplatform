import "server-only";

import manifest from "@/lib/content/ugc/manifest.json";
import { STALE_AFTER_DAYS } from "@/lib/campus-match/cycle";

/**
 * The UGC dataset, and how old it is.
 *
 * Server-only, and the cut-off tables are never exported whole: the client gets
 * answers computed from them, never the file. Sending ~52,000 cells to a phone
 * on 3G would also be the largest thing the app ever shipped.
 *
 * The freshness answer comes from `manifest.json`, which the fetch script
 * writes beside `SOURCES.md` — the same facts, for code rather than a reader.
 * A refusal to sell must not depend on a regex over a document written for a
 * person.
 */

export interface DataFreshness {
  /** The newest round in the dataset, e.g. "2025-2026". */
  round: string | null;
  /** As the UGC prints it, e.g. "2025/2026". */
  coverYear: string | null;
  /** Which A/L examination it was based on, quoted from the cover. */
  basis: string | null;
  /** When the pipeline last fetched it. */
  fetchedAt: string | null;
  ageDays: number;
  stale: boolean;
  /** How many rounds the forecast has to work from. */
  rounds: number;
}

export function dataFreshness(at: number = Date.now()): DataFreshness {
  const fetchedAt = manifest.newestFetchedAt ?? null;
  const ageDays = fetchedAt
    ? Math.floor((at - Date.parse(`${fetchedAt}T00:00:00Z`)) / 86_400_000)
    : Number.MAX_SAFE_INTEGER;

  return {
    round: manifest.newestRound ?? null,
    coverYear: manifest.newestCoverYear ?? null,
    basis: manifest.newestBasis ?? null,
    fetchedAt,
    ageDays,
    stale: ageDays > STALE_AFTER_DAYS,
    rounds: manifest.seriesRounds?.length ?? 0,
  };
}

/** The oldest and newest rounds, for the "Based on UGC rounds A to B" line. */
export function roundSpan(): { from: string | null; to: string | null } {
  const rounds = manifest.seriesRounds ?? [];
  return { from: rounds[0] ?? null, to: rounds[rounds.length - 1] ?? null };
}

/** The handbook edition eligibility is summarised from. */
export function handbookCoverYear(): string | null {
  return manifest.handbookCoverYear ?? null;
}
