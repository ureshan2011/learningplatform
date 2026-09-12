"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { interpolate } from "@/lib/i18n/dictionary";
import type { ToneColors } from "@/lib/content/unit-visuals";
import {
  SAMPLE_PROCESSES,
  schedule,
  type Algorithm,
  type AlgorithmId,
  type Process,
  type ProcessState,
} from "@/lib/content/scheduling";

const QUANTA = [1, 2, 3, 4];

/** Everything this interactive says, resolved to one language on the server. */
export interface SchedulingCopy {
  heading: string;
  intro: string;
  quantum: string;
  colProcess: string;
  colArrival: string;
  colBurst: string;
  colCompletion: string;
  colTurnaround: string;
  colWaiting: string;
  average: string;
  /** "{id}" is interpolated. */
  burstLabel: string;
  formulaNote: string;
  idle: string;
  statesSummary: string;
}

/**
 * Scheduling for competency level 5.3 — the Gantt chart and the timing table,
 * for the three algorithms the syllabus names.
 *
 * This is a calculation students can do and cannot check. One segment in the
 * wrong place shifts every completion time after it, and the only way to find
 * out is to do the whole thing again. Being able to change the burst times and
 * watch the averages move is also the fastest way to see *why* shortest job
 * first wins on average waiting time and why that is not the whole story.
 *
 * The arithmetic lives in `lib/content/scheduling.ts` and is checked against
 * hand-worked answers for all three algorithms.
 */
