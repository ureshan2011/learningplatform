"use client";

import { useState } from "react";
import { PseudocodeRunner } from "@/components/lab/PseudocodeRunner";
import { SpreadsheetSandbox } from "@/components/lab/SpreadsheetSandbox";
import { SqlSandbox } from "@/components/lab/SqlSandbox";
import { Card } from "@/components/ds";

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
      <div className="inline-flex items-center gap-1 rounded-full bg-ict-ink-850 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-sm font-semibold transition-colors duration-[120ms] ease-ict ${
              tab === t.id
                ? "bg-ict-orange-500 text-white"
                : "text-ict-ink-300 hover:bg-ict-ink-800 hover:text-ict-paper-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Card radius="panel" className="mt-3 p-5 sm:p-6">
        <Active />
      </Card>
    </div>
  );
}
