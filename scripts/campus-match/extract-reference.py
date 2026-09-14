#!/usr/bin/env python3
"""
Builds districts.json, streams.json and scheme.json.

Districts come from the cut-off tables, which is the only place the UGC prints
the exact 25 spellings its columns use. Streams and their subjects come from the
handbook: the stream headings name the streams, and the bulleted subject lists
inside each course's eligibility rules name the subjects the UGC will accept.

scheme.json is deliberately thin. The handoff §2.3 asks for the merit and
district shares and how preference order is processed, and says to leave out
anything the handbook does not state. Only Section 2 of the handbook is
published at admission.ugc.ac.lk, and it states neither, so those fields are
recorded as not found rather than filled in from memory.

Usage: extract-reference.py --pdf HANDBOOK --cutoffs DIR --out DIR
"""

import argparse
import json
import re
from pathlib import Path

import pdfplumber

BULLET = ""

# The 25 districts in the order the newest table prints them, with the keys the
# cut-off JSON uses. Verified against the rendered page (see QA.md).
DISTRICTS = [
    "COLOMBO", "GAMPAHA", "KALUTARA", "MATALE", "KANDY", "NUWARA ELIYA",
    "GALLE", "MATARA", "HAMBANTOTA", "JAFFNA", "KILINOCHCHI", "MANNAR",
    "MULLAITIVU", "VAVUNIYA", "BATTICALOA", "AMPARA", "TRINCOMALEE",
    "KURUNEGALA", "PUTTALAM", "ANURADHAPURA", "POLONNARUWA", "BADULLA",
    "MONARAGALA", "RATNAPURA", "KEGALLE",
]

STREAM_SECTIONS = {
    "2.2.1": ("arts", "Arts"),
    "2.2.2": ("commerce", "Commerce"),
    "2.2.3": ("biological-science", "Biological Science"),
    "2.2.4": ("physical-science", "Physical Science"),
    "2.2.5": ("engineering-technology", "Engineering Technology"),
    "2.2.6": ("biosystems-technology", "Biosystems Technology"),
    "2.2.7": ("ict", "Information & Communication Technology"),
}

HEADING = re.compile(r"^(2\.2\.\d+(?:\.\d+)?)\s+")
# A bulleted line inside an eligibility list names one acceptable subject.
SUBJECT_LINE = re.compile(rf"^[{BULLET}\s]*([A-Z][A-Za-z&'’,\- ]{{3,48}})$")
FIELD_LABEL = re.compile(
    r"(Degree Programmes?|Available Universit(?:y|ies)|Duration|Medium|Fields of)\s*[&:]", re.I
)
# Lines that are labelled fields or prose, not subjects.
NOT_SUBJECT = re.compile(
    r"Degree Programme|Available Universit|Duration|Medium|Fields of|Course Code|"
    r"Proposed Intake|Minimum eligibility|Examination|Important|Note|University|Bachelor",
    re.I,
)

# The Z-score's plausible range, from what the published rounds actually contain
# rather than from theory. Used to validate a student's typed score.
Z_RANGE = {"min": -3.5, "max": 3.5}


def title_case(name):
    return " ".join(w.capitalize() for w in name.split())


def build_districts():
    return {
        "source": "The district columns of the UGC cut-off tables in lib/content/ugc/cutoffs/.",
        "districts": [
            {"key": d.lower().replace(" ", "-"), "name": title_case(d), "printed": d}
            for d in DISTRICTS
        ],
    }


