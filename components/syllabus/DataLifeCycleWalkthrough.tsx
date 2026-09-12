"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ToneColors } from "@/lib/content/unit-visuals";
import type { LifeCycleStage } from "@/lib/content/data-life-cycle";

/** Everything this interactive says, resolved to one language on the server. */
export interface DataLifeCycleCopy {
  heading: string;
  stageLabel: string;
}

/**
 * A three-stage walkthrough for the data life cycle, embedded in a lesson's
 * notes. Clicking a stage swaps in what happens to one running example at
 * that stage — the exam-objective list turned into something a student
 * actually moves through, rather than three bullet points to memorise.
 */
export function DataLifeCycleWalkthrough({
  tone,
  stages,
  copy,
}: {
  tone: ToneColors;
  stages: LifeCycleStage[];
  copy: DataLifeCycleCopy;
}) {
  const [activeKey, setActiveKey] = useState<string>(stages[0].key);
  const active = stages.find((s) => s.key === activeKey) ?? stages[0];

  return (
    <div className="rounded-ict-card border border-ict-paper-300 bg-ict-paper-50 p-4">
      <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">
        {copy.heading}
      </p>

      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label={copy.stageLabel}>
        {stages.map((stage, i) => {
          const isActive = stage.key === activeKey;
          return (
            <button
              key={stage.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveKey(stage.key)}
              className="ict-press flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors duration-[120ms] ease-ict"
              style={
                isActive
                  ? { background: tone.gradTo, borderColor: tone.gradTo, color: "#fff" }
                  : { background: "#fff", borderColor: "var(--color-ict-paper-300)", color: "var(--color-ict-ink-500)" }
              }
            >
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
                style={isActive ? { background: "rgba(255,255,255,0.28)" } : { background: tone.soft, color: tone.ink }}
              >
                {i + 1}
              </span>
              <Icon name={stage.icon} className="!text-base" />
              {stage.label}
            </button>
          );
        })}
      </div>

      <div
        key={active.key}
        className="ict-step-enter mt-4 rounded-ict-md p-4"
        style={{ background: tone.soft }}
        role="tabpanel"
      >
        <p className="text-sm font-semibold" style={{ color: tone.ink }}>
          {active.summary}
        </p>
        <p className="mt-2 text-sm text-ict-ink-500">{active.example}</p>
      </div>
    </div>
  );
}
