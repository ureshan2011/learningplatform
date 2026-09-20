import "server-only";

import { listUnits, listContent } from "@/lib/queries";
import type { ContentItem } from "@/lib/types";

/**
 * What a student can search for, flattened into one list.
 *
 * Fourteen units, around a hundred competency levels, every note and past
 * paper: a student who wants "normalization" has, until now, had to already
 * know it lives under Unit 8. That is a reasonable thing to expect of a
 * teacher and an unreasonable thing to expect of a sixteen-year-old the night
 * before a paper.
 *
 * The syllabus half costs nothing — `AL_ICT_UNITS` is an authored array in the
 * repository, not a Firestore collection (see the comment on `listUnits`), so
 * indexing every lesson is a map over memory. The content half is one query,
 * which is why this is built behind an API route the search dialog fetches
 * once on first open rather than on every page render.
 */
export interface SearchEntry {
  /** What is shown. */
  t: string;
  /** The line under it — where this thing lives. */
  s: string;
  h: string;
  /** Which group it sorts into, and which icon it gets. */
  k: "unit" | "lesson" | "file" | "page";
  /**
   * Everything matchable, lowercased and joined — title, competency
   * statement, exam objectives, the areas where marks concentrate. One string
   * rather than an array so matching is a single `includes` per entry and the
   * payload has no structural overhead.
   */
  q: string;
}

const norm = (parts: Array<string | number | undefined>) =>
  parts.filter(Boolean).join(" ").toLowerCase();

export async function buildSearchIndex(subjectId: string): Promise<SearchEntry[]> {
  const [units, content] = await Promise.all([
    listUnits(subjectId),
    listContent(subjectId).catch(() => [] as ContentItem[]),
  ]);

  const entries: SearchEntry[] = [];

  for (const unit of units) {
    entries.push({
      t: `${unit.competencyNumber}. ${unit.title}`,
      s: `Unit · Grade ${unit.gradeYear} · ${unit.periods} periods`,
      h: `/subjects/${subjectId}/syllabus/${unit.id}`,
      k: "unit",
      q: norm([unit.title, unit.competencyStatement, unit.competencyNumber]),
    });

    for (const lesson of unit.lessons) {
      entries.push({
        t: `${lesson.id} ${lesson.title}`,
        s: unit.title,
        h: `/subjects/${subjectId}/syllabus/${unit.id}#lesson-${lesson.id}`,
        k: "lesson",
        q: norm([
          lesson.id,
          lesson.title,
          unit.title,
          ...lesson.examObjectives,
          ...lesson.importantAreas,
        ]),
      });
    }
  }

  for (const item of content) {
    entries.push({
      t: item.title,
      s: KIND_LABEL[item.kind],
      // The subject library is where every file is listed and downloadable.
      h: `/subjects/${subjectId}`,
      k: "file",
      q: norm([item.title, item.topic, KIND_LABEL[item.kind]]),
    });
  }

  return entries;
}

const KIND_LABEL: Record<ContentItem["kind"], string> = {
  notes: "Notes",
  past_paper: "Past paper",
  marking_scheme: "Marking scheme",
  replay: "Class replay",
  pack: "Pack file",
};
