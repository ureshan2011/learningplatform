"use client";

import { useState } from "react";
import { PseudocodeRunner } from "@/components/lab/PseudocodeRunner";
import { SpreadsheetSandbox } from "@/components/lab/SpreadsheetSandbox";
import { SqlSandbox } from "@/components/lab/SqlSandbox";

const TABS = [
  { id: "pseudocode", label: "Pseudocode", Component: PseudocodeRunner },
  { id: "spreadsheet", label: "Spreadsheet", Component: SpreadsheetSandbox },
  { id: "sql", label: "SQL", Component: SqlSandbox },
] as const;

/**
 * Three real, hands-on practice tools most Sri Lankan ICT tuition classes only
 * ever teach as theory. Every tool runs entirely client-side (see lib/lab/) —
 * no server cost, no matter how many students use it at once.
 */
export function CodeLab() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("pseudocode");
  const Active = TABS.find((t) => t.id === tab)!.Component;

  return (
    <div>
      <div className="flex gap-1 border-b border-(--color-awaken-line)">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-(--color-awaken-accent) text-(--color-awaken-accent)"
                : "text-(--color-awaken-ink-soft) hover:text-(--color-awaken-ink)"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-5">
        <Active />
      </div>
    </div>
  );
}
