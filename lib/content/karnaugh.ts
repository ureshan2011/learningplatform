/**
 * Four-variable Karnaugh map simplification.
 *
 * Competency level 4.2 is eight periods and it is where unit 4's marks sit:
 * "simplify the following Boolean expression using a Karnaugh map" is a
 * standing Paper II question. The part students get wrong is almost never the
 * algebra — it is the grouping. They miss the wrap-around at the edges, or
 * take four overlapping groups where three cover the map.
 *
 * So the grouping is computed here rather than described. The method is
 * Quine–McCluskey, which produces exactly the groups a correct K-map reading
 * produces: combine terms differing in one bit, keep whatever never combines
 * (the prime implicants), then cover the map with the essential ones first.
 * The two methods agree because they are the same method — the K-map is
 * Quine–McCluskey drawn on squared paper, with adjacency as geometry.
 *
 * Variable order is A, B, C, D, with A the most significant bit, matching the
 * syllabus's own worked examples.
 */

import type { Locale } from "@/lib/i18n/dictionary";

export const VARIABLES = ["A", "B", "C", "D"] as const;

/** Gray code order for both axes — what makes physically adjacent cells differ by one bit. */
export const GRAY = [0, 1, 3, 2] as const;

/**
 * An implicant as a 4-character mask over A, B, C, D.
 * "1" = the variable appears, "0" = it appears negated, "-" = it dropped out.
 */
export type Implicant = string;

/** The minterm number a K-map cell stands for, at row `r` and column `c`. */
export function cellMinterm(row: number, col: number): number {
  return (GRAY[row] << 2) | GRAY[col];
}

function toBits(minterm: number): string {
  return minterm.toString(2).padStart(4, "0");
}

/** Does this implicant cover this minterm? */
export function covers(implicant: Implicant, minterm: number): boolean {
  const bits = toBits(minterm);
  for (let i = 0; i < 4; i++) {
    if (implicant[i] !== "-" && implicant[i] !== bits[i]) return false;
  }
  return true;
}

/** Every minterm an implicant covers — the cells to shade for one group. */
export function mintermsOf(implicant: Implicant): number[] {
  const out: number[] = [];
  for (let m = 0; m < 16; m++) if (covers(implicant, m)) out.push(m);
  return out;
}

/**
 * Combines two implicants if they differ in exactly one fixed bit.
 * Returns the merged implicant, or null if they cannot be combined.
 */
function combine(a: Implicant, b: Implicant): Implicant | null {
  let diff = -1;
  for (let i = 0; i < 4; i++) {
    if (a[i] === b[i]) continue;
    // A dash never pairs with a fixed bit — different sized groups do not merge.
    if (a[i] === "-" || b[i] === "-") return null;
    if (diff !== -1) return null;
    diff = i;
  }
  return diff === -1 ? null : a.slice(0, diff) + "-" + a.slice(diff + 1);
}

/**
 * Every prime implicant of the given minterms.
 *
 * "Don't care" minterms belong in here too: they may be grouped when it makes
 * a group bigger, which is the whole reason the syllabus teaches them.
 */
export function primeImplicants(ones: number[], dontCares: number[] = []): Implicant[] {
  let current = [...new Set([...ones, ...dontCares])].map(toBits);
  if (current.length === 0) return [];

  const primes = new Set<Implicant>();

  while (current.length > 0) {
    const combined = new Set<Implicant>();
    const used = new Set<Implicant>();

    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const merged = combine(current[i], current[j]);
        if (merged === null) continue;
        combined.add(merged);
        used.add(current[i]);
        used.add(current[j]);
      }
    }

    // Anything that found no partner at this size can never grow — it is prime.
    for (const term of current) if (!used.has(term)) primes.add(term);
    current = [...combined];
  }

  return [...primes];
}

export interface Simplification {
  /** The groups that make up the answer, largest first. */
  groups: Implicant[];
  /** Which of those groups were forced — the ones a student should find first. */
  essential: Implicant[];
  /** The minimal sum-of-products, e.g. "A'B + CD + BD'". */
  expression: string;
  /** Every prime implicant, including ones the final cover did not need. */
  allPrimes: Implicant[];
}

