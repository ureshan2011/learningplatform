"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { interpolate } from "@/lib/i18n/dictionary";
import type { ToneColors } from "@/lib/content/unit-visuals";
import {
  GRAY,
  canonicalExpression,
  cellMinterm,
  covers,
  mintermsOf,
  simplify,
  termOf,
  type KarnaughPreset,
} from "@/lib/content/karnaugh";

type CellValue = 0 | 1 | "X";

/** Everything this interactive says, resolved to one language on the server. */
export interface KarnaughCopy {
  heading: string;
  intro: string;
  clear: string;
  axisCaption: string;
  axisHeader: string;
  /** "{minterm}" and "{value}" are interpolated. */
  cellLabel: string;
  dontCareValue: string;
  beforeTitle: string;
  /** "{count}" interpolated; the one/many split is English's, not every language's. */
  mintermCountOne: string;
  mintermCountMany: string;
  dontCareCount: string;
  simplifiedTitle: string;
  nothingYet: string;
  /** "{groups}" and "{essential}" interpolated. */
  groupSummaryOne: string;
  groupSummaryOneForced: string;
  groupSummaryMany: string;
  groupSummaryAll: string;
  /** "{minterms}" and "{size}" interpolated. */
  groupCovers: string;
  forced: string;
  footnote: string;
}

/** Row and column headers in Gray code — the ordering the whole method depends on. */
const GRAY_LABELS = GRAY.map((v) => v.toString(2).padStart(2, "0"));

/**
 * A four-variable Karnaugh map a student can actually fill in.
 *
 * Competency level 4.2 carries eight periods and a standing Paper II question,
 * and the marks are lost at the grouping step rather than the algebra. The two
 * mistakes are always the same: missing that the edges wrap, and stopping at
 * the first set of groups that happens to cover the map rather than the
 * smallest set. Both are invisible on paper until the marking scheme arrives.
 *
 * So this shows the grouping. Click a cell to cycle 0 → 1 → X, and the minimal
 * sum-of-products is recomputed with it, with every group outlined on the map
 * and named underneath. The groups come from `lib/content/karnaugh.ts`, which
 * is checked against all 65,536 four-variable functions for both correctness
 * and minimality — a teaching tool that quietly hands out a non-minimal answer
 * is worse than no tool.
 */
