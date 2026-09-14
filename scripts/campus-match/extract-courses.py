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

from ugc_names import universities_mentioned

# 2.2.X is a stream; 2.2.X.Y is a course inside it.
HEADING = re.compile(r"^(2\.2\.\d+(?:\.\d+)?)\s+(.{3,100})$")
COURSE_CODE = re.compile(r"\(\s*Course Code\s*[-–]\s*([0-9]{2,4})\s*\)", re.I)
INTAKE = re.compile(r"\(\s*Proposed Intake\s*[-–]\s*([0-9,]{1,7})\s*\)", re.I)
# Labelled fields are set against a Wingdings bullet that arrives as U+F0A7.
BULLET = ""
FIELD = re.compile(
    rf"^[{BULLET}\s•\-]*(Available Universit(?:y|ies)|Medium|Duration|Degree Programmes?)"
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
        found.append(
            {
                "section": section,
                "title": title,
                "page": pageno,
                "lines": [text for _, text in lines[index:end]],
            }
        )
    return found


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
    start = text.find("Minimum eligibility requirements")
    body = text[start:] if start >= 0 else ""
    # Ends at the first labelled field. The rules are a bulleted list and the
    # fields are bulleted too, so the bullet cannot mark the boundary.
    cut = len(body)
    for line in body.split("\n"):
        if FIELD.match(line):
            cut = body.find(line)
            break
    eligibility = body[:cut].strip()
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
        "eligibility": eligibility,
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