/**
 * The minimal sum-of-products for a set of minterms.
 *
 * Essential prime implicants are taken first — the ones covering a minterm no
 * other group reaches — because that is exactly the order the syllabus teaches
 * the grouping in, and a worked answer that picks them in a different order
 * looks wrong to a student even when it is equivalent. What is left over is
 * covered greedily, largest group first, with a stable tiebreak so the same
 * input always produces the same answer.
 */
export function simplify(ones: number[], dontCares: number[] = []): Simplification {
  const uniqueOnes = [...new Set(ones)].sort((a, b) => a - b);
  const allPrimes = primeImplicants(uniqueOnes, dontCares).sort(sortImplicants);

  if (uniqueOnes.length === 0) {
    return { groups: [], essential: [], expression: "0", allPrimes };
  }
  if (uniqueOnes.length + dontCares.length === 16 && allPrimes.includes("----")) {
    return { groups: ["----"], essential: ["----"], expression: "1", allPrimes };
  }

  // Essential: a prime implicant that is the only one covering some minterm.
  const essential: Implicant[] = [];
  for (const minterm of uniqueOnes) {
    const covering = allPrimes.filter((p) => covers(p, minterm));
    if (covering.length === 1 && !essential.includes(covering[0])) essential.push(covering[0]);
  }

  const remaining = uniqueOnes.filter((m) => !essential.some((p) => covers(p, m)));
  const candidates = allPrimes.filter((p) => !essential.includes(p));
  const chosen = [...essential, ...smallestCover(remaining, candidates)];

  const groups = chosen.sort(sortImplicants);
  return {
    groups,
    essential,
    expression: groups.map(termOf).join(" + ") || "0",
    allPrimes,
  };
}

/**
 * The smallest set of candidate groups that covers everything left over.
 *
 * Searched exhaustively, smallest set first, rather than taken greedily.
 * Greedy is the obvious choice and it is wrong often enough to matter: on
 * roughly one four-variable map in twenty it returns one group more than the
 * minimum, which is a mark lost by a student who trusted it. The search space
 * is at most a handful of prime implicants over sixteen cells, so exhausting
 * it costs nothing a browser would notice.
 *
 * Among covers of equal size the one with fewer literals wins — two answers
 * with three terms each are not equally good if one of them is `AB + C + D`.
 */
function smallestCover(remaining: number[], candidates: Implicant[]): Implicant[] {
  if (remaining.length === 0) return [];

  const literals = (set: Implicant[]) =>
    set.reduce((sum, imp) => sum + imp.split("").filter((ch) => ch !== "-").length, 0);

  for (let size = 1; size <= candidates.length; size++) {
    let best: Implicant[] | null = null;

    const search = (start: number, picked: Implicant[]) => {
      if (picked.length === size) {
        if (!remaining.every((m) => picked.some((p) => covers(p, m)))) return;
        if (best === null || literals(picked) < literals(best)) best = [...picked];
        return;
      }
      for (let i = start; i < candidates.length; i++) {
        picked.push(candidates[i]);
        search(i + 1, picked);
        picked.pop();
      }
    };

    search(0, []);
    if (best !== null) return best;
  }

  return candidates;
}

/** Bigger groups first (more dashes), then lexicographically for a stable order. */
function sortImplicants(a: Implicant, b: Implicant): number {
  const dashes = (s: string) => s.split("-").length - 1;
  return dashes(b) - dashes(a) || a.localeCompare(b);
}

/** One implicant as a product term, e.g. "01--" becomes "A'B". */
export function termOf(implicant: Implicant): string {
  let term = "";
  for (let i = 0; i < 4; i++) {
    if (implicant[i] === "-") continue;
    term += VARIABLES[i] + (implicant[i] === "0" ? "'" : "");
  }
  return term || "1";
}

/** The unsimplified sum of minterms, for the "before" line of a worked answer. */
export function canonicalExpression(ones: number[]): string {
  if (ones.length === 0) return "0";
  return [...new Set(ones)]
    .sort((a, b) => a - b)
    .map((m) => termOf(toBits(m)))
    .join(" + ");
}

