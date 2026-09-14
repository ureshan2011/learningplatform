import type { Role } from "@/lib/types";

/**
 * What gets logged at all — the one place that decides.
 *
 * Deliberately free of `server-only` and of every Firebase import, because the
 * browser applies the same rules before it sends anything and the server
 * applies them again before it writes. Two copies of these rules would drift,
 * and the drift would be invisible: the log would simply cost more than anyone
 * expected.
 *
 * ## Why the rules exist
 *
 * Every row here is a Firestore write, and Firestore bills per operation. The
 * old behaviour logged every page view from everybody, which is the single
 * largest write source the platform can have — see the cost rules in
 * docs/PLAN.md and the batching note in `record.ts`.
 *
 * Two cuts, in order of how much they save:
 *
 * 1. **Staff are not logged.** The owner opens the console on a laptop, a
 *    phone and a second browser to test what students see (that is why devices
 *    are uncapped for staff — see the Devices notes in CLAUDE.md), and every
 *    one of those page views used to cost a write. Nobody reads the teacher's
 *    own history: there is one teacher, and they know what they did.
 * 2. **Only study actions are logged.** A page view is not evidence of
 *    studying. Opening the dashboard, checking the account screen or scrolling
 *    the syllabus told the teacher nothing they would act on, and cost the same
 *    as sitting a mock exam did.
 */

/**
 * Whose activity is recorded: students, and only students.
 *
 * An allowlist rather than "not teacher, not admin". The question the log
 * answers — is this student working — is only ever asked about a student, and
 * a role added later should have to opt in rather than arrive already costing
 * writes. That also covers `parent`, who reads a child's progress and whose own
 * clicks nobody has any use for.
 */
export function shouldRecordRole(role: Role): boolean {
  return role === "student";
}

/**
 * The routes worth a row.
 *
 * A study action: something a student *did*, that a teacher would bring up in
 * a conversation about whether they are working. Sitting a mock exam is one;
 * looking at the dashboard on the way there is not.
 *
 * Downloads and sign-ins do not appear here — those are recorded on the server
 * at the moment they happen (`recordQuietly`), never as page views, so they are
 * never matched against this list.
 *
 * To start logging a screen again, add its pattern. To stop, delete it. That is
 * the whole maintenance story, and it is why this is a list rather than a
 * condition spread across the routes.
 */
const MAIN_ACTIVITY_PATHS: RegExp[] = [
  // Live class — the single most important thing a student does here.
  /^\/live\/[^/]+$/,

  // The four study tools.
  /^\/subjects\/[^/]+\/practice$/,
  /^\/subjects\/[^/]+\/mock-exams\/[^/]+$/,
  /^\/subjects\/[^/]+\/lab$/,
  /^\/subjects\/[^/]+\/predicted-paper$/,

  // Earned, and worth a row on the day it happens.
  /^\/subjects\/[^/]+\/certificate$/,

  // Reading a Survival Pack guide. The pack's own page is not here: opening it
  // is browsing, reading a guide is using it.
  /^\/packs\/[^/]+\/[^/]+$/,

  // Money actually moving. Rare, and the row a dispute turns on.
  /^\/payments\/success$/,
];

/**
 * Whether this page view is worth a write.
 *
 * Everything not on the list is dropped — silently and on purpose. The
 * alternative, logging it "just in case", is what made this expensive.
 */
export function isMainActivity(path: string): boolean {
  return MAIN_ACTIVITY_PATHS.some((rule) => rule.test(path));
}
