#!/usr/bin/env python3
"""
Turns the UGC admission handbook into lib/content/ugc/courses.json.

The handbook sets every course out the same way — a numbered heading, a course
code, an intake, the eligibility prose, then the university and medium as
labelled fields — so the fixed fields parse cleanly and the prose does not.

That split is the point. Anything the handbook states as a field is encoded;
the eligibility rules are kept verbatim with their page number and the course is
flagged `eligibilityVerify`, because the rules are written in prose with
"or"s and numbered alternatives, and a rule guessed wrong tells a student they
can apply for something they cannot. The report shows "check the handbook"
against every flagged course rather than a guess.

Usage: extract-courses.py --pdf PATH --out PATH
"""

import argparse
import json
import re
from pathlib import Path

import pdfplumber

from ugc_names import canonical_university, universities_mentioned

# 2.2.X is a stream; 2.2.X.Y is a course inside it.
HEADING = re.compile(r"^(2\.2\.\d+(?:\.\d+)?)\s+(.{3,100})$")
COURSE_CODE = re.compile(r"\(\s*Course Code\s*[-–:]\s*([0-9]{2,4})\s*\)", re.I)
INTAKE = re.compile(r"\(\s*Proposed Intake\s*[-–:]\s*([0-9,]{1,7})\s*\)", re.I)
# Labelled fields are set against a Wingdings bullet that arrives as U+F0A7.
BULLET = ""
FIELD = re.compile(
    rf"^[{BULLET}\s•\-]*(Available Universit(?:y|ies)|Medium|Duration|Degree Programmes?|Fields of Specializations?)"
    r"\s*:\s*(.*)$",
    re.I,
)

STREAMS = {
    "2.2.1": "arts",
    "2.2.2": "commerce",
    "2.2.3": "biological-science",
    "2.2.4": "physical-science",
    "2.2.5": "engineering-technology",
    "2.2.6": "biosystems-technology",
    "2.2.7": "ict",
    "2.2.8": "any",
}

# Stream names as the eligibility prose writes them, for the 2.2.8 courses that
# admit from several streams and name them in the text.
STREAM_WORDS = [
    ("biological-science", re.compile(r"Biological\s+Science", re.I)),
    ("physical-science", re.compile(r"Physical\s+Science", re.I)),
    ("commerce", re.compile(r"Commerce", re.I)),
    ("arts", re.compile(r"\bArts\b", re.I)),
    ("engineering-technology", re.compile(r"Engineering\s+Technology", re.I)),
    ("biosystems-technology", re.compile(r"Biosystems\s+Technology", re.I)),
    ("ict", re.compile(r"Information\s*&?\s*Communication\s+Technology|\bICT\b", re.I)),
]

APTITUDE = re.compile(r"aptitude\s+test|practical\s+test", re.I)


def blocks(pdf):
    """
    Course blocks, one per course code.

    Driven by the code line rather than by the numbered heading above it. Most
    courses sit under a "2.2.3.27" heading, but the Arts section sets several out
    as a plain numbered list — "2. Course of Study in Arts offered by the
    Sabaragamuwa University..." — and keying on the section heading dropped every
    one of those. Every course has a code; not every course has a section.
    """
    lines = []
    for pageno, page in enumerate(pdf.pages, start=1):
        for raw in (page.extract_text() or "").split("\n"):
            lines.append((pageno, raw.strip()))

    # Where each course starts, and the most recent section heading above it.
    starts = []
    section = ""
    for index, (pageno, line) in enumerate(lines):
        heading = HEADING.match(line)
        if heading:
            section = heading.group(1)
        if COURSE_CODE.search(line):
            starts.append((index, pageno, section))

    found = []
    for position, (index, pageno, section) in enumerate(starts):
        end = starts[position + 1][0] if position + 1 < len(starts) else len(lines)
        # The title is the line above the code, minus any contents-page number.
        title = ""
        for back in range(index - 1, max(index - 4, -1), -1):
            candidate = lines[back][1]
            if candidate and not INTAKE.search(candidate):
                title = candidate
                break
        title = re.sub(r"^\d+(\.\d+)*\.?\s+", "", title)
        title = re.sub(r"\s+\d{1,3}$", "", title).strip()
        # The Arts section wraps several titles as "Course of Study in X offered
        # by Y". The cut-off tables print only X, so the wrapper has to come off
        # or those courses never join to their own cut-offs.
        wrapper = re.match(r"^Course of Study in (.+?)(?:\s+offered by .*)?$", title, re.I)
        if wrapper:
            title = wrapper.group(1).strip()
        found.append(
            {
                "section": section,
                "title": title,
                "page": pageno,
                "lines": [text for _, text in lines[index:end]],
            }
        )
    return found


DEGREE_LIST = re.compile(r"degree programme[s]? (is|are) available", re.I)
# Several sections follow the rules with a list of *courses* a stream may also
# apply for. Those are bulleted too, and they are not A/L subjects.
COURSE_LIST = re.compile(
    r"could also seek admission|following courses of study|courses of study offered", re.I
)