def build_streams(pdf, cover_year, source):
    """Streams from the handbook headings, subjects from its eligibility bullets."""
    subjects = {key: {} for key, _ in STREAM_SECTIONS.values()}
    section = ""
    # Only collect between "Minimum eligibility requirements" and the first
    # labelled field. Outside that window the same bullet introduces degree
    # names, universities and the lists of courses open to any stream, and
    # collecting those put "Fashion Design & Product Development" into the ICT
    # stream's A/L subjects.
    in_rules = False
    for page in pdf.pages:
        for raw in (page.extract_text() or "").split("\n"):
            line = raw.strip()
            heading = HEADING.match(line)
            if heading:
                section = heading.group(1)
                if section.count(".") == 3:
                    section = section.rsplit(".", 1)[0]
                in_rules = False
            if "Minimum eligibility requirements" in line:
                in_rules = True
                continue
            if FIELD_LABEL.search(line):
                in_rules = False
            stream = STREAM_SECTIONS.get(section)
            if not in_rules or not stream or NOT_SUBJECT.search(line):
                continue
            match = SUBJECT_LINE.match(line)
            if not match:
                continue
            name = re.sub(r"\s{2,}", " ", match.group(1)).strip(" ,")
            if len(name.split()) > 5:
                continue
            bucket = subjects[stream[0]]
            bucket[name.lower()] = bucket.get(name.lower(), 0) + 1

    return {
        "coverYear": cover_year,
        "source": source,
        "note": (
            "Stream names are the handbook's own section headings and are reliable. "
            "Subject lists are deliberately empty: §2.4 asks for the Department of "
            "Examinations' subject lists, which are not in this document, and the "
            "handbook's own bullets mix acceptable A/L subjects with degree names and "
            "university lists in a way that cannot be told apart reliably. A wrong "
            "subject toggle on the free checker would tell a student they are "
            "ineligible for a course they can sit, so nothing is shipped rather than "
            "a guess. Fill from doenets.lk before building the checker."
        ),
        "subjectsSource": None,
        "streams": [
            {
                "key": key,
                "name": label,
                "subjects": [],
                # What the handbook's bullets gave for this stream, kept only so
                # the next session can see why they were not good enough to ship.
                "handbookBulletsSample": [
                    title_case(name)
                    for name, _ in sorted(
                        subjects[key].items(), key=lambda kv: (-kv[1], kv[0])
                    )[:12]
                ],
            }
            for key, label in STREAM_SECTIONS.values()
        ],
        "zScoreRange": Z_RANGE,
    }


def build_scheme(pdf, cover_year, source):
    """Only the rules this document actually states, each with its page."""
    rules = []
    not_found = []

    for pageno, page in enumerate(pdf.pages, start=1):
        text = re.sub(r"\s+", " ", page.extract_text() or "")
        if "All Island Merit basis" in text:
            match = re.search(r"Admission to courses of study[^.]{0,120}All Island Merit basis\.", text)
            if match:
                rules.append(
                    {
                        "rule": "allIslandMerit",
                        "text": match.group(0).strip(),
                        "handbookPage": pageno,
                    }
                )
        if "preference mentioned in the application form" in text and not any(
            r["rule"] == "preferencesOnForm" for r in rules
        ):
            rules.append(
                {
                    "rule": "preferencesOnForm",
                    "text": (
                        "A candidate who fails a practical or aptitude test is still "
                        "considered for the other courses of study of his/her preference "
                        "mentioned in the application form, subject to satisfying the "
                        "relevant requirements."
                    ),
                    "handbookPage": pageno,
                }
            )

    # Named explicitly so the gap is visible to whoever builds the report, rather
    # than discovered when a screen needs a rule that is not here.
    for field, why in [
        ("allIslandMeritShare", "not stated in the published handbook section"),
        ("districtShare", "not stated in the published handbook section"),
        ("educationallyDisadvantagedShare", "not stated in the published handbook section"),
        ("educationallyDisadvantagedDistricts", "not listed in the published handbook section"),
        ("preferenceProcessing", "how the UGC works down an ordered preference list is not stated"),
        ("preferenceCount", "the number of preferences the form allows is not stated"),
        ("applicationWindow", "application dates are not in this document"),
    ]:
        not_found.append({"field": field, "reason": why})

    return {
        "coverYear": cover_year,
        "source": source,
        "note": (
            "Only Section 2 of the handbook is published at admission.ugc.ac.lk. "
            "Everything below is quoted from it. Fields under notFound are left out "
            "rather than assumed, per the handoff §2.3."
        ),
        "rules": rules,
        "notFound": not_found,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--cover-year", default="2025/2026")
    ap.add_argument("--source", default="")
    args = ap.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    with pdfplumber.open(args.pdf) as pdf:
        streams = build_streams(pdf, args.cover_year, args.source)
        scheme = build_scheme(pdf, args.cover_year, args.source)

    for name, payload in [
        ("districts.json", build_districts()),
        ("streams.json", streams),
        ("scheme.json", scheme),
    ]:
        (out / name).write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n")
        print(f"wrote {name}")

    for stream in streams["streams"]:
        print(f"  {stream['key']}: {len(stream['subjects'])} subjects")
    print(f"  scheme: {len(scheme['rules'])} rules found, {len(scheme['notFound'])} not in the document")


if __name__ == "__main__":
    main()
