"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { ToneColors } from "@/lib/content/unit-visuals";

interface Stage {
  key: string;
  label: string;
  icon: IconName;
  summary: string;
  example: string;
}

/**
 * The three stages straight from the exam objective ("list the stages of the
 * data life cycle: creation, management, removal of obsolete data"), each
 * paired with one running example — a mock exam attempt on this platform —
 * so a student sees the same record move through all three stages instead of
 * memorising three unconnected definitions.
 */
const STAGES: Stage[] = [
  {
    key: "create",
    label: "Creation",
    icon: "edit_note",
    summary: "Data is generated the instant an event happens — typed in, sensed, scanned or submitted.",
    example:
      "A student taps \"Submit\" on a mock exam. That instant, a new record is created: their answers, the time taken, the raw score.",
  },
  {
    key: "manage",
    label: "Management",
    icon: "storage",
    summary: "Data is stored, backed up, organised, and processed into information people actually use.",
    example:
      "That record is stored and backed up, then processed — averaged into a class ranking, compared against last month's attempt, shown on a leaderboard.",
  },
  {
    key: "remove",
    label: "Removal of obsolete data",
    icon: "cancel",
    summary: "Data that is no longer accurate, needed, or legally required to keep is deleted or archived.",
    example:
      "Years later, a graduated student asks for their account to be deleted. Keeping the attempt forever would serve no one, and data-protection law says it shouldn't be kept.",
  },
];

/**
 * A three-stage walkthrough for the data life cycle, embedded in a lesson's
 * notes. Clicking a stage swaps in what happens to one running example at
 * that stage — the exam-objective list turned into something a student
 * actually moves through, rather than three bullet points to memorise.
 */
export function DataLifeCycleWalkthrough({ tone }: { tone: ToneColors }) {
  const [activeKey, setActiveKey] = useState<string>(STAGES[0].key);
  const activeIndex = STAGES.findIndex((s) => s.key === activeKey);
  const active = STAGES[activeIndex];

  return (
    <div className="rounded-ict-card border border-ict-paper-300 bg-ict-paper-50 p-4">
      <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">
        Try it — follow one record through the life cycle
      </p>

      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Data life cycle stage">
        {STAGES.map((stage, i) => {
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
