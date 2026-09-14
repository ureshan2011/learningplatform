#!/usr/bin/env python3
"""
Turns the UGC cut-off PDFs into lib/content/ugc/cutoffs/<round>.json.

The tables are transposed from the shape the handoff asks for: the PDF puts one
row per district and one rotated column per course, so this reads that grid and
writes it out course-major.

Two things about these PDFs decide the whole approach:

  * Course headers are drawn with a 90-degree rotation matrix and read
    bottom-to-top, so their characters are ordered by DECREASING `top`.
    pdfplumber's own `upright` flag does not mark them; the matrix does.
  * There are no ruling lines to key a table off (0 lines, only fills), so cells
    are recovered by clustering character positions rather than by extract_table.

Usage: extract-cutoffs.py --pdf-dir DIR --out DIR [--round NAME] [--report FILE]
"""

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import pdfplumber

# The 25 districts, spelled as the UGC tables spell them.
DISTRICTS = [
    "COLOMBO", "GAMPAHA", "KALUTARA", "MATALE", "KANDY", "NUWARA ELIYA",
    "GALLE", "MATARA", "HAMBANTOTA", "JAFFNA", "KILINOCHCHI", "MANNAR",
    "MULLAITIVU", "VAVUNIYA", "BATTICALOA", "AMPARA", "TRINCOMALEE",
    "KURUNEGALA", "PUTTALAM", "ANURADHAPURA", "POLONNARUWA", "BADULLA",
    "MONARAGALA", "RATNAPURA", "KEGALLE",
]
DISTRICT_KEYS = {d: d.lower().replace(" ", "-") for d in DISTRICTS}
# Matched with all whitespace removed: the space inside "NUWARA ELIYA" is drawn
# as a blank character that falls out with the rest of the padding, so the cell
# arrives as "NUWARAELIYA".
DISTRICT_BY_SQUASH = {d.replace(" ", ""): d for d in DISTRICTS}

# A Z-score cell. The UGC prints four decimals; the plausible range is checked
# later by validate.mjs, not here — this only has to recognise the shape.
NUMBER = re.compile(r"^-?\d\.\d{2,4}$")
NQC = re.compile(r"^N\.?Q\.?C\.?$", re.I)


def cluster(values, tol):
    """Groups sorted numbers whose neighbours sit within `tol`."""
    groups = []
    for v in sorted(values):
        if groups and v - groups[-1][-1] <= tol:
            groups[-1].append(v)
        else:
            groups.append([v])
    return groups


def value_columns(chars, top_min):
    """
    The table's real columns, measured from the district rows.

    Headers are the fragile part of these PDFs — overlapping footnotes, garbled
    text layers, inconsistent spacing — but the numeric grid underneath is clean
    and identical on every row. So the columns are taken from the data and the
    header text is fitted to them afterwards, which is what makes the course
    count come out right instead of 40% short.
    """
    centres = []
    for row in body_rows(chars, top_min):
        label, values = take_district(row_cells(row))
        if not label:
            continue
        centres.extend((c["x0"] + c["x1"]) / 2 for c in values)
    if not centres:
        return []
    return [(min(g), max(g)) for g in cluster(centres, 6.0)]


def header_for_column(head, lo, hi):
    """
    The course name and university sitting above one column.

    Lines are sub-clustered inside the column's own width, so the name and the
    "(University of ...)" beneath it stay separate, and each is read
    bottom-to-top from the run nearest the table.
    """
    # Wide enough to reach the course name, which is drawn a little left of the
    # numbers it heads, and narrow enough not to reach the next column: these
    # tables space columns about 34 points apart.
    inside = [c for c in head if lo - 14 <= c["x0"] <= hi + 14]
    if not inside:
        return "", ""
    parts = []
    for band in cluster([c["x0"] for c in inside], 3.0):
        blo, bhi = min(band), max(band)
        group = [c for c in inside if blo - 0.1 <= c["x0"] <= bhi + 0.1]
        if len(group) < 3:
            continue
        text = nearest_run(group)
        if text:
            parts.append((blo, text))

    name, qualifiers = "", []
    for _, text in sorted(parts):
        if text[0] in "([" or not is_course_name(text):
            qualifiers.append(text)
        elif not name:
            name = clean_course(text)
        else:
            qualifiers.append(text)
    return name, " ".join(qualifiers).strip()


