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


# The handbook spells a few subjects two ways across its own pages. Folded, or
# a student sees the same subject twice in one list of toggles.
SUBJECT_ALIASES = {
    "Communication and Media Studies": "Communication & Media Studies",
    "Logic & Scientific Methods": "Logic & Scientific Method",
    "Information & Communication": "Information & Communication Technology",
}
# Not subjects: an "either/or" written into one cell of a two-column list.
SUBJECT_DROP = {"Mathematics/Combined Mathematics"}


def build_streams(courses, cover_year, source):
    """
    The seven streams, each with the A/L subjects its own courses ask for.

    Taken from `courses.json` rather than re-read from the PDF, so the subjects
    are the ones inside a course's own eligibility rules and nothing else.

    A subject has to be named by at least two courses to be offered as a toggle.
    That threshold is what separates a real A/L subject — every one of them is
    asked for repeatedly across the handbook — from the debris of a two-column
    list or a field of specialisation that slipped through. A toggle nobody's
    eligibility depends on is noise; a wrong one tells a student they cannot sit
    something they can.
    """
    per_subject_courses = {}
    per_stream = {key: set() for key, _ in STREAM_SECTIONS.values()}

    for course in courses:
        names = set()
        for raw in course.get("subjects", []):
            # The handbook sets these lists in two columns and the text layer
            # joins a row into one line, so a run of spaces is a column gap.
            for part in re.split(rf"[{BULLET}]|\s{{2,}}", raw):
                name = part.strip(" .;,")
                name = SUBJECT_ALIASES.get(name, name)
                if name and name not in SUBJECT_DROP:
                    names.add(name)
        for name in names:
            per_subject_courses.setdefault(name, set()).add(course["code"])
        for stream in course.get("streams", []):
            if stream in per_stream:
                per_stream[stream] |= names

    keep = {name for name, codes in per_subject_courses.items() if len(codes) >= 2}

    return {
        "coverYear": cover_year,
        "source": source,
        "note": (
            "Stream names are the handbook's own section headings. Subjects are "
            "the ones named inside the eligibility rules of that stream's courses, "
            "kept only where at least two courses ask for them — see "
            "scripts/campus-match/extract-reference.py for why the threshold is "
            "there. These are the subjects a student's eligibility actually turns "
            "on, not the Department of Examinations' full stream definitions, "
            "which are not in this document."
        ),
        "streams": [
            {
                "key": key,
                "name": label,
                "subjects": sorted(
                    name for name in per_stream[key] if name in keep
                ),
            }
            for key, label in STREAM_SECTIONS.values()
        ],
        "allSubjects": sorted(keep),
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
    ap.add_argument("--courses", required=True)
    ap.add_argument("--cover-year", default="2025/2026")
    ap.add_argument("--source", default="")
    args = ap.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    courses = json.loads(Path(args.courses).read_text())["courses"]
    with pdfplumber.open(args.pdf) as pdf:
        scheme = build_scheme(pdf, args.cover_year, args.source)
    streams = build_streams(courses, args.cover_year, args.source)

    for name, payload in [
        ("districts.json", build_districts()),
        ("streams.json", streams),
        ("scheme.json", scheme),
    ]:
        (out / name).write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n")
        print(f"wrote {name}")

    print(f"  {len(streams['allSubjects'])} subjects kept overall")
    for stream in streams["streams"]:
        print(f"  {stream['key']}: {len(stream['subjects'])} subjects")
    print(f"  scheme: {len(scheme['rules'])} rules found, {len(scheme['notFound'])} not in the document")


if __name__ == "__main__":
    main()
