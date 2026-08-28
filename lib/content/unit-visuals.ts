import type { IconName } from "@/components/ui/Icon";

/**
 * Purely presentational: which icon and accent tone represents each syllabus
 * unit, so the syllabus explorer reads as a set of distinct topics at a
 * glance instead of 14 identical grey cards. Keyed by competency number so it
 * stays correct even if unit ids change.
 */
export type AccentTone = "accent" | "indigo" | "success" | "warn" | "danger";

const TONE_CYCLE: AccentTone[] = ["accent", "indigo", "success", "warn", "danger"];

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

/** Tailwind class pairs for each tone — soft background + solid foreground, matching the app's existing badge convention. */
export const TONE_CLASSES: Record<AccentTone, { bg: string; fg: string; border: string }> = {
  accent: { bg: "bg-(--color-awaken-accent-soft)", fg: "text-(--color-awaken-accent)", border: "border-(--color-awaken-accent)/25" },
  indigo: { bg: "bg-(--color-awaken-indigo-soft)", fg: "text-(--color-awaken-indigo)", border: "border-(--color-awaken-indigo)/25" },
  success: { bg: "bg-(--color-awaken-success-soft)", fg: "text-(--color-awaken-success)", border: "border-(--color-awaken-success)/25" },
  warn: { bg: "bg-(--color-awaken-warn-soft)", fg: "text-(--color-awaken-warn)", border: "border-(--color-awaken-warn)/25" },
  danger: { bg: "bg-(--color-awaken-danger-soft)", fg: "text-(--color-awaken-danger)", border: "border-(--color-awaken-danger)/25" },
};

/** Units carrying 50+ periods — the syllabus's own weighting flags these as where most marks concentrate. */
export function isHighYield(periods: number): boolean {
  return periods >= 50;
}