def header_columns(chars, top_max):
    """
    Course headers, left to right.

    Read from geometry, not from the rotation matrix. Half these PDFs set
    /Rotate 90 on the page, which flips which characters carry a rotation — but
    in the space pdfplumber presents, both layouts look the same: course names
    run vertically above the district block, reading bottom-to-top.

    Characters are clustered on x with a tolerance rather than an exact match:
    in the rotated files every character of one vertical line sits at a slightly
    different x, and rounding to whole points split one course name into sixty.

    A course is drawn as two or more lines at adjacent x — the name, then
    "(University of ...)" — so a line opening with a bracket continues the
    course before it.
    """
    # Spaces are kept here, unlike everywhere else: they are what separates
    # "University of Colombo" from "UniversityofColombo".
    head = [c for c in chars if c["top"] < top_max]
    if not head:
        return []

    lines = []
    for band in cluster([c["x0"] for c in head], 3.0):
        lo, hi = min(band), max(band)
        group = [c for c in head if lo - 0.1 <= c["x0"] <= hi + 0.1]
        # A vertical line of text is many characters inside a narrow x band. The
        # page title is horizontal and sprawls, so it fails this and is dropped.
        if len(group) < 6 or (hi - lo) > 12:
            continue
        text = nearest_run(group)
        if text:
            lines.append((lo, text))

    courses = []
    for x, text in sorted(lines):
        # "(University of ...)" and "[Commerce Stream]" are both continuations of
        # the course above them, not courses of their own.
        if text[0] in "([" and courses:
            courses[-1]["university"] = (courses[-1]["university"] + " " + text).strip()
        elif is_course_name(text):
            courses.append({"x": x, "course": clean_course(text), "university": ""})
    return courses


