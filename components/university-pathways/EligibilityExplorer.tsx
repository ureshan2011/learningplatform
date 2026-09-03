"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/analytics";
import { DEGREE_PROGRAMS, type EligibilityFlags } from "@/lib/content/university-pathways";

const SCALE_MAX = 2.6;

const TOGGLES: Array<{ key: keyof EligibilityFlags; label: string; hint: string }> = [
  {
    key: "technologyStream",
    label: "Technology stream (Science for Technology + ET/BST)",
    hint: "You took ICT as the third Technology-stream subject.",
  },
  {
    key: "ictCredit",
    label: "Credit (C) pass in ICT",
    hint: "Any stream — a Credit in ICT specifically, not just an 'S' pass.",
  },
  {
    key: "mathsOrPhysicsCredit",
    label: "Credit (C) in Combined/Higher Maths or Physics",
    hint: "The anchor subject most Computer Science degrees actually require.",
  },
  {
    key: "physicalScienceWithICT",
    label: "Physical Science stream, ICT as the third subject",
    hint: "Combined/Higher Maths + Chemistry or Physics + ICT.",
  },
];

function ZRangeBar({ zMin, zMax }: { zMin: number; zMax: number }) {
  if (zMin === 0 && zMax === 0) return null;
  const left = Math.max(0, (zMin / SCALE_MAX) * 100);
  const width = Math.max(1.5, ((zMax - zMin) / SCALE_MAX) * 100);
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-(--lp-paper-200)">
      <div
        className="absolute inset-y-0 rounded-full bg-(--lp-orange-500)"
        style={{ left: `${left}%`, width: `${width}%` }}
      />
    </div>
  );
}

export function EligibilityExplorer() {
  const [flags, setFlags] = useState<EligibilityFlags>({
    technologyStream: false,
    ictCredit: false,
    mathsOrPhysicsCredit: false,
    physicalScienceWithICT: false,
  });
  const anySelected = Object.values(flags).some(Boolean);

  const ranked = useMemo(() => {
    return DEGREE_PROGRAMS.map((p) => ({ program: p, eligible: p.matches(flags) })).sort(
      (a, b) => Number(b.eligible) - Number(a.eligible),
    );
  }, [flags]);

  function toggle(key: keyof EligibilityFlags) {
    setFlags((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      track("university_pathway_toggle", { key, value: next[key] });
      return next;
    });
  }

  return (
    <div>
      <div className="lp-reveal rounded-[var(--lp-radius-panel)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-[clamp(20px,3vw,32px)] shadow-[var(--lp-shadow-sm)]">
        <div className="text-[13px] font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">
          What did you actually study?
        </div>
        <p className="mt-1.5 text-sm text-(--lp-ink-400)">
          Tick what applies — the degrees below re-sort to what you&apos;re eligible for.
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {TOGGLES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => toggle(t.key)}
              aria-pressed={flags[t.key]}
              className={`flex items-start gap-2.5 rounded-[var(--lp-radius-md)] border p-3.5 text-left transition-colors ${
                flags[t.key]
                  ? "border-(--lp-orange-500) bg-(--lp-orange-50)"
                  : "border-(--lp-border-subtle) bg-(--lp-paper-0) hover:border-(--lp-ink-300)"
              }`}
            >
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                  flags[t.key] ? "border-(--lp-orange-500) bg-(--lp-orange-500) text-white" : "border-(--lp-ink-200)"
                }`}
              >
                {flags[t.key] ? <Icon name="check_circle" className="!text-sm" /> : null}
              </span>
              <span>
                <span className="block text-sm font-semibold text-(--lp-ink-900)">{t.label}</span>
                <span className="mt-0.5 block text-xs text-(--lp-ink-400)">{t.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {ranked.map(({ program, eligible }) => (
          <div
            key={program.id}
            className={`lp-reveal rounded-[var(--lp-radius-card)] border p-[clamp(18px,2.4vw,26px)] transition-opacity ${
              anySelected && !eligible
                ? "border-(--lp-border-subtle) bg-(--lp-paper-100) opacity-60"
                : "border-(--lp-border-subtle) bg-(--lp-paper-0) shadow-[var(--lp-shadow-sm)]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-(--lp-ink-900)">{program.name}</h3>
              {anySelected ? (
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                    eligible ? "bg-(--lp-green-50) text-(--lp-green-500)" : "bg-(--lp-paper-200) text-(--lp-ink-400)"
                  }`}
                >
                  {eligible ? "Likely eligible" : "Not with this combination"}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm text-(--lp-ink-400)">{program.eligibilitySummary}</p>

            <div className="mt-4 space-y-2.5">
              {program.universities.map((u) => (
                <div key={u.name} className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_140px_90px]">
                  <span className="truncate text-sm text-(--lp-ink-900)">{u.name}</span>
                  <div className="hidden sm:block">
                    <ZRangeBar zMin={u.zMin} zMax={u.zMax} />
                  </div>
                  <span className="text-right font-[family-name:var(--lp-font-mono)] text-xs text-(--lp-ink-400)">
                    {u.zMin === 0 && u.zMax === 0 ? u.note : `${u.zMin.toFixed(2)}–${u.zMax.toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] text-(--lp-ink-300)">Source: {program.sourceRef}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
