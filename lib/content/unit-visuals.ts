import type { IconName } from "@/components/ui/Icon";

/**
 * Purely presentational: how a syllabus unit is drawn, so fourteen units read
 * as distinct topics at a glance instead of fourteen identical grey cards.
 * Keyed by competency number so it stays correct even if unit ids change.
 *
 * ## What changed, and why
 *
 * This used to be a six-colour wheel — ember, rose, violet, azure, emerald,
 * amber — cycled across the units, each tone carrying a two-stop gradient used
 * as a large fill: the rule down the side of a unit card, the icon tile, the
 * selected step of every interactive lab. It broke three of the design
 * system's rules at once (CLAUDE.md, "Design system"): no gradient fills,
 * orange is the only accent, semantic colour is a 6px dot and never a large
 * fill. It was also the single biggest reason the syllabus read as a different
 * product from the rest of the site.
 *
 * So the wheel is gone. **The icon is what distinguishes a unit**, which was
 * always the part doing the real work — you recognise `storage` for databases
 * and `terminal` for programming far faster than you recognise "the violet
 * one". Colour is the system's one orange, and a unit card is its own region
 * of the screen, so one orange thing per card is exactly the ration.
 *
 * ## Why these are CSS variables and not Tailwind classes
 *
 * The labs compose these into inline `style` — a dynamically assembled class
 * name would never survive Tailwind's compile-time scan. They were plain hex;
 * they are `var(--color-ict-…)` now, which costs nothing in an inline style
 * and buys the thing hex could never do: they resolve against the surrounding
 * world. The same unit card is near-black inside `.ict-app` and white on the
 * public syllabus page, from one component.
 */

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

export interface ToneColors {
  /** Body text — on `soft`, on a card, anywhere it has to be read. */
  ink: string;
  /** A neutral well: a chip, an expanded panel, a highlighted table cell. */
  soft: string;
  /** A border meant to be read as an edge — an open accordion, a selection. */
  line: string;
  /** The single flat accent. Replaced a `gradFrom`/`gradTo` pair. */
  accent: string;
  /** Orange as *text*, which needs a darker step than orange as a fill. */
  accentFg: string;
}

/**
 * One tone, for every unit.
 *
 * Kept as an object rather than inlined at the call sites because the labs
 * take it as a prop, and a single seam is what makes the next change to it
 * one edit rather than ninety.
 */
export const UNIT_TONE: ToneColors = {
  ink: "var(--color-ict-fg)",
  soft: "var(--color-ict-surface-sunken)",
  line: "var(--color-ict-line-strong)",
  accent: "var(--color-ict-orange-500)",
  accentFg: "var(--color-ict-accent-fg)",
};

/** Units carrying 50+ periods — the syllabus's own weighting flags these as where most marks concentrate. */
export function isHighYield(periods: number): boolean {
  return periods >= 50;
}
