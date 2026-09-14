"""
The institutions the UGC admits to, and how to find one in a mangled string.

Shared by both extractors. The cut-off tables and the handbook name the same
universities, and two copies of this list would drift into two spellings of the
same institution — which is exactly what stops a course joining to itself.
"""

import re

# Longest first, so "University of Colombo School of Computing" is matched before
# the plain "University of Colombo" that sits inside it.
UNIVERSITIES = sorted(
    [
        "The Gampaha Wickramarachchi University of Indigenous Medicine, Sri Lanka",
        "Gampaha Wickramarachchi University of Indigenous Medicine, Sri Lanka",
        "Swami Vipulananda Institute of Aesthetic Studies",
        "University of the Visual & Performing Arts",
        "University of Colombo School of Computing",
        "National Institute of Social Development",
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


def letters(text):
    return re.sub(r"[^a-z]", "", text.lower())


def match_prefix(pattern, text):
    """
    How much of `pattern` appears in `text` in order, and how far it reached.

    A prefix rather than the whole name, because these headers are truncated as
    often as they are interleaved: "(University of the Visual & Perfor" is the
    whole of what one PDF gives for a real institution.
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
    The institution a noisy string names, or "" if none is recognisable.

    Some cut-off PDFs draw a course title and a university at the same x, so the
    two arrive interleaved character by character — "MUnAiNveArsGitEy MofE
    NRTuhuna" is "MANAGEMENT" and "University of Ruhuna" on top of each other.
    Matching each known institution as a subsequence pulls the university back
    out, where cleaning the string character by character cannot.
    """
    text = letters(raw)
    if not text:
        return ""

    best = None
    for name in UNIVERSITIES:
        pattern = letters(name)
        matched, span = match_prefix(pattern, text)
        if matched < min(len(pattern), 14) or span > matched * 2.5:
            continue
        # Most of the name matched wins; between two equal, the shorter name, so
        # a truncated "University of Colo" is not read as the School of Computing.
        score = (matched, -len(pattern))
        if best is None or score > best[0]:
            best = (score, name)
    return ALIASES.get(best[1], best[1]) if best else ""


def universities_mentioned(text):
    """
    Every institution named in a block of handbook prose, in the order given.

    Used instead of reading the labelled field, because the handbook sometimes
    merges "Degree Programmes & Available Universities" into one label and then
    interleaves degree names and universities down the lines beneath it.
    """
    found = []
    for name in sorted(UNIVERSITIES, key=len, reverse=True):
        if re.search(re.escape(name), text, re.I):
            canonical = ALIASES.get(name, name)
            if canonical not in found:
                found.append(canonical)
    return found
