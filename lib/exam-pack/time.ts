/**
 * Sri Lanka wall-clock arithmetic for the Exam Pack's live classes and
 * consultations.
 *
 * Every time a student or the owner types or reads is Sri Lanka time — the
 * owner advertises "Saturday 4pm" to students in Colombo, not 10:30pm in
 * Auckland. Sri Lanka is UTC+5:30 all year with no daylight saving, so the
 * conversion is a fixed offset and needs no time-zone database. New Zealand is
 * only ever *displayed* (to the owner, beside the Sri Lanka time), and the
 * browser's own Intl data does that, daylight saving included.
 *
 * Dependency-free and pure on purpose: `node --test` runs it directly.
 */

/** UTC+5:30, all year. */
export const COLOMBO_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isWallDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
}

export function isWallTime(value: string): boolean {
  return TIME_RE.test(value);
}

/**
 * The instant a Sri Lanka date and time names.
 *
 * `colomboToUtc("2026-10-17", "16:00")` is 10:30 UTC that day. Throws on a
 * malformed date or time rather than guessing — a slot created at the wrong
 * hour is a student waiting in an empty call.
 */
export function colomboToUtc(date: string, time: string): number {
  if (!isWallDate(date)) throw new Error(`Not a date: ${date}`);
  if (!isWallTime(time)) throw new Error(`Not a time: ${time}`);
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return Date.UTC(y, mo - 1, d, h, mi) - COLOMBO_OFFSET_MS;
}

/** The Sri Lanka calendar date and weekday an instant falls on. */
export function colomboParts(ms: number): { date: string; weekday: number; time: string } {
  const shifted = new Date(ms + COLOMBO_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const mo = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  const h = String(shifted.getUTCHours()).padStart(2, "0");
  const mi = String(shifted.getUTCMinutes()).padStart(2, "0");
  return { date: `${y}-${mo}-${d}`, weekday: shifted.getUTCDay(), time: `${h}:${mi}` };
}

/** `YYYY-MM-DD` plus a number of days, staying in calendar dates (no clock involved). */
export function addDays(date: string, days: number): string {
  const [y, mo, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, mo - 1, d) + days * DAY_MS);
  return next.toISOString().slice(0, 10);
}

export interface Occurrence {
  /** Sri Lanka date, `YYYY-MM-DD`. */
  date: string;
  startsAt: number;
  endsAt: number;
}

/**
 * The next `count` weekly occurrences that have not finished yet.
 *
 * "Not finished" rather than "not started": a student who opens the app twenty
 * minutes into Saturday's class must still be shown Saturday's class, with a
 * join button, not next week's.
 */
export function nextOccurrences(
  schedule: { weekday: number; time: string; durationMinutes: number },
  now: number,
  count: number,
): Occurrence[] {
  const out: Occurrence[] = [];
  const today = colomboParts(now).date;
  // Fifteen days covers two whole weeks from any starting weekday; the loop
  // stops as soon as it has enough.
  for (let i = 0; i < 15 && out.length < count; i++) {
    const date = addDays(today, i);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (weekday !== schedule.weekday) continue;
    const startsAt = colomboToUtc(date, schedule.time);
    const endsAt = startsAt + schedule.durationMinutes * 60 * 1000;
    if (endsAt <= now) continue;
    out.push({ date, startsAt, endsAt });
  }
  return out;
}

/**
 * `count` back-to-back slots starting at a Sri Lanka date and time — how the
 * owner publishes an evening of consultations in one go.
 */
export function slotStarts(date: string, time: string, count: number, minutes: number): number[] {
  const first = colomboToUtc(date, time);
  return Array.from({ length: count }, (_, i) => first + i * minutes * 60 * 1000);
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export const WEEKDAYS_SI = [
  "ඉරිදා",
  "සඳුදා",
  "අඟහරුවාදා",
  "බදාදා",
  "බ්‍රහස්පතින්දා",
  "සිකුරාදා",
  "සෙනසුරාදා",
] as const;

/** "4:00 pm" from "16:00", for a schedule written on a card. */
export function formatWallTime(time: string): string {
  const [h, mi] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(mi).padStart(2, "0")} ${suffix}`;
}

/** "Sat 17 Oct, 4:00 pm" in any IANA zone. Used for Sri Lanka and, on the console, New Zealand. */
export function formatInZone(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ms));
}

export const NZ_TZ = "Pacific/Auckland";
export const COLOMBO_TZ = "Asia/Colombo";
