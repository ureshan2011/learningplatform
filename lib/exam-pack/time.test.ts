import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDays,
  colomboParts,
  colomboToUtc,
  formatInZone,
  formatWallTime,
  isWallDate,
  nextOccurrences,
  slotStarts,
} from "./time.ts";

/**
 * The live class is advertised as "Saturday 4pm" to students in Sri Lanka and
 * run by an owner in New Zealand. A slip in either direction is a class with
 * nobody in it, so these pin the conversions down on real dates.
 */

const SATURDAY_4PM = { weekday: 6, time: "16:00", durationMinutes: 60 };

test("Sri Lanka 4pm is 10:30 UTC — a fixed +5:30, no daylight saving", () => {
  assert.equal(new Date(colomboToUtc("2026-10-17", "16:00")).toISOString(), "2026-10-17T10:30:00.000Z");
  // Same offset in the middle of the year.
  assert.equal(new Date(colomboToUtc("2027-06-12", "16:00")).toISOString(), "2027-06-12T10:30:00.000Z");
});

test("colomboParts reads the Sri Lanka date, not the UTC one", () => {
  // 20:00 UTC on the 16th is already 01:30 on the 17th in Colombo.
  const parts = colomboParts(Date.UTC(2026, 9, 16, 20, 0));
  assert.equal(parts.date, "2026-10-17");
  assert.equal(parts.weekday, 6);
  assert.equal(parts.time, "01:30");
});

test("the Saturday 4pm live shows as 11:30pm in New Zealand summer and 10:30pm in winter", () => {
  // NZDT (UTC+13) runs until early April; NZST (UTC+12) after.
  assert.match(formatInZone(colomboToUtc("2026-10-17", "16:00"), "Pacific/Auckland"), /11:30\s?pm/);
  assert.match(formatInZone(colomboToUtc("2027-06-12", "16:00"), "Pacific/Auckland"), /10:30\s?pm/);
});

test("nextOccurrences finds the coming Saturdays", () => {
  // Friday 9 October 2026, midday in Colombo.
  const now = colomboToUtc("2026-10-09", "12:00");
  const next = nextOccurrences(SATURDAY_4PM, now, 2);
  assert.deepEqual(
    next.map((o) => o.date),
    ["2026-10-10", "2026-10-17"],
  );
  assert.equal(next[0].endsAt - next[0].startsAt, 60 * 60 * 1000);
});

test("a class already under way is still this week's class", () => {
  // Twenty minutes into Saturday's live.
  const now = colomboToUtc("2026-10-10", "16:20");
  const [first] = nextOccurrences(SATURDAY_4PM, now, 1);
  assert.equal(first.date, "2026-10-10");
});

test("once it has finished, the next one is the following Saturday", () => {
  const now = colomboToUtc("2026-10-10", "17:05");
  const [first] = nextOccurrences(SATURDAY_4PM, now, 1);
  assert.equal(first.date, "2026-10-17");
});

test("slotStarts lays consultations back to back", () => {
  const starts = slotStarts("2026-10-18", "09:00", 3, 30);
  assert.deepEqual(
    starts.map((ms) => colomboParts(ms).time),
    ["09:00", "09:30", "10:00"],
  );
});

test("bad dates and times are refused, not guessed", () => {
  assert.equal(isWallDate("2026-02-30"), false);
  assert.equal(isWallDate("2026-2-3"), false);
  assert.throws(() => colomboToUtc("2026-10-17", "4pm"));
  assert.throws(() => colomboToUtc("2026-13-01", "16:00"));
});

test("addDays crosses month and year ends", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2027-02-28", 1), "2027-03-01");
});

test("formatWallTime reads like a timetable", () => {
  assert.equal(formatWallTime("16:00"), "4:00 pm");
  assert.equal(formatWallTime("00:30"), "12:30 am");
  assert.equal(formatWallTime("12:05"), "12:05 pm");
});
