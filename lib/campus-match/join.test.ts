import assert from "node:assert/strict";
import { test } from "node:test";
import { buildJoin, initialism, looseKey } from "./join.ts";

/**
 * The join decides which courses a student is shown, so a mistake here is a
 * student reading a report about degrees they cannot apply for. Each case below
 * is a real pair of titles from the UGC's two documents.
 */

const UNIVERSITIES = [
  "University of Colombo",
  "University of Kelaniya",
  "South Eastern University of Sri Lanka",
  "Rajarata University of Sri Lanka",
];

const HANDBOOK = [
  { name: "Applied Sciences (Biological Science)", streams: ["biological-science"] },
  { name: "Applied Sciences (Physical Science)", streams: ["physical-science"] },
  { name: "Information and Communication Technology (ICT)", streams: ["ict"] },
  { name: "Information Communication Technology", streams: ["ict", "engineering-technology"] },
  { name: "Management and Information Technology (MIT)", streams: ["physical-science", "ict"] },
  { name: "Management and Information Technology (SEUSL)", streams: ["any"] },
  { name: "Management", streams: ["commerce"] },
  { name: "Management Studies (TV)", streams: ["commerce"] },
  { name: "Arts", streams: ["arts"] },
  { name: "Arts ", streams: ["arts"] },
  { name: "Medicine", streams: ["biological-science"] },
];

const join = buildJoin(HANDBOOK, UNIVERSITIES);
const find = (title: string, university?: string) => join.find(title, university);

test("an exact title joins", () => {
  assert.equal(find("MEDICINE")?.course.name, "Medicine");
  assert.equal(find("MEDICINE")?.approximate, false);
});

test("the bracket separates two courses that share a name", () => {
  assert.equal(find("APPLIED SCIENCES (BIO.SC)")?.course.name, "Applied Sciences (Biological Science)");
  assert.equal(find("APPLIED SCIENCES (PHY.SC)")?.course.name, "Applied Sciences (Physical Science)");
});

test("the joining word separates two real courses", () => {
  assert.equal(
    find("INFORMATION AND COMMUNICATION TECHNOLOGY")?.course.name,
    "Information and Communication Technology (ICT)",
  );
  assert.equal(
    find("INFORMATION COMMUNICATION TECHNOLOGY")?.course.name,
    "Information Communication Technology",
  );
});

test("a truncated title joins to the one course it was cut from", () => {
  // The cut-off tables cut a long title to fit its column.
  const match = find("MANAGEMENT AND INFORMATION", "University of Kelaniya");
  assert.equal(match?.course.name, "Management and Information Technology (MIT)");
  assert.equal(match?.approximate, false);
});

test("the university in the handbook's bracket wins over the generic entry", () => {
  assert.equal(
    find("MANAGEMENT AND INFORMATION", "South Eastern University of Sri Lanka")?.course.name,
    "Management and Information Technology (SEUSL)",
  );
});

test("an ambiguity that changes nothing resolves", () => {
  // Two handbook entries named "Arts", both admitting the same stream.
  assert.equal(find("ARTS *")?.course.streams.join(), "arts");
});

test("a title longer than any handbook entry is marked approximate", () => {
  const match = find("MANAGEMENT STUDIES (TV) - A");
  assert.equal(match?.course.name, "Management Studies (TV)");
  assert.equal(match?.approximate, true, "the nearest entry is not the same course");
});

test("a title too short to be a safe truncation does not join", () => {
  assert.equal(find("LAW"), undefined);
});

test("looseKey drops the differences of house style, not of meaning", () => {
  assert.equal(looseKey("BANKING & INSURANCE *"), looseKey("Banking and Insurance"));
  assert.notEqual(looseKey("Medicine"), looseKey("Dental Surgery"));
});

test("initialism reads a university's abbreviation", () => {
  assert.equal(initialism("South Eastern University of Sri Lanka"), "seusl");
  assert.equal(initialism("University of Kelaniya"), "uk");
});
