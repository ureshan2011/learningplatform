"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ThinkingOrb } from "thinking-orbs";
import { Icon } from "@/components/ui/Icon";
import { Badge, ButtonLink, Card, StatusDot } from "@/components/ds-cream";
import { track } from "@/lib/analytics";

/**
 * The free eligibility checker.
 *
 * Everything the student types lives in the URL, so a link they paste into a
 * WhatsApp group reproduces their results for whoever opens it, and coming back
 * to the page needs nothing retyped. That is also what carries their answers
 * through sign-in and payment without a single field being typed twice — the
 * call to action below passes the same query string to `/campus-match`.
 *
 * No login, no Firestore, no forecast. Published cut-offs are public data and
 * keeping them public is what earns the traffic; the forecast is the product.
 */

export interface CheckerDistrict {
  key: string;
  name: string;
}
export interface CheckerStream {
  key: string;
  name: string;
  subjects: string[];
}

interface Row {
  course: string;
  university: string;
  lastCutoff: number | null;
  trend: "up" | "down" | "flat" | "unknown";
  gap: number | null;
  code?: string;
  checkHandbook: boolean;
  aptitudeTest?: boolean;
  matchedSubjects?: string[];
}

interface Result {
  rows: Row[];
  coverYear: string;
  districtName: string;
  unmatched: number;
}