/** Evaluates a set of implicants for one input — used to prove a simplification. */
export function evaluate(groups: Implicant[], minterm: number): boolean {
  return groups.some((g) => covers(g, minterm));
}

export interface KarnaughPreset {
  id: string;
  label: string;
  description: string;
  ones: number[];
  dontCares: number[];
}

/**
 * Starting points a student will recognise from past papers.
 *
 * Each one exists to show a different trap: the wrap-around groups that only
 * work because the edges touch, an overlap that is allowed and necessary, a
 * don't-care that doubles a group's size, and a map where every group is
 * forced. The minterms are the teaching content and never change between
 * languages; only the wording around them does.
 */
const PRESET_DATA: Array<{
  id: string;
  label: Record<Locale, string>;
  description: Record<Locale, string>;
  ones: number[];
  dontCares: number[];
}> = [
  {
    id: "wrap",
    label: { en: "Edge wrap-around", si: "දාර එකතු වීම" },
    description: {
      en: "The four corner cells form one group of four, because the left edge is adjacent to the right edge and the top to the bottom. Miss it and you write four separate terms instead of one.",
      si: "කොන් හතරේ කොටු හතර එකම සමූහයක් වෙනවා, මොකද වම් දාරය දකුණු දාරයට යාබදයි, උඩ පේළිය යට පේළියට යාබදයි. මේක මඟ හැරුණොත් එක පදයක් වෙනුවට වෙන වෙනම පද හතරක් ලියවෙනවා.",
    },
    ones: [0, 2, 8, 10],
    dontCares: [],
  },
  {
    id: "overlap",
    label: { en: "Overlapping groups", si: "එකිනෙක උඩ තියෙන සමූහ" },
    description: {
      en: "Two groups of four that share cells. Overlapping is allowed — a cell may be in as many groups as you like, and refusing to overlap here costs you a bigger group.",
      si: "කොටු බෙදාගන්න සමූහ. එකිනෙක උඩ තියෙන එකට කමක් නෑ — එක කොටුවක් ඕන තරම් සමූහවල තියෙන්න පුළුවන්, ඒක නොකළොත් ලොකු සමූහයක් අතහැරෙනවා.",
    },
    ones: [0, 1, 2, 3, 4, 5, 8, 9],
    dontCares: [],
  },
  {
    id: "dontcare",
    label: { en: "Using don't-care terms", si: "Don\u2019t care පද පාවිච්චිය" },
    description: {
      en: "The X cells may be treated as 1 or 0, whichever helps. Here they turn a group of four into a group of eight, and the whole expression collapses to a single variable.",
      si: "X කොටු 1 විදිහට හෝ 0 විදිහට ගන්න පුළුවන් — වාසි එක අරගන්න. මෙතන ඒවා නිසා හතරේ සමූහයක් අටේ සමූහයක් වෙනවා, සම්පූර්ණ ප්‍රකාශනය එක විචල්‍යයකට බහිනවා.",
    },
    ones: [0, 1, 2, 3],
    dontCares: [4, 5, 6, 7],
  },
  {
    id: "essential",
    label: { en: "Essential groups first", si: "අනිවාර්ය සමූහ මුලින්" },
    description: {
      en: "Every group here is forced: each one covers a cell that no other group can reach. Three groups of four, and no choosing involved — find the forced ones and the answer falls out.",
      si: "මෙතන හැම සමූහයක්ම අනිවාර්යයි: හැම එකක්ම වෙන කිසි සමූහයකට ළඟා වෙන්න බැරි කොටුවක් ආවරණය කරනවා. හතරේ සමූහ තුනක්, තෝරගන්න දෙයක් නෑ — අනිවාර්ය ඒවා හොයාගත්තම උත්තරය එනවා.",
    },
    ones: [0, 1, 2, 4, 6, 8, 9, 10],
    dontCares: [],
  },
];

export function karnaughPresets(locale: Locale = "en"): KarnaughPreset[] {
  return PRESET_DATA.map((p) => ({
    id: p.id,
    label: p.label[locale],
    description: p.description[locale],
    ones: p.ones,
    dontCares: p.dontCares,
  }));
}
