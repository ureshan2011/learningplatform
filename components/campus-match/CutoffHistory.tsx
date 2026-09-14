import { NQC } from "@/lib/campus-match/forecast";
import type { HistoryPoint } from "@/lib/campus-match/profiles";

/**
 * This course's published cut-offs in one district, as bars.
 *
 * CSS only — the handoff rules out a chart library, and on a 360px Android over
 * 3G that is the right call for eight bars. The scale starts a little below the
 * lowest figure rather than at zero, because Z-scores cluster and a zero
 * baseline would flatten eight years into one indistinguishable block.
 */

export function CutoffHistory({
  points,
  districtName,
  z,
}: {
  points: HistoryPoint[];
  districtName: string;
  /** The reader's own Z-score, drawn as a line across the bars. */
  z?: number;
}) {
  const numbers = points
    .map((p) => p.value)
    .filter((v): v is number => typeof v === "number");
  if (numbers.length === 0) return null;

  const low = Math.min(...numbers, z ?? Infinity);
  const high = Math.max(...numbers, z ?? -Infinity);
  // A flat series would divide by zero; a little headroom either side also stops
  // the tallest bar touching the ceiling.
  const floor = low - Math.max(0.1, (high - low) * 0.25);
  const ceiling = high + Math.max(0.05, (high - low) * 0.1);
  const height = (value: number) => ((value - floor) / (ceiling - floor)) * 100;

  return (
    <div>
      <div className="relative flex h-32 items-end gap-1.5" aria-hidden>
        {z !== undefined ? (
          <span
            className="absolute inset-x-0 border-t border-dashed border-ict-orange-500"
            style={{ bottom: `${Math.max(0, Math.min(100, height(z)))}%` }}
          />
        ) : null}
        {points.map((point) => (
          <span key={point.round} className="flex h-full flex-1 items-end">
            {typeof point.value === "number" ? (
              <span
                className="w-full rounded-t-[4px] bg-ict-ink-600"
                style={{ height: `${Math.max(2, height(point.value))}%` }}
              />
            ) : (
              <span className="w-full border-t border-dashed border-ict-border-dark" />
            )}
          </span>
        ))}
      </div>

      <ol className="mt-2 flex gap-1.5">
        {points.map((point) => (
          <li key={point.round} className="flex-1 text-center">
            <span className="block text-[11px] tabular-nums text-ict-ink-400">
              {point.round.slice(2, 4)}/{point.round.slice(-2)}
            </span>
            <span className="block text-[11px] tabular-nums text-ict-ink-300">
              {point.value === NQC ? "—" : (point.value as number).toFixed(2)}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-xs text-ict-ink-400">
        The lowest cut-off published for {districtName} in each round, across every university
        offering this course. A dash is a round where none was published for the district.
        {z !== undefined ? " The dashed line is your Z-score." : ""}
      </p>
    </div>
  );
}