export function ProcessSchedulingLab({
  tone,
  algorithms,
  states,
  copy,
}: {
  tone: ToneColors;
  algorithms: Algorithm[];
  states: ProcessState[];
  copy: SchedulingCopy;
}) {
  const [algorithmId, setAlgorithmId] = useState<AlgorithmId>("fcfs");
  const [quantum, setQuantum] = useState(2);
  const [processes, setProcesses] = useState<Process[]>(SAMPLE_PROCESSES);

  const result = useMemo(
    () => schedule(algorithmId, processes, quantum),
    [algorithmId, processes, quantum],
  );
  const algorithm = algorithms.find((a) => a.id === algorithmId) as Algorithm;
  const totalTime = result.segments[result.segments.length - 1]?.end ?? 1;

  function setBurst(id: string, burst: number) {
    setProcesses((prev) => prev.map((p) => (p.id === id ? { ...p, burst } : p)));
  }

  return (
    <div className="rounded-ict-card border border-ict-paper-300 bg-ict-paper-50 p-4">
      <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">
        {copy.heading}
      </p>
      <p className="mt-1.5 text-sm text-ict-ink-500">{copy.intro}</p>

      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Scheduling algorithm">
        {algorithms.map((a) => {
          const isActive = a.id === algorithmId;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setAlgorithmId(a.id)}
              className="ict-press rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors duration-[120ms] ease-ict"
              style={
                isActive
                  ? { background: tone.gradTo, borderColor: tone.gradTo, color: "#fff" }
                  : {
                      background: "#fff",
                      borderColor: "var(--color-ict-paper-300)",
                      color: "var(--color-ict-ink-500)",
                    }
              }
            >
              {a.label}
            </button>
          );
        })}

        {algorithm.preemptive ? (
          <span className="flex items-center gap-2 rounded-full border border-ict-paper-300 bg-ict-paper-0 px-3 py-1.5">
            <span className="text-xs font-semibold text-ict-ink-400">{copy.quantum}</span>
            {QUANTA.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuantum(q)}
                aria-pressed={q === quantum}
                className="ict-press size-6 rounded-full font-mono text-xs font-bold transition-colors duration-[120ms] ease-ict"
                style={
                  q === quantum
                    ? { background: tone.soft, color: tone.ink }
                    : { color: "var(--color-ict-ink-400)" }
                }
              >
                {q}
              </button>
            ))}
          </span>
        ) : null}
      </div>

      <p key={algorithm.id} className="ict-step-enter mt-2.5 text-sm text-ict-ink-500">
        <strong className="font-semibold text-ict-ink-900">{algorithm.full}.</strong>{" "}
        {algorithm.rule}
      </p>

      {/* Gantt chart. Proportional widths, so a long burst looks long. */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[20rem]">
          <div className="flex h-12 w-full overflow-hidden rounded-xl border border-ict-paper-300">
            {result.segments.map((segment, i) => {
              const width = ((segment.end - segment.start) / totalTime) * 100;
              const isIdle = segment.id === null;
              return (
                <div
                  key={`${segment.start}-${i}`}
                  className="flex items-center justify-center border-r border-white/40 font-mono text-xs font-bold last:border-r-0"
                  style={{
                    width: `${width}%`,
                    background: isIdle ? "var(--color-ict-paper-200)" : tone.soft,
                    color: isIdle ? "var(--color-ict-ink-300)" : tone.ink,
                  }}
                  title={`${segment.id ?? copy.idle}: ${segment.start} – ${segment.end}`}
                >
                  {width > 6 ? (segment.id ?? copy.idle) : ""}
                </div>
              );
            })}
          </div>

          {/* Tick marks: the boundary times are what an exam answer must label. */}
          <div className="relative mt-1 h-4">
            {[0, ...result.segments.map((s) => s.end)].map((tick, i, all) => (
              <span
                key={i}
                className="absolute font-mono text-[11px] text-ict-ink-400"
                style={{
                  left: `${(tick / totalTime) * 100}%`,
                  // The first and last labels are pulled inside the chart rather
                  // than centred on their tick, or they hang off both ends.
                  transform:
                    i === 0 ? "none" : i === all.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
                }}
              >
                {tick}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* The timing table, which is what the marks are actually for. */}
      <div className="mt-4 overflow-x-auto rounded-ict-md border border-ict-paper-300 bg-ict-paper-0">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs font-bold text-ict-ink-400">
              <th scope="col" className="px-3 py-2">{copy.colProcess}</th>
              <th scope="col" className="px-3 py-2">{copy.colArrival}</th>
              <th scope="col" className="px-3 py-2">{copy.colBurst}</th>
              <th scope="col" className="px-3 py-2">{copy.colCompletion}</th>
              <th scope="col" className="px-3 py-2">{copy.colTurnaround}</th>
              <th scope="col" className="px-3 py-2">{copy.colWaiting}</th>
            </tr>
          </thead>
          <tbody>
            {result.metrics.map((m) => (
              <tr key={m.id} className="border-t border-ict-paper-200">
                <th scope="row" className="px-3 py-2 font-mono font-bold text-ict-ink-900">{m.id}</th>
                <td className="px-3 py-2 font-mono text-ict-ink-500">{m.arrival}</td>
                <td className="px-3 py-2">
                  <label className="flex items-center gap-1.5">
                    <span className="sr-only">{interpolate(copy.burstLabel, { id: m.id })}</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={m.burst}
                      onChange={(e) => setBurst(m.id, Number(e.target.value))}
                      className="w-20"
                      // The unit's own accent, not the brand orange: this sits
                      // inside a region that already has one accent colour.
                      style={{ accentColor: tone.gradTo }}
                    />
                    <span className="w-4 font-mono text-ict-ink-900">{m.burst}</span>
                  </label>
                </td>
                <td className="px-3 py-2 font-mono text-ict-ink-500">{m.completion}</td>
                <td className="px-3 py-2 font-mono text-ict-ink-500">{m.turnaround}</td>
                <td className="px-3 py-2 font-mono font-bold" style={{ color: tone.ink }}>
                  {m.waiting}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ict-paper-300">
              <td colSpan={4} className="px-3 py-2 text-xs font-bold text-ict-ink-400 uppercase">
                {copy.average}
              </td>
              <td className="px-3 py-2 font-mono font-bold" style={{ color: tone.ink }}>
                {result.averageTurnaround.toFixed(2)}
              </td>
              <td className="px-3 py-2 font-mono font-bold" style={{ color: tone.ink }}>
                {result.averageWaiting.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-2 text-xs text-ict-ink-400">{copy.formulaNote}</p>

      <p className="mt-3 flex items-start gap-2 rounded-ict-md p-3 text-sm" style={{ background: tone.soft }}>
        <span className="mt-0.5 shrink-0" style={{ color: tone.ink }}>
          <Icon name="info" className="!text-base" />
        </span>
        <span className="text-ict-ink-500">{algorithm.tradeoff}</span>
      </p>

      <details className="mt-3 rounded-ict-md border border-ict-paper-300 bg-ict-paper-0 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-ict-ink-900">
          {copy.statesSummary}
        </summary>
        <ul className="mt-2.5 space-y-2">
          {states.map((state) => (
            <li key={state.key} className="text-sm">
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold"
                style={{ background: tone.soft, color: tone.ink }}
              >
                {state.label}
              </span>
              <span className="mt-1 block text-ict-ink-500">{state.description}</span>
              <span className="mt-0.5 block text-xs text-ict-ink-400">{state.exits}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
