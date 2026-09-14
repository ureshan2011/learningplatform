import Link from "next/link";
import { Badge, Card, StatusDot, type StatusTone } from "@/components/ds";
import type { Band } from "@/lib/campus-match/forecast";
import type { Report, ReportRow } from "@/lib/campus-match/report";

/**
 * The four bands, and the rows inside them.
 *
 * A band is the whole point of the report: a student who has just read their
 * Z-score cannot rank forty courses by a percentage, but they can read four
 * lists. The percentage is still printed, because hiding the number the band
 * came from would make the band unfalsifiable.
 *
 * Rendered on the server — the cut-off dataset stays there and only these rows
 * are sent.
 */

const BAND_TITLE: Record<Band, string> = {
  likely: "Likely",
  possible: "Possible",
  reach: "Reach",
  unlikely: "Unlikely",
};

const BAND_HINT: Record<Band, string> = {
  likely: "Your Z-score is comfortably above what these have needed.",
  possible: "These could go either way. This is where your order matters most.",
  reach: "Below what these usually need, but not out of reach in a soft year.",
  unlikely: "Well below recent cut-offs. Listed so you can see the whole picture.",
};

const BAND_TONE: Record<Band, StatusTone> = {
  likely: "success",
  possible: "info",
  reach: "warning",
  unlikely: "neutral",
};

/** Bands below this many rows are open; longer ones start folded. */
const OPEN_UP_TO = 10;

function Row({ row }: { row: ReportRow }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-ict-border-dark py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ict-paper-50">
          {row.code ? (
            <Link
              href={`/campus-match/degree/${row.code}`}
              className="underline-offset-4 hover:underline"
            >
              {row.course}
            </Link>
          ) : (
            row.course
          )}
        </p>
        {/* A handful of rows in the UGC tables set the institution in a way
            the extraction could not resolve. Better a course with no university
            under it than a guessed one. */}
        {row.university ? (
          <p className="mt-0.5 text-xs text-ict-ink-300">{row.university}</p>
        ) : null}
        {row.aptitudeTest || row.checkHandbook || row.thin ? (
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {row.aptitudeTest ? <Badge tone="warning">Aptitude test</Badge> : null}
            {row.checkHandbook ? <Badge tone="neutral">Check handbook</Badge> : null}
            {row.thin ? <Badge tone="neutral">Short history</Badge> : null}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 text-right">
        <p className="font-display text-xl font-extrabold tabular-nums text-ict-paper-50">
          {row.chance}%
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-ict-ink-300">
          {row.forecast !== null ? `Expected around ${row.forecast.toFixed(4)}` : "No estimate"}
        </p>
      </div>
    </li>
  );
}

function BandCard({ band, rows }: { band: Band; rows: ReportRow[] }) {
  if (rows.length === 0) return null;
  const open = rows.length <= OPEN_UP_TO;

  return (
    <Card radius="panel" className="mt-4 p-5 sm:p-6">
      <details open={open}>
        {/* A native disclosure rather than state: four long lists on a cheap
            phone should not wait on JavaScript to become readable. */}
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <span className="flex items-center gap-2.5">
            <StatusDot tone={BAND_TONE[band]} />
            <span className="font-display text-lg font-extrabold tracking-[-0.02em] text-ict-paper-50">
              {BAND_TITLE[band]}
            </span>
            <Badge tone="neutral">{rows.length}</Badge>
          </span>
          <span className="text-xs font-semibold text-ict-ink-300">
            {open ? "Hide" : "Show"}
          </span>
        </summary>
        <p className="mt-1.5 text-sm text-ict-ink-300">{BAND_HINT[band]}</p>
        <ul className="mt-3">
          {rows.map((row) => (
            <Row key={row.key} row={row} />
          ))}
        </ul>
      </details>
    </Card>
  );
}

export function Bands({ report }: { report: Report }) {
  const order: Band[] = ["likely", "possible", "reach", "unlikely"];
  return (
    <div>
      {order.map((band) => (
        <BandCard key={band} band={band} rows={report.bands[band]} />
      ))}

      {report.noCutoff.length > 0 ? (
        <Card radius="panel" className="mt-4 p-5 sm:p-6">
          <details>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span className="flex items-center gap-2.5">
                <StatusDot tone="neutral" />
                <span className="font-display text-lg font-extrabold tracking-[-0.02em] text-ict-paper-50">
                  No cut-off to estimate from
                </span>
                <Badge tone="neutral">{report.noCutoff.length}</Badge>
              </span>
              <span className="text-xs font-semibold text-ict-ink-300">Show</span>
            </summary>
            {/* Not a band: these are courses your stream may apply for with no
                published history to forecast from. Giving them a percentage
                would be inventing one. */}
            <p className="mt-1.5 text-sm text-ict-ink-300">
              These admit your stream, but there is no recent published cut-off to estimate from.
              Some are admitted on all-island merit and have no district column at all; for others
              nobody from {report.districtName} applied recently. No estimate can be made, which is
              not the same as no chance.
            </p>
            <ul className="mt-3">
              {report.noCutoff.map((row) => (
                <li
                  key={row.key}
                  className="border-t border-ict-border-dark py-3 text-sm first:border-t-0"
                >
                  {row.code ? (
                    <Link
                      href={`/campus-match/degree/${row.code}`}
                      className="font-semibold text-ict-paper-50 underline-offset-4 hover:underline"
                    >
                      {row.course}
                    </Link>
                  ) : (
                    <span className="font-semibold text-ict-paper-50">{row.course}</span>
                  )}
                  {row.university ? (
                    <span className="mt-0.5 block text-xs text-ict-ink-300">{row.university}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>
        </Card>
      ) : null}
    </div>
  );
}