export function KarnaughMapLab({
  tone,
  presets,
  copy,
}: {
  tone: ToneColors;
  presets: KarnaughPreset[];
  copy: KarnaughCopy;
}) {
  const [values, setValues] = useState<CellValue[]>(() => fromPreset(presets, 0));
  const [presetId, setPresetId] = useState<string>(presets[0].id);
  const [hoveredGroup, setHoveredGroup] = useState<number | null>(null);

  const ones = useMemo(() => values.flatMap((v, m) => (v === 1 ? [m] : [])), [values]);
  const dontCares = useMemo(() => values.flatMap((v, m) => (v === "X" ? [m] : [])), [values]);
  const result = useMemo(() => simplify(ones, dontCares), [ones, dontCares]);

  const preset = presets.find((p) => p.id === presetId);

  function cycle(minterm: number) {
    setValues((prev) => {
      const next = [...prev];
      next[minterm] = prev[minterm] === 0 ? 1 : prev[minterm] === 1 ? "X" : 0;
      return next;
    });
    setPresetId("");
  }

  function loadPreset(id: string) {
    const index = presets.findIndex((p) => p.id === id);
    if (index < 0) return;
    setValues(fromPreset(presets, index));
    setPresetId(id);
    setHoveredGroup(null);
  }

  return (
    <div className="rounded-ict-card border border-ict-paper-300 bg-ict-paper-50 p-4">
      <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">
        {copy.heading}
      </p>
      <p className="mt-1.5 text-sm text-ict-ink-500">{copy.intro}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => loadPreset(p.id)}
            className="ict-press rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-[120ms] ease-ict"
            style={
              p.id === presetId
                ? { background: tone.gradTo, borderColor: tone.gradTo, color: "#fff" }
                : {
                    background: "#fff",
                    borderColor: "var(--color-ict-paper-300)",
                    color: "var(--color-ict-ink-500)",
                  }
            }
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setValues(new Array(16).fill(0) as CellValue[]);
            setPresetId("");
          }}
          className="ict-press rounded-full px-3 py-1.5 text-xs font-semibold text-ict-ink-400 underline underline-offset-4"
        >
          {copy.clear}
        </button>
      </div>

      {preset ? (
        <p key={preset.id} className="ict-step-enter mt-2.5 text-sm text-ict-ink-500">
          {preset.description}
        </p>
      ) : null}

      {/* The map. Wrapped for overflow because four columns plus headers is wide on a phone. */}
      <div className="mt-4 overflow-x-auto">
        <table className="border-separate border-spacing-1">
          <caption className="caption-top pb-2 text-left text-xs font-semibold text-ict-ink-400">
            {copy.axisCaption}
          </caption>
          <thead>
            <tr>
              <th className="px-2 py-1 text-xs font-bold text-ict-ink-400">{copy.axisHeader}</th>
              {GRAY_LABELS.map((label) => (
                <th key={label} className="w-14 px-1 py-1 font-mono text-xs font-bold text-ict-ink-400">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRAY_LABELS.map((rowLabel, row) => (
              <tr key={rowLabel}>
                <th className="px-2 py-1 text-right font-mono text-xs font-bold text-ict-ink-400">
                  {rowLabel}
                </th>
                {GRAY_LABELS.map((colLabel, col) => {
                  const minterm = cellMinterm(row, col);
                  const value = values[minterm];
                  const inHovered =
                    hoveredGroup !== null && covers(result.groups[hoveredGroup], minterm);
                  const groupCount = result.groups.filter((g) => covers(g, minterm)).length;
                  const isGrouped = value !== 0 && groupCount > 0;

                  return (
                    <td key={colLabel} className="p-0">
                      <button
                        type="button"
                        onClick={() => cycle(minterm)}
                        aria-label={interpolate(copy.cellLabel, {
                          minterm,
                          value: value === "X" ? copy.dontCareValue : String(value),
                        })}
                        className="ict-press flex size-14 flex-col items-center justify-center rounded-xl border-2 font-mono text-lg font-bold transition-all duration-200 ease-ict"
                        style={{
                          background: inHovered
                            ? tone.soft
                            : isGrouped
                              ? "#fff"
                              : "var(--color-ict-paper-100)",
                          borderColor: isGrouped || inHovered ? tone.line : "var(--color-ict-paper-300)",
                          color:
                            value === 0
                              ? "var(--color-ict-ink-300)"
                              : isGrouped
                                ? tone.ink
                                : "var(--color-ict-ink-900)",
                          transform: inHovered ? "translateY(-2px)" : undefined,
                        }}
                      >
                        <span>{value === "X" ? "X" : value}</span>
                        <span className="text-[10px] font-semibold text-ict-ink-300">m{minterm}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-ict-md border border-ict-paper-300 bg-ict-paper-0 p-3">
          <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">
            {copy.beforeTitle}
          </p>
          <p className="mt-1.5 font-mono text-sm break-words text-ict-ink-500">
            {ones.length === 0 ? "0" : `F = ${canonicalExpression(ones)}`}
          </p>
          <p className="mt-1.5 text-xs text-ict-ink-400">
            {interpolate(ones.length === 1 ? copy.mintermCountOne : copy.mintermCountMany, {
              count: ones.length,
            })}
            {dontCares.length > 0
              ? interpolate(copy.dontCareCount, { count: dontCares.length })
              : ""}
          </p>
        </div>

        <div className="rounded-ict-md p-3" style={{ background: tone.soft }}>
          <p className="text-xs font-bold tracking-wide uppercase" style={{ color: tone.ink }}>
            {copy.simplifiedTitle}
          </p>
          <p className="mt-1.5 font-mono text-base font-bold break-words" style={{ color: tone.ink }}>
            F = {result.expression}
          </p>
          <p className="mt-1.5 text-xs text-ict-ink-500">
            {result.groups.length === 0 ? copy.nothingYet : groupSummary(copy, result)}
          </p>
        </div>
      </div>

      {result.groups.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {result.groups.map((group, i) => {
            const size = mintermsOf(group).filter((m) => values[m] !== 0).length;
            const isEssential = result.essential.includes(group);
            return (
              <li key={group}>
                <button
                  type="button"
                  onMouseEnter={() => setHoveredGroup(i)}
                  onMouseLeave={() => setHoveredGroup(null)}
                  onFocus={() => setHoveredGroup(i)}
                  onBlur={() => setHoveredGroup(null)}
                  className="flex w-full items-center gap-2 rounded-xl border border-ict-paper-300 bg-ict-paper-0 px-3 py-2 text-left transition-colors duration-[120ms] ease-ict"
                >
                  <code className="font-mono text-sm font-bold" style={{ color: tone.ink }}>
                    {termOf(group)}
                  </code>
                  <span className="text-xs text-ict-ink-400">
                    {interpolate(copy.groupCovers, {
                      minterms: mintermsOf(group).join(", m"),
                      size,
                    })}
                  </span>
                  {isEssential ? (
                    <span
                      className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{ background: tone.soft, color: tone.ink }}
                    >
                      {copy.forced}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <p className="mt-3 flex items-start gap-2 text-xs text-ict-ink-400">
        <Icon name="info" className="mt-0.5 !text-sm shrink-0" />
        <span>{copy.footnote}</span>
      </p>
    </div>
  );
}

/**
 * How many groups, and how many of them were forced.
 *
 * Four separate strings rather than one with a plural rule inside it: English
 * needs "one group" and "2 groups", Sinhala does not inflect the same way, and
 * a translator is far better served by four whole sentences than by a template
 * with a conditional buried in it.
 */
function groupSummary(copy: KarnaughCopy, result: { groups: unknown[]; essential: unknown[] }): string {
  const groups = result.groups.length;
  const essential = result.essential.length;
  if (groups === 1) return essential === 1 ? copy.groupSummaryOneForced : copy.groupSummaryOne;
  if (essential === groups) return interpolate(copy.groupSummaryAll, { groups });
  return interpolate(copy.groupSummaryMany, { groups, essential });
}

function fromPreset(presets: KarnaughPreset[], index: number): CellValue[] {
  const preset = presets[index];
  const values = new Array(16).fill(0) as CellValue[];
  for (const m of preset.ones) values[m] = 1;
  for (const m of preset.dontCares) values[m] = "X";
  return values;
}
