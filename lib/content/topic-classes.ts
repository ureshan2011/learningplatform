import { formatSessionTime, formatSessionTimeShort } from "@/lib/format";
import type { ClassSession, SessionState, Unit } from "@/lib/types";

/**
 * Ties the class timetable to the syllabus, so a student reading about one
 * competency can join the class that actually teaches it instead of hunting
 * through a subject-wide timetable.
 *
 * Deliberately pure and free of `server-only`: the syllabus page matches on
 * the server, then hands the result to client components that render live
 * countdowns from it.
 */

/**
 * The public face of a class. Only fields a signed-out visitor may see — the
 * Zoom meeting id, HLS URL and everything in `sessionSecrets` stay behind
 * `hasAccess()` and never reach this page.
 */
export interface TopicClass {
  id: string;
  title: string;
  topic: string;
  startsAt: number;
  /**
   * The start time, already formatted on the server.
   *
   * `Intl` disagrees with itself across runtimes — Node and Chrome ship
   * different CLDR versions, so the same instant renders as "Fri, 28 Aug" on
   * one and "Fri 28 Aug" on the other. Formatting once on the server and
   * shipping the string keeps hydration byte-identical, and leaves the client
   * with nothing but arithmetic to do for the countdown.
   */
  startsAtLabel: string;
  /** The same instant, short enough for a button on a narrow phone. */
  startsAtShort: string;
  durationMinutes: number;
  state: SessionState;
  /** Competency level this class covers, once resolved. Drives per-lesson buttons. */
  lessonId?: string;
}

export interface TopicClassIndex {
  /** Keyed by unit id — every class matched to that unit, soonest first. */
  byUnit: Record<string, TopicClass[]>;
  /** Keyed by competency-level id ("3.2"), for classes pinned to one lesson. */
  byLesson: Record<string, TopicClass[]>;
  /** Total matched classes, for the header count. */
  total: number;
}

export function toTopicClass(session: ClassSession, lessonId?: string): TopicClass {
  return {
    id: session.id,
    title: session.title,
    topic: session.topic,
    startsAt: session.startsAt,
    startsAtLabel: formatSessionTime(session.startsAt),
    startsAtShort: formatSessionTimeShort(session.startsAt),
    durationMinutes: session.durationMinutes,
    state: session.state,
    ...(lessonId ? { lessonId } : {}),
  };
}

/**
 * The parts of a unit this module actually matches on.
 *
 * Widened from `Unit` so the landing page can index classes against the static
 * syllabus in lib/content/al-ict-units.ts — which has no `tenantId` or
 * `createdAt` yet — on a project whose units have never been seeded.
 */
export type MatchableUnit = Pick<Unit, "id" | "title" | "lessons">;

/** Lowercased, punctuation-free, single-spaced — so "I/O devices" matches "io devices". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Which unit (and, when it can tell, which lesson) a class belongs to.
 *
 * Explicit ids win. Text matching is the fallback for classes scheduled
 * before `unitId` existed on the session document: a competency number in the
 * title ("Databases 8.2 — normalisation") is the strongest signal, then a
 * lesson title, then the unit title. It returns nothing rather than guessing
 * — an unmatched class still shows in the page's "all classes" strip, so a
 * wrong match is worse than no match.
 */
function locate(
  session: ClassSession,
  units: readonly MatchableUnit[],
): { unit: MatchableUnit; lessonId?: string } | null {
  if (session.lessonId) {
    const unit = units.find((u) => u.lessons.some((l) => l.id === session.lessonId));
    if (unit) return { unit, lessonId: session.lessonId };
  }

  if (session.unitId) {
    const unit = units.find((u) => u.id === session.unitId);
    if (unit) return { unit };
  }

  const text = `${session.title} ${session.topic}`;

  // "8.2" style competency reference anywhere in the title or topic.
  for (const token of text.match(/\b\d{1,2}\.\d{1,2}\b/g) ?? []) {
    const unit = units.find((u) => u.lessons.some((l) => l.id === token));
    if (unit) return { unit, lessonId: token };
  }

  const normalizedText = normalize(text);

  for (const unit of units) {
    for (const lesson of unit.lessons) {
      const title = normalize(lesson.title);
      // Two words is not a match — "data" appears in half the syllabus.
      if (title.split(" ").length >= 3 && normalizedText.includes(title)) {
        return { unit, lessonId: lesson.id };
      }
    }
  }

  for (const unit of units) {
    if (normalizedText.includes(normalize(unit.title))) return { unit };
  }

  return null;
}

/**
 * Groups a subject's upcoming classes onto its syllabus.
 *
 * Classes that match nothing are simply left out of the index — the caller
 * still has the full list and shows them in the subject-wide strip.
 */
export function indexClassesBySyllabus(
  units: readonly MatchableUnit[],
  sessions: ClassSession[],
): TopicClassIndex {
  const byUnit: Record<string, TopicClass[]> = {};
  const byLesson: Record<string, TopicClass[]> = {};
  let total = 0;

  for (const session of sessions) {
    const match = locate(session, units);
    if (!match) continue;

    const topicClass = toTopicClass(session, match.lessonId);
    (byUnit[match.unit.id] ??= []).push(topicClass);
    if (match.lessonId) (byLesson[match.lessonId] ??= []).push(topicClass);
    total += 1;
  }

  const soonestFirst = (a: TopicClass, b: TopicClass) => a.startsAt - b.startsAt;
  for (const list of Object.values(byUnit)) list.sort(soonestFirst);
  for (const list of Object.values(byLesson)) list.sort(soonestFirst);

  return { byUnit, byLesson, total };
}

/**
 * A class counts as joinable from 15 minutes before it starts until it ends —
 * the same window the live page itself uses, so the button and the page it
 * leads to never disagree.
 */
export function isJoinableNow(topicClass: TopicClass, now: number): boolean {
  if (topicClass.state === "live") return true;
  if (topicClass.state !== "scheduled") return false;
  const endsAt = topicClass.startsAt + topicClass.durationMinutes * 60_000;
  return now >= topicClass.startsAt - 15 * 60_000 && now < endsAt;
}
