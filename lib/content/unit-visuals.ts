import type { IconName } from "@/components/ui/Icon";

/**
 * Purely presentational: which icon and colour represents each syllabus unit,
 * so the syllabus explorer reads as a set of distinct topics at a glance
 * instead of 14 identical grey cards. Keyed by competency number so it stays
 * correct even if unit ids change.
 *
 * Colours are plain hex rather than Tailwind classes because the explorer
 * builds gradients, glows and progress fills from them at runtime — a
 * dynamically assembled class name would never survive Tailwind's compile-time
 * scan, whereas an inline `style` always works.
 */
export type AccentTone = "ember" | "rose" | "violet" | "azure" | "emerald" | "amber";

const TONE_CYCLE: AccentTone[] = ["ember", "rose", "violet", "azure", "emerald", "amber"];

const UNIT_ICON: Record<number, IconName> = {
  1: "insights",
  2: "computer",
  3: "memory",
  4: "bolt",
  5: "settings",
  6: "hub",
  7: "account_tree",
  8: "storage",
  9: "terminal",
  10: "language",
  11: "sensors",
  12: "storefront",
  13: "auto_awesome",
  14: "assignment",
};

export function unitIcon(competencyNumber: number): IconName {
  return UNIT_ICON[competencyNumber] ?? "auto_stories";
}

export function unitTone(competencyNumber: number): AccentTone {
  return TONE_CYCLE[(competencyNumber - 1) % TONE_CYCLE.length];
}

export interface ToneColors {
  /** Text and icon colour on a light surface. Every value here clears 4.5:1 on white. */
  ink: string;
  /** Tinted surface for chips and expanded panels. */
  soft: string;
  /** Border tint — strong enough to read, light enough not to shout. */
  line: string;
  gradFrom: string;
  gradTo: string;
  /** "r, g, b" so callers can compose their own rgba() shadows and rings. */
  rgb: string;
}

export const TONE: Record<AccentTone, ToneColors> = {
  ember: { ink: "#c2410c", soft: "#fff2e9", line: "#fdba74", gradFrom: "#fb923c", gradTo: "#c2410c", rgb: "234, 88, 12" },
  rose: { ink: "#be185d", soft: "#fdf2f8", line: "#f9a8d4", gradFrom: "#f472b6", gradTo: "#be185d", rgb: "225, 29, 143" },
  violet: { ink: "#6d28d9", soft: "#f5f3ff", line: "#c4b5fd", gradFrom: "#a78bfa", gradTo: "#6d28d9", rgb: "109, 40, 217" },
  azure: { ink: "#0369a1", soft: "#eff8ff", line: "#7dd3fc", gradFrom: "#38bdf8", gradTo: "#0369a1", rgb: "3, 105, 161" },
  emerald: { ink: "#047857", soft: "#ecfdf5", line: "#6ee7b7", gradFrom: "#34d399", gradTo: "#047857", rgb: "4, 120, 87" },
  amber: { ink: "#a16207", soft: "#fffbeb", line: "#fcd34d", gradFrom: "#fbbf24", gradTo: "#a16207", rgb: "161, 98, 7" },
};

/** Shorthand for the common case: the colours for a unit, from its competency number. */
export function unitColors(competencyNumber: number): ToneColors {
  return TONE[unitTone(competencyNumber)];
}

/** Units carrying 50+ periods — the syllabus's own weighting flags these as where most marks concentrate. */
export function isHighYield(periods: number): boolean {
  return periods >= 50;
}