def nearest_run(group):
    """
    The one piece of text in this column that belongs to the table.

    A column often carries a footnote drawn at the same x, higher up the page,
    and reading the whole column top to bottom glues the two together —
    "APPLIED SCIENCES (BIO.SC)" arrives with the reversed tail of a footnote
    stuck to it. Characters inside one label are evenly spaced, so a gap several
    times the line spacing marks the join. Reading runs bottom-to-top from the
    table, so the run that starts nearest the district block is the header.
    """
    ordered = sorted(group, key=lambda c: -c["top"])
    gaps = [a["top"] - b["top"] for a, b in zip(ordered, ordered[1:])]
    if not gaps:
        return ordered[0]["text"].strip()

    # Measured from this column rather than fixed. A flat 8 points cut
    # "(University of Colombo)" down to "(University of Colo", because the gap
    # between two glyphs varies with the letters, and a truncated university
    # name stops the course joining to itself in the next round.
    typical = sorted(gaps)[len(gaps) // 2]
    limit = max(6.0, typical * 3)

    run = [ordered[0]]
    for prev, char in zip(ordered, ordered[1:]):
        if prev["top"] - char["top"] > limit:
            break
        run.append(char)
    return re.sub(r"\s+", " ", "".join(c["text"] for c in run)).strip()


def is_course_name(text):
    """
    Tells a course header from the scraps of a footnote.

    Footnotes sitting above the district block get sliced into short vertical
    runs of mixed case — "rtsIV", "ie24" — which otherwise arrive as courses with
    a full set of district values behind them. Course titles are set in capitals,
    so the case mix is what separates them.
    """
    letters = [c for c in text if c.isalpha()]
    if len(text) < 6 or len(letters) < 4:
        return False
    upper = sum(1 for c in letters if c.isupper())
    return upper / len(letters) >= 0.7


def clean_course(text):
    """Drops the footnote markers the UGC sets against some course titles."""
    return re.sub(r"\d+$", "", text).strip()


# Every institution the UGC admits to, as its tables name it. Longest first, so
# "University of Colombo School of Computing" is matched before the plain
# "University of Colombo" that sits inside it.
UNIVERSITIES = sorted(
    [
        "The Gampaha Wickramarachchi University of Indigenous Medicine, Sri Lanka",
        "Gampaha Wickramarachchi University of Indigenous Medicine, Sri Lanka",
        "Swami Vipulananda Institute of Aesthetic Studies",
        "University of the Visual & Performing Arts",
        "University of Colombo School of Computing",
        "South Eastern University of Sri Lanka",
        "Sabaragamuwa University of Sri Lanka",
        "University of Colombo - Sri Palee Campus",
        "University of Jaffna - Vavuniya Campus",
        "Eastern University - Trincomalee Campus",
        "Uva Wellassa University of Sri Lanka",
        "University of Sri Jayewardenepura",
        "Rajarata University of Sri Lanka",
        "Wayamba University of Sri Lanka",
        "University of Vavuniya, Sri Lanka",
        "Ramanathan Academy of Fine Arts",
        "Institute of Indigenous Medicine",
        "National Institute of Social Development",
        "Eastern University, Sri Lanka",
        "University of Peradeniya",
        "University of Moratuwa",
        "University of Kelaniya",
        "University of Ruhuna",
        "University of Jaffna",
        "University of Colombo",
    ],
    key=len,
    reverse=True,
)


# Spellings the UGC uses interchangeably across rounds. Folded to one name, or a
# course would not join to itself between the years that spell it differently.
ALIASES = {
    "University of Jayewardenepura": "University of Sri Jayewardenepura",
    "Gampaha Wickramarachchi University of Indigenous Medicine, Sri Lanka":
        "The Gampaha Wickramarachchi University of Indigenous Medicine, Sri Lanka",
}


def _letters(text):
    return re.sub(r"[^a-z]", "", text.lower())


def _match_prefix(pattern, text):
    """
    How much of `pattern` appears in `text` in order, and how far it had to
    reach to find it. Returns (letters matched, characters spanned).

    A prefix rather than the whole name, because these headers are truncated as
    often as they are interleaved: "(University of the Visual & Perfor" is the
    whole of what the PDF gives for a real institution.
    """
    i = 0
    span = 0
    for pos, ch in enumerate(text):
        if ch == pattern[i]:
            i += 1
            span = pos + 1
            if i == len(pattern):
                break
    return i, span


def canonical_university(raw):
    """
    The institution this column belongs to, recovered from a noisy string.

    Some of these PDFs draw a course title and a university label at the same x,
    so the two arrive interleaved character by character —
    "MUnAiNveArsGitEy MofE NRTuhuna" is "MANAGEMENT" and "University of Ruhuna"
    on top of each other. Matching each known institution as a subsequence pulls
    the university back out, where cleaning the string character by character
    cannot. The density limit stops a short name matching scattered letters of
    something else entirely.
    """
    text = _letters(raw)
    if not text:
        return ""

    best = None
    for name in UNIVERSITIES:
        pattern = _letters(name)
        matched, span = _match_prefix(pattern, text)
        # Enough of the name to be sure which institution it is, found without
        # ranging so far through the string that the letters are coincidence.
        if matched < min(len(pattern), 14) or span > matched * 2.5:
            continue
        # Most of the name matched wins; between two that matched equally, the
        # shorter institution, so "University of Colombo" is not read as
        # "University of Colombo School of Computing" on a truncated string.
        score = (matched, -len(pattern))
        if best is None or score > best[0]:
            best = (score, name)
    return ALIASES.get(best[1], best[1]) if best else ""


def body_rows(chars, top_min):
    """District rows: every character below the header, clustered into lines."""
    body = [c for c in chars if c["text"].strip() and c["top"] >= top_min]
    if not body:
        return []
    rows = []
    for band in cluster([c["top"] for c in body], 4):
        lo, hi = min(band), max(band)
        rows.append(
            sorted(
                [c for c in body if lo - 0.5 <= c["top"] <= hi + 0.5],
                key=lambda c: c["x0"],
            )
        )
    return rows


def take_district(cells):
    """
    Splits a row's leading cells into its district label and its values.

    "NUWARA ELIYA" is the reason this is not just `cells[0]`: the gap inside the
    name is wider than the gap between some cells, so the label can arrive split.
    """
    for take in (2, 1):
        if len(cells) < take:
            continue
        squashed = "".join(c["text"] for c in cells[:take]).upper()
        squashed = re.sub(r"\s+", "", squashed)
        if squashed in DISTRICT_BY_SQUASH:
            return DISTRICT_BY_SQUASH[squashed], cells[take:]
    return None, cells


def row_cells(chars, gap=2.0):
    """Splits one row's characters into cells on horizontal gaps."""
    cells, current = [], []
    for c in chars:
        if current and c["x0"] - current[-1]["x1"] > gap:
            cells.append(current)
            current = []
        current.append(c)
    if current:
        cells.append(current)
    return [
        {
            "text": "".join(ch["text"] for ch in cell).strip(),
            "x0": cell[0]["x0"],
            "x1": cell[-1]["x1"],
        }
        for cell in cells
    ]


def district_band(chars):
    """
    Where the district block starts.

    Found by the districts themselves rather than by a fixed offset, because the
    two page orientations put the header at different heights. The top of the
    first row whose leading cells name a district is the boundary.
    """
    tops = []
    for band in cluster([c["top"] for c in chars if c["text"].strip()], 4):
        lo, hi = min(band), max(band)
        row = sorted(
            [c for c in chars if lo - 0.5 <= c["top"] <= hi + 0.5 and c["text"].strip()],
            key=lambda c: c["x0"],
        )
        label, _ = take_district(row_cells(row))
        if label:
            tops.append(lo)
    return min(tops) if tops else None


def label_column_right(chars, top_min):
    """Right edge of the district-name column, from the labels themselves."""
    edges = []
    for row in body_rows(chars, top_min):
        cells = row_cells(row)
        label, rest = take_district(cells)
        if label and rest:
            edges.append(rest[0]["x0"])
    # Just inside the first value column, so a course header sitting above that
    # column is kept and the corner label is not.
    return min(edges) - 4 if edges else 0


def extract_page(page):
    """One page: {district -> {course_index -> value}} plus the page's courses."""
    chars = page.chars
    top_min = district_band(chars)
    if top_min is None:
        return None

    columns = value_columns(chars, top_min)
    if not columns:
        return None

    head = [c for c in chars if c["top"] < top_min - 2]
    courses = []
    for lo, hi in columns:
        name, qualifier = header_for_column(head, lo, hi)
        courses.append({"course": name, "university": qualifier, "x": lo})

    # A course offered by several universities is titled once, in a cell spanning
    # the whole group, so only its first column carries the name. Carrying the
    # last name forward is what the eye does reading the printed table.
    last = ""
    for course in courses:
        if course["course"]:
            last = course["course"]
        elif last:
            course["course"] = last
            course["inheritedTitle"] = True

    table = {}
    for row in body_rows(chars, top_min):
        label, values_cells = take_district(row_cells(row))
        if not label:
            continue
        values = {}
        for cell in values_cells:
            mid = (cell["x0"] + cell["x1"]) / 2
            for i, (lo, hi) in enumerate(columns):
                if lo - 6 <= mid <= hi + 6:
                    values[i] = cell["text"]
                    break
        table[label] = values
    return {"courses": courses, "table": table}


def extract_round(pdf_path):
    """Every page of one round, merged into course-major rows."""
    rows = []
    problems = []
    with pdfplumber.open(pdf_path) as pdf:
        for pageno, page in enumerate(pdf.pages, start=1):
            try:
                got = extract_page(page)
            except Exception as exc:  # noqa: BLE001 - reported, never fatal
                problems.append(f"page {pageno}: {exc}")
                continue
            if not got:
                continue
            courses, table = got["courses"], got["table"]
            if not table:
                problems.append(f"page {pageno}: headers but no district rows")
                continue
            for i, course in enumerate(courses):
                districts = {}
                for district, values in table.items():
                    raw = values.get(i, "").strip()
                    if NUMBER.match(raw):
                        districts[DISTRICT_KEYS[district]] = float(raw)
                    elif NQC.match(raw) or raw == "":
                        districts[DISTRICT_KEYS[district]] = "NQC"
                    else:
                        districts[DISTRICT_KEYS[district]] = "NQC"
                        problems.append(
                            f"page {pageno}: unreadable cell {raw!r} "
                            f"for {course['course'][:30]!r} / {district}"
                        )
                university = canonical_university(course["university"])
                if not university and course["university"]:
                    problems.append(
                        f"page {pageno}: no known institution in "
                        f"{course['university'][:60]!r} for {course['course'][:30]!r}"
                    )
                rows.append(
                    {
                        "course": course["course"],
                        "university": university,
                        # Kept only when the institution could not be resolved,
                        # so the gap can be inspected rather than guessed at.
                        **(
                            {"universityRaw": course["university"]}
                            if not university and course["university"]
                            else {}
                        ),
                        "page": pageno,
                        "districts": districts,
                    }
                )
    return rows, problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--sources", default=None)
    ap.add_argument("--report", default=None)
    args = ap.parse_args()

    here = Path(__file__).parent
    sources = json.loads(Path(args.sources or here / "sources.json").read_text())
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    summary = []
    for source in sources["cutoffs"]:
        if not source.get("series"):
            continue
        name = source["round"]
        pdf_path = Path(args.pdf_dir) / f"{name}.pdf"
        if not pdf_path.exists():
            summary.append({"round": name, "error": "pdf missing - run fetch.mjs"})
            continue

        rows, problems = extract_round(pdf_path)
        complete = [r for r in rows if len(r["districts"]) == len(DISTRICTS)]
        numeric = [
            v for r in rows for v in r["districts"].values() if isinstance(v, float)
        ]

        payload = {
            "round": name,
            "coverYear": source["coverYear"],
            "source": source["url"],
            "rows": rows,
        }
        (out_dir / f"{name}.json").write_text(
            json.dumps(payload, indent=1, ensure_ascii=False) + "\n"
        )

        summary.append(
            {
                "round": name,
                "rows": len(rows),
                "rowsWith25Districts": len(complete),
                "numericCells": len(numeric),
                "nqcCells": sum(
                    1 for r in rows for v in r["districts"].values() if v == "NQC"
                ),
                "min": round(min(numeric), 4) if numeric else None,
                "max": round(max(numeric), 4) if numeric else None,
                "problems": problems[:20],
                "problemCount": len(problems),
            }
        )
        print(
            f"{name}: {len(rows)} courses, {len(complete)} with 25 districts, "
            f"{len(numeric)} numeric, {len(problems)} problems"
        )

    if args.report:
        Path(args.report).write_text(json.dumps(summary, indent=2) + "\n")
        print(f"\nreport -> {args.report}")

    if any(s.get("error") for s in summary):
        sys.exit(1)


if __name__ == "__main__":
    main()