/** Subjects carry spaces and ampersands; the URL carries slugs of them. */
function slug(subject: string): string {
  return subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const TREND_LABEL: Record<Row["trend"], string> = {
  up: "Rising since 2022/2023",
  down: "Falling since 2022/2023",
  flat: "Steady since 2022/2023",
  unknown: "No earlier figure to compare",
};

const TREND_ICON = {
  up: "trending_up",
  down: "trending_down",
  flat: "trending_flat",
  unknown: "trending_flat",
} as const;

export function FreeChecker({
  districts,
  streams,
  zMin,
  zMax,
}: {
  districts: CheckerDistrict[];
  streams: CheckerStream[];
  zMin: number;
  zMax: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [z, setZ] = useState(() => params.get("z") ?? "");
  const [district, setDistrict] = useState(() => params.get("d") ?? "");
  const [stream, setStream] = useState(() => params.get("s") ?? "");
  const [passes, setPasses] = useState<Set<string>>(
    () => new Set((params.get("p") ?? "").split(",").filter(Boolean)),
  );
  const [medium, setMedium] = useState(() => params.get("m") === "en");

  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const chosenStream = useMemo(
    () => streams.find((s) => s.key === stream),
    [streams, stream],
  );

  const zNumber = Number(z);
  const zValid = z.trim() !== "" && Number.isFinite(zNumber) && zNumber >= zMin && zNumber <= zMax;
  const ready = zValid && district !== "" && stream !== "";

  /** The query string every link out of this page carries. */
  const query = useMemo(() => {
    const next = new URLSearchParams();
    if (z) next.set("z", z);
    if (district) next.set("d", district);
    if (stream) next.set("s", stream);
    if (passes.size > 0) next.set("p", [...passes].join(","));
    if (medium) next.set("m", "en");
    return next.toString();
  }, [z, district, stream, passes, medium]);

  // Written back without adding a history entry, so the back button still
  // leaves the page instead of walking through every keystroke.
  useEffect(() => {
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [query, pathname, router]);

  const requestId = useRef(0);

  const run = useCallback(async () => {
    if (!ready) {
      setResult(null);
      return;
    }
    const id = ++requestId.current;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/campus-match/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          z: zNumber,
          district,
          stream,
          passes: chosenStream?.subjects.filter((s) => passes.has(slug(s))) ?? [],
        }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? "Too many checks. Wait a moment." : "failed");
      const data = (await res.json()) as Result;
      // A slower earlier request must not overwrite a newer answer.
      if (id === requestId.current) setResult(data);
    } catch (err) {
      if (id === requestId.current) {
        setError(err instanceof Error && err.message !== "failed" ? err.message : "Could not check just now. Try again.");
      }
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }, [ready, zNumber, district, stream, passes, chosenStream]);

  // Debounced, because the Z-score field is typed a character at a time.
  useEffect(() => {
    const timer = setTimeout(run, 350);
    return () => clearTimeout(timer);
  }, [run]);

  function toggleSubject(subject: string) {
    const key = slug(subject);
    setPasses((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const shown = result ? (showAll ? result.rows : result.rows.slice(0, 12)) : [];

  return (
    <div>
      {/* ---- the three inputs, above everything else ---- */}
      <Card radius="card" className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="block text-[13px] font-semibold text-ict-ink-900">Your Z-score</span>
            <input
              value={z}
              onChange={(e) => setZ(e.target.value)}
              inputMode="decimal"
              placeholder="1.8500"
              aria-label="Your Z-score"
              className="mt-1.5 h-11 w-full rounded-full border border-ict-border-light bg-white px-4 text-base outline-none focus:border-ict-orange-500"
            />
            {z.trim() !== "" && !zValid ? (
              <span className="mt-1 block text-xs text-ict-ink-400">
                Enter a number between {zMin} and {zMax}.
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="block text-[13px] font-semibold text-ict-ink-900">Your district</span>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              aria-label="Your district"
              className="mt-1.5 h-11 w-full rounded-full border border-ict-border-light bg-white px-4 text-base outline-none focus:border-ict-orange-500"
            >
              <option value="">Choose…</option>
              {districts.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[13px] font-semibold text-ict-ink-900">Your stream</span>
            <select
              value={stream}
              onChange={(e) => {
                setStream(e.target.value);
                setPasses(new Set());
              }}
              aria-label="Your A/L stream"
              className="mt-1.5 h-11 w-full rounded-full border border-ict-border-light bg-white px-4 text-base outline-none focus:border-ict-orange-500"
            >
              <option value="">Choose…</option>
              {streams.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {chosenStream && chosenStream.subjects.length > 0 ? (
          <div className="mt-5">
            <p className="text-[13px] font-semibold text-ict-ink-900">
              Which did you pass with a C or better?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {chosenStream.subjects.map((subject) => {
                const on = passes.has(slug(subject));
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    aria-pressed={on}
                    className={`inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                      on
                        ? "bg-ict-ink-900 text-white"
                        : "bg-ict-paper-200 text-ict-ink-900 hover:bg-ict-paper-300"
                    }`}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
            <label className="mt-3 flex items-center gap-2.5 text-[13px] text-ict-ink-500">
              <input
                type="checkbox"
                checked={medium}
                onChange={(e) => setMedium(e.target.checked)}
                className="size-4 accent-ict-orange-500"
              />
              I can study in English medium
            </label>
          </div>
        ) : null}
      </Card>

      {/* ---- results ---- */}
      <div className="mt-5" aria-live="polite">
        {!ready ? (
          <p className="text-sm text-ict-ink-400">
            Fill in all three and the courses your stream can apply for appear here, with the
            cut-off each one needed in your district last round.
          </p>
        ) : error ? (
          <p className="text-sm text-ict-ink-500">{error}</p>
        ) : !result ? (
          busy ? (
            <p className="flex items-center gap-2 text-sm text-ict-ink-400">
              <ThinkingOrb state="searching" theme="light" size={20} aria-label="Checking…" />
              Checking…
            </p>
          ) : null
        ) : result.rows.length === 0 ? (
          <p className="text-sm text-ict-ink-500">
            No published course matched that stream. Check the handbook — it is the authority.
          </p>
        ) : (
          <>
            <p className="text-sm text-ict-ink-500">
              <span className="font-semibold text-ict-ink-900">{result.rows.length} courses</span>{" "}
              your stream can apply for, nearest your Z-score first.
            </p>

            <ul className="mt-3 space-y-2">
              {shown.map((row) => (
                <li key={`${row.course}||${row.university}`}>
                  <Card radius="md" className="p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="min-w-0 text-[15px] font-bold text-ict-ink-900">{row.course}</p>
                      <p className="font-display text-base font-extrabold text-ict-ink-900">
                        {row.lastCutoff === null ? (
                          <span className="text-sm font-semibold text-ict-ink-400">
                            No cut-off published
                          </span>
                        ) : (
                          row.lastCutoff.toFixed(4)
                        )}
                      </p>
                    </div>
                    {/* A handful of rows in the UGC tables set the institution
                        in a way the extraction could not resolve. Better a
                        course with no university under it than a guessed one. */}
                    {row.university ? (
                      <p className="mt-0.5 text-[13px] text-ict-ink-400">{row.university}</p>
                    ) : null}

                    <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ict-ink-400">
                      {row.lastCutoff !== null ? (
                        <span className="inline-flex items-center gap-1.5">
                          <StatusDot tone={row.gap !== null && row.gap >= 0 ? "success" : "neutral"} />
                          {row.gap !== null && row.gap >= 0
                            ? `${row.gap.toFixed(4)} above last round's cut-off`
                            : `${Math.abs(row.gap ?? 0).toFixed(4)} below last round's cut-off`}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Icon name={TREND_ICON[row.trend]} className="!text-sm" />
                        {TREND_LABEL[row.trend]}
                      </span>
                    </p>

                    {(row.checkHandbook || row.aptitudeTest || row.matchedSubjects?.length) ? (
                      <p className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {row.aptitudeTest ? <Badge tone="warning">Aptitude test</Badge> : null}
                        {row.matchedSubjects && row.matchedSubjects.length > 0 ? (
                          <Badge tone="success">
                            You have {row.matchedSubjects.length} of the subjects it names
                          </Badge>
                        ) : null}
                        {row.checkHandbook ? <Badge tone="neutral">Check handbook</Badge> : null}
                      </p>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>

            {!showAll && result.rows.length > shown.length ? (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="mt-3 text-sm font-semibold text-ict-orange-600 underline underline-offset-4"
              >
                Show all {result.rows.length}
              </button>
            ) : null}

            {/* ---- the source line, under the results, always ---- */}
            <p className="mt-5 text-xs leading-relaxed text-ict-ink-400">
              Cut-offs from the UGC&rsquo;s published round {result.coverYear}, for{" "}
              {result.districtName}. Eligibility is summarised from the UGC handbook; the handbook
              is the authority. ICT Campus is not affiliated with the UGC.
              {result.unmatched > 0
                ? ` ${result.unmatched} more published courses could not be matched to a handbook entry and are not listed.`
                : ""}
            </p>
          </>
        )}
      </div>

      {/* ---- the one orange thing on this region ---- */}
      {ready && result && result.rows.length > 0 ? (
        <div className="sticky bottom-3 z-20 mt-5">
          <Card radius="card" className="p-4 shadow-[var(--lp-shadow-lg)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ict-ink-900">
                  See your chances for the coming round
                </p>
                <p className="mt-0.5 text-xs text-ict-ink-400">
                  Forecast, four bands, application-order builder. An estimate, not a promise.
                </p>
              </div>
              <ButtonLink
                href={query ? `/campus-match?${query}` : "/campus-match"}
                variant="primary"
                size="sm"
                onClick={() => track("begin_checkout", { kind: "campus-match", from: "checker" })}
              >
                Rs 1,490
              </ButtonLink>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