def eligibility_lines(lines):
    """
    The rule lines only.

    Ends at the first labelled field, or — for the handful of courses that list
    their universities as plain lines with no label at all — at the sentence
    that introduces that list. Without the second cut, Engineering Technology's
    rules ran on through six universities and their degree names.
    """
    start = None
    for i, line in enumerate(lines):
        if "Minimum eligibility requirements" in line:
            start = i
            break
    if start is None:
        return []

    out = []
    for line in lines[start:]:
        if FIELD.match(line) or DEGREE_LIST.search(line) or COURSE_LIST.search(line):
            break
        out.append(line)
    return out


def subjects_from_bullet(line):
    """
    The acceptable A/L subjects a bulleted line names.

    Plural: the handbook sets these lists in two columns, and the text layer
    joins a row into one line — "Accounting  Geography" is two subjects, not a
    subject called "Accounting Geography". A run of spaces is the column gap.
    """
    if not line.startswith(BULLET):
        return []
    body = line[len(BULLET) :].strip(" .;,")
    out = []
    # Split on the bullet too: a two-column row carries the second column's own
    # bullet inline, so "Higher Mathematics <bullet> Biology" is two subjects.
    for part in re.split(rf"[{BULLET}]|\s{{2,}}", body):
        name = part.strip(" .;,")
        # Rules also appear as bullets ("At least a Credit Pass in ..."), and
        # those are sentences rather than subject names.
        if not name or len(name.split()) > 6 or not name[0].isupper():
            continue
        if re.search(r"\bat least\b|\bgrade\b|\bpass\b|\bexamination\b", name, re.I):
            continue
        # A university in a rule block is the start of the list that follows it.
        if canonical_university(name):
            continue
        out.append(name)
    return out


def parse_block(block):
    text = "\n".join(block["lines"])
    code = COURSE_CODE.search(text)
    if not code:
        # The contents pages repeat every heading with no body. No code, no course.
        return None

    fields = {}
    for line in block["lines"]:
        match = FIELD.match(line)
        if match:
            key = match.group(1).lower()
            key = "universities" if key.startswith("available") else key
            key = "degree" if key.startswith("degree") else key
            fields.setdefault(key, []).append(match.group(2).strip())

    intake = INTAKE.search(text)
    stream = STREAMS.get(block["section"].rsplit(".", 1)[0], "any")

    # Where the eligibility prose begins. Everything above it is the heading
    # block; everything below is the rules and then the labelled fields.
    # Worked on the lines rather than the joined text, so the bullets that mark
    # each acceptable subject are still there to read.
    rule_lines = eligibility_lines(block["lines"])
    subjects = []
    for line in rule_lines:
        for name in subjects_from_bullet(line):
            if name not in subjects:
                subjects.append(name)
    eligibility = "\n".join(rule_lines)
    eligibility = re.sub(r"\s*\n\s*", " ", eligibility)
    eligibility = re.sub(r"\s{2,}", " ", eligibility).strip()

    streams = [stream]
    if stream == "any":
        named = [key for key, pattern in STREAM_WORDS if pattern.search(eligibility)]
        streams = named or ["any"]

    return {
        "code": code.group(1),
        "name": block["title"],
        "section": block["section"],
        "handbookPage": block["page"],
        "streams": streams,
        # Read from the whole block, not the labelled field: the handbook
        # sometimes merges "Degree Programmes & Available Universities" into one
        # label and interleaves degree names and universities beneath it.
        "universities": universities_mentioned(text),
        "medium": (fields.get("medium") or [""])[0],
        "duration": (fields.get("duration") or [""])[0],
        **({"intake": int(intake.group(1).replace(",", ""))} if intake else {}),
        "aptitudeTest": bool(APTITUDE.search(text)),
        # The A/L subjects this course's own rules name, read from the bullets
        # inside the rule block. Not an eligibility rule — the prose around them
        # decides how many are needed and in what combination — but it is the
        # list a student should be offered as toggles.
        "subjects": subjects,
        "eligibility": re.sub(r"\s{2,}", " ", eligibility.replace("\n", " ")).strip(),
        # The prose is not reduced to a machine rule anywhere here, so every
        # course carries the flag and the report says "check handbook".
        "eligibilityVerify": True,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--cover-year", default="2025/2026")
    ap.add_argument("--source", default="")
    args = ap.parse_args()

    with pdfplumber.open(args.pdf) as pdf:
        parsed = [parse_block(b) for b in blocks(pdf)]

    courses = [c for c in parsed if c]
    # A course can appear twice where the handbook repeats a heading across a
    # page break; the code is what identifies it.
    by_code = {}
    for course in courses:
        by_code.setdefault(course["code"], course)

    payload = {
        "coverYear": args.cover_year,
        "source": args.source,
        "courses": sorted(by_code.values(), key=lambda c: c["code"]),
    }
    Path(args.out).write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n")

    verified = sum(1 for c in payload["courses"] if not c["eligibilityVerify"])
    print(
        f"{len(payload['courses'])} courses "
        f"({len(courses) - len(by_code)} duplicate headings merged), "
        f"{verified} with machine-readable eligibility"
    )
    no_uni = [c for c in payload["courses"] if not c["universities"]]
    if no_uni:
        print(f"  {len(no_uni)} with no university parsed: "
              + ", ".join(c["code"] for c in no_uni[:12]))


if __name__ == "__main__":
    main()
