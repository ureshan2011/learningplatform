"use client";

import { useMemo, useRef, useState } from "react";
import {
  evaluateSheet,
  SPREADSHEET_COLS,
  SPREADSHEET_ROWS,
  SPREADSHEET_EXAMPLE,
  type CellResult,
} from "@/lib/lab/spreadsheet";

function displayValue(result: CellResult | undefined): string {
  if (result === undefined || result === "") return "";
  if (typeof result === "object") return result.error;
  if (typeof result === "boolean") return result ? "TRUE" : "FALSE";
  return String(result);
}

export function SpreadsheetSandbox() {
  const [cells, setCells] = useState<Record<string, string>>(SPREADSHEET_EXAMPLE);
  const [active, setActive] = useState("B6");
  const formulaRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => evaluateSheet(cells), [cells]);

  function selectCell(id: string) {
    setActive(id);
    requestAnimationFrame(() => formulaRef.current?.focus());
  }

  function reset() {
    setCells(SPREADSHEET_EXAMPLE);
    setActive("B6");
  }

  return (
    <div>
      <p className="text-sm text-(--color-awaken-ink-soft)">
        Click a cell, then type a value or a formula — =SUM(B2:B4), =AVERAGE(...), =IF(...) —
        into the formula bar and press Enter.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span className="w-14 shrink-0 rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) px-2 py-1.5 text-center font-mono text-xs">
          {active}
        </span>
        <input
          ref={formulaRef}
          value={cells[active] ?? ""}
          onChange={(e) => setCells((c) => ({ ...c, [active]: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") formulaRef.current?.blur();
          }}
          placeholder="=SUM(B2:B4)"
          className="flex-1 rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-1.5 font-mono text-sm outline-none focus:border-(--color-awaken-accent)"
        />
        <button onClick={reset} className="shrink-0 rounded-lg border border-(--color-awaken-line) px-3 py-1.5 text-xs">
          Reset
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-(--color-awaken-line)">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-10 border border-(--color-awaken-line) bg-(--color-awaken-bg)" />
              {SPREADSHEET_COLS.map((col) => (
                <th
                  key={col}
                  className="border border-(--color-awaken-line) bg-(--color-awaken-bg) px-2 py-1 text-xs font-medium text-(--color-awaken-ink-soft)"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SPREADSHEET_ROWS }, (_, i) => i + 1).map((row) => (
              <tr key={row}>
                <td className="border border-(--color-awaken-line) bg-(--color-awaken-bg) px-2 text-center text-xs text-(--color-awaken-ink-soft)">
                  {row}
                </td>
                {SPREADSHEET_COLS.map((col) => {
                  const id = `${col}${row}`;
                  const result = results[id];
                  const isError = typeof result === "object";
                  return (
                    <td
                      key={id}
                      onClick={() => selectCell(id)}
                      className={`min-w-[92px] cursor-pointer border border-(--color-awaken-line) px-2 py-1.5 ${
                        active === id
                          ? "outline outline-1 outline-(--color-awaken-accent) bg-(--color-awaken-accent-soft)"
                          : "hover:bg-(--color-awaken-card)"
                      } ${isError ? "text-(--color-awaken-danger)" : ""}`}
                    >
                      {displayValue(result)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
