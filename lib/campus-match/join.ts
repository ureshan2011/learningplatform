/**
 * Joining a cut-off row to its handbook entry.
 *
 * The two documents set the same course differently: the cut-off tables print
 * "APPLIED SCIENCES (BIO.SC) *" in capitals, truncated to fit a column, while
 * the handbook writes "Applied Sciences (Biological Science)". Neither spelling
 * is wrong, they just have to meet.
 *
 * Pure, with no imports, so `scripts/campus-match/validate.mjs` can report the
 * join rate the product actually achieves rather than a looser one nobody runs.
 * The data is passed in; nothing here reaches for a file.
 */

export interface JoinableCourse {
  name: string;
  streams: string[];
}

/** Words that carry no identity in either a course title or a university name. */
const STOP_WORDS = new Set(["and", "the", "of", "in", "for"]);

/**
 * A title reduced to something joinable: no brackets, no footnote markers, no
 * joining words, no punctuation. Everything that differs between the two
 * documents for reasons of house style rather than of meaning.
 */
export function looseKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[*#]/g, " ")
    .replace(/\b(and|the|of|in|for)\b/g, " ")
    .replace(/[^a-z0-9]/g, "");
}

/** The words inside a title's brackets: "(BIO.SC)" gives ["bio", "sc"]. */
function bracketTokens(name: string): string[] {
  const out: string[] = [];
  for (const match of name.matchAll(/\(([^)]*)\)/g)) {
    for (const token of match[1].toLowerCase().split(/[^a-z0-9]+/)) {
      if (token) out.push(token);
    }
  }
  return out;
}

function joinsWithAnd(name: string): boolean {
  return /\band\b|&/.test(name.toLowerCase());
}

/** "South Eastern University of Sri Lanka" gives "seusl". */
export function initialism(university: string): string {
  return university
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word && !STOP_WORDS.has(word))
    .map((word) => word[0])
    .join("");
}

/** Whether one bracket reads as an abbreviation of the other, word by word. */
function abbreviates(a: string[], b: string[]): boolean {
  if (a.length === 0 || a.length !== b.length) return false;
  return a.every((token, i) => token.startsWith(b[i]) || b[i].startsWith(token));
}

export interface Match<T> {
  course: T;
  /**
   * True where the handbook entry is the nearest one rather than the same
   * course: "ARTS-INFORMATION TECHNOLOGY" resolves to "Arts" because the
   * handbook has no separate entry for it. The stream it admits is right — it
   * is a variant of that course — but its identity is not, so nothing that
   * names the course, such as a degree profile, should be shown for it.
   */
  approximate: boolean;
}

export interface Join<T> {
  /** The handbook entry behind a cut-off row, if one can be identified. */
  find(title: string, university?: string): Match<T> | undefined;
}

export function buildJoin<T extends JoinableCourse>(
  courses: readonly T[],
  universities: readonly string[] = [],
): Join<T> {
  const byKey = new Map<string, T[]>();
  for (const course of courses) {
    const key = looseKey(course.name);
    const list = byKey.get(key);
    if (list) list.push(course);
    else byKey.set(key, [course]);
  }

  // Which bracketed abbreviations name a university rather than a subject. It
  // is what separates "Management and Information Technology (MIT)" from the
  // South Eastern University's own course of the same name.
  const universityInitials = new Set(universities.map(initialism).filter(Boolean));

  /**
   * Several handbook entries share a loose key. Four things separate them, in
   * order of how strongly each one speaks; a rule that would leave nothing
   * standing is skipped rather than applied.
   */
  function disambiguate(candidates: T[], title: string, university?: string): T | undefined {
    let live = candidates;

    // 1. The bracket itself. "(BIO.SC)" against "(Biological Science)" is the
    //    case this whole function exists for — dropping it showed Biological
    //    Science courses to Physical Science students.
    const tokens = bracketTokens(title);
    if (tokens.length > 0) {
      const matched = live.filter((c) => abbreviates(tokens, bracketTokens(c.name)));
      if (matched.length === 1) return matched[0];
      if (matched.length > 0) live = matched;
    }

    // 2. The joining word, which is the only difference between the handbook's
    //    "Information and Communication Technology" and its "Information
    //    Communication Technology" — two real and separate courses.
    const withAnd = joinsWithAnd(title);
    const sameJoin = live.filter((c) => joinsWithAnd(c.name) === withAnd);
    if (sameJoin.length === 1) return sameJoin[0];
    if (sameJoin.length > 0) live = sameJoin;

    // 3. The university, where the handbook puts its abbreviation in the
    //    bracket. A bracket naming a different university rules that entry out
    //    for this row even when nothing names this one.
    if (university) {
      const want = initialism(university);
      const mine = live.filter((c) => bracketTokens(c.name).includes(want));
      if (mine.length === 1) return mine[0];
      const notElsewhere = live.filter(
        (c) => !bracketTokens(c.name).some((t) => t !== want && universityInitials.has(t)),
      );
      if (notElsewhere.length === 1) return notElsewhere[0];
      if (notElsewhere.length > 0) live = notElsewhere;
    }

    // 4. Still ambiguous, but every candidate admits the same streams — the
    //    only thing read off this entry — so the ambiguity changes nothing.
    const streams = new Set(live.map((c) => [...c.streams].sort().join(",")));
    return streams.size === 1 ? live[0] : undefined;
  }

  /**
   * No handbook title matches outright. The two ways that happens pull in
   * opposite directions and are not equally good, so they are tried in order.
   */
  function nearest(key: string): { candidates: T[]; approximate: boolean } | undefined {
    if (key.length < 12) return undefined;

    // The cut-off tables truncate a long title to fit its column, so
    // "MANAGEMENT AND INFORMATION" is a real row and the handbook title it was
    // cut from is the same course. Accepted only when one handbook title starts
    // that way: a truncation that could be two courses matches neither.
    const truncations: T[][] = [];
    let longest = 0;
    let variants: T[] | undefined;
    let variantsAt = 0;

    for (const [candidate, list] of byKey) {
      if (candidate.startsWith(key)) {
        truncations.push(list);
      } else if (key.startsWith(candidate)) {
        // The other direction: the printed title is longer than any handbook
        // title, so this is a variant the handbook does not list separately.
        // The longest such title is the nearest one, and only it.
        if (candidate.length > longest) {
          longest = candidate.length;
          variants = list;
          variantsAt = 1;
        } else if (candidate.length === longest) {
          variantsAt += 1;
        }
      }
    }

    if (truncations.length === 1) return { candidates: truncations[0], approximate: false };
    if (truncations.length > 1) return undefined;
    if (variants && variantsAt === 1) return { candidates: variants, approximate: true };
    return undefined;
  }

  return {
    find(title, university) {
      const key = looseKey(title);
      const exact = byKey.get(key);
      const hit = exact ? { candidates: exact, approximate: false } : nearest(key);
      if (!hit) return undefined;

      const course =
        hit.candidates.length === 1
          ? hit.candidates[0]
          : disambiguate(hit.candidates, title, university);
      return course ? { course, approximate: hit.approximate } : undefined;
    },
  };
}
