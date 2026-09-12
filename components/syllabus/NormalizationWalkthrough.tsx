"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ToneColors } from "@/lib/content/unit-visuals";
import { NORMAL_FORM_STAGES, type NormalTable } from "@/lib/content/normalization";

/**
 * One table taken from unnormalised to 3NF, a stage at a time.
 *
 * Competency level 8.7 is examined as a process, not an outcome: the marks are
 * for the intermediate forms and for naming the dependency removed at each
 * step. A student who writes only the final four tables scores a fraction of
 * the question.
 *
 * The columns that force the next split are highlighted at every stage, so
 * "partial dependency" stops being a phrase to recite and becomes a column to
 * point at. The anomalies are shown beside them because that is the other half
 * of the question, and the two are the same fact told twice — the dependency
 * is why the anomaly happens.
 */
export function NormalizationWalkthrough({ tone }: { tone: ToneColors }) {
  const [index, setIndex] = useState(0);
  const stage = NORMAL_FORM_STAGES[index];
  const isLast = index === NORMAL_FORM_STAGES.length - 1;

  return (
    <div className="rounded-ict-card border border-ict-paper-300 bg-ict-paper-50 p-4">
      <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">
        Try it — take one table from unnormalised to 3NF
      </p>
      <p className="mt-1.5 text-sm text-ict-ink-500">
        The same student results table at every stage. At each step, the highlighted columns are the
        ones that break the next rule.
      </p>

      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Normal form">
        {NORMAL_FORM_STAGES.map((s, i) => {
          const isActive = i === index;
          const isDone = i < index;
          return (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setIndex(i)}
              className="ict-press flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors duration-[120ms] ease-ict"
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
              {isDone ? <Icon name="check_circle" className="!text-base text-ict-green-500" /> : null}
              {s.label}
            </button>
          );
        })}
      </div>

      <div key={stage.key} className="ict-step-enter mt-4">
        <h3 className="m-0 font-display text-base font-bold text-ict-ink-900">{stage.title}</h3>
        <p className="mt-1 text-sm text-ict-ink-500">{stage.change}</p>

        <p
          className="mt-2.5 rounded-ict-md p-3 text-sm font-semibold"
          style={{ background: tone.soft, color: tone.ink }}
        >
          {stage.rule}
        </p>

        <div className="mt-3 space-y-3">
          {stage.tables.map((table) => (
            <TableView key={table.name} table={table} tone={tone} />
          ))}
        </div>

        {stage.problem ? (
          <div className="mt-3 rounded-ict-md border border-ict-paper-300 bg-ict-paper-0 p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-ict-ink-400 uppercase">
              <span aria-hidden className="size-1.5 rounded-full bg-ict-amber-500" />
              Still wrong
            </p>
            <p className="mt-1.5 text-sm text-ict-ink-500">{stage.problem}</p>
            {stage.dependency ? (
              <p className="mt-2 font-mono text-xs break-words" style={{ color: tone.ink }}>
                {stage.dependency}
              </p>
            ) : null}

            <p className="mt-3 text-xs font-bold tracking-wide text-ict-ink-400 uppercase">
              Anomalies this causes
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {stage.anomalies.map((anomaly) => (
                <li key={anomaly.kind} className="flex items-start gap-2 text-sm text-ict-ink-500">
                  <span
                    className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ background: tone.soft, color: tone.ink }}
                  >
                    {anomaly.kind}
                  </span>
                  <span>{anomaly.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 flex items-start gap-2 rounded-ict-md border border-ict-green-500/30 bg-ict-green-50 p-3 text-sm text-ict-ink-500">
            <Icon name="check_circle" className="mt-0.5 !text-base shrink-0 text-ict-green-500" />
            <span>
              In 3NF. Every fact is stored once: a class is renamed in one row, a subject in one
              row, and a student with no results yet can still exist. For A/L ICT, 3NF is where the
              question stops.
            </span>
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="ict-press flex items-center gap-1.5 rounded-full border border-ict-paper-300 bg-ict-paper-0 px-3.5 py-2 text-sm font-semibold text-ict-ink-500 transition-colors duration-[120ms] ease-ict disabled:opacity-40"
        >
          <Icon name="chevron_left" className="!text-base" />
          Back
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(NORMAL_FORM_STAGES.length - 1, i + 1))}
          disabled={isLast}
          className="ict-press flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors duration-[120ms] ease-ict disabled:opacity-40"
          style={{ background: tone.gradTo }}
        >
          {isLast ? "Done" : `Fix it — go to ${NORMAL_FORM_STAGES[index + 1].label}`}
          <Icon name="chevron_right" className="!text-base" />
        </button>
      </div>
    </div>
  );
}

function TableView({ table, tone }: { table: NormalTable; tone: ToneColors }) {
  return (
    <div className="rounded-ict-md border border-ict-paper-300 bg-ict-paper-0 p-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-mono text-sm font-extrabold text-ict-ink-900">{table.name}</p>
        <p className="text-xs text-ict-ink-400">{table.keyNote}</p>
      </div>

      {/* A wide table is the one thing allowed its own horizontal scroll. */}
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-left">
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th
                  key={column.name}
                  scope="col"
                  className="border-b border-ict-paper-300 px-2.5 py-1.5 text-xs font-bold whitespace-nowrap"
                  style={{
                    background: column.offending ? tone.soft : undefined,
                    color: column.offending ? tone.ink : "var(--color-ict-ink-500)",
                  }}
                >
                  <span className={column.isKey ? "underline underline-offset-4" : undefined}>
                    {column.name}
                  </span>
                  {column.isForeign ? (
                    <span className="ml-1 text-[10px] font-semibold text-ict-ink-300">FK</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className="border-b border-ict-paper-200 px-2.5 py-1.5 align-top font-mono text-xs whitespace-nowrap text-ict-ink-900"
                    style={{ background: table.columns[c]?.offending ? tone.soft : undefined }}
                  >
                    {cell.split("\n").map((line, i) => (
                      <span key={i} className="block">
                        {line}
                      </span>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
