"""Builds the Zotero starter library (.ris and .bib).

**Every entry below was verified by opening its source while this file was
written.** Nothing is included on memory or inference. That rule is the whole
point of the file: a starter library whose entries do not resolve is worse than
no library, because the student trusts it and the marker checks it.

Two formats because Zotero imports RIS and most students meet BibTeX later if
they touch LaTeX; the same records, so a citation is identical either way.

Sources that could not be opened at generation time are NOT here. Several Sri
Lankan government sites (the Department of Census and Statistics, the UGC, the
NIE) refused the request, so they are named in the guides as places to look
rather than shipped as citations nobody checked.

Run: python3 scripts/packs/zotero-library.py <outDir>
"""

import sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "."

# Each record carries the URL that was fetched and what it confirmed, so the
# next person to touch this file can re-check it in one click.
ENTRIES = [
    {
        "key": "kelegama2009",
        "type": "book",
        "ris_type": "BOOK",
        "title": "Sri Lanka economy in transition",
        "authors": ["Kelegama, Jayantha B."],
        "year": "2009",
        "publisher": "Vijitha Yapa Publications",
        "place": "Colombo",
        "isbn": "978-955-665-052-5",
        "verified": "openlibrary.org search record: publisher, year and ISBN",
    },
    {
        "key": "sriyalatha2025digital",
        "type": "article",
        "ris_type": "JOUR",
        "title": "Capturing a digital economy measurement framework for Sri Lanka",
        "authors": [
            "Sriyalatha, M. A. K.",
            "Lalanie, P. P.",
            "Withanawasam, M. P. K.",
        ],
        "year": "2025",
        "journal": "Sri Lanka Journal of Social Sciences",
        "volume": "48",
        "issue": "2",
        "pages": "3-12",
        "doi": "10.4038/sljss.v48i02.9634",
        "url": "https://doi.org/10.4038/sljss.v48i02.9634",
        "verified": "sljss.sljol.info volume 48 issue 2 contents",
    },
    {
        "key": "kulathunga2025foodwaste",
        "type": "article",
        "ris_type": "JOUR",
        "title": (
            "Household food waste and its relationship with consumer demographics "
            "and behaviour: A case study from Kegalle District, Sri Lanka"
        ),
        "authors": [
            "Kulathunga, Gamaralalage Akila Sudesh",
            "Wanniarachchi, Piyumi Chathurangi",
            "Silva, Sashini",
            "Abeysundara, Piumi De Abrew",
        ],
        "year": "2025",
        "journal": "Sri Lanka Journal of Social Sciences",
        "volume": "48",
        "issue": "2",
        "pages": "29-41",
        "doi": "10.4038/sljss.v48i02.8760",
        "url": "https://doi.org/10.4038/sljss.v48i02.8760",
        "verified": "sljss.sljol.info volume 48 issue 2 contents",
    },
    {
        "key": "desilva2025municipal",
        "type": "article",
        "ris_type": "JOUR",
        "title": (
            "A forgotten piece of history: The story of the first Municipal Council "
            "of Colombo, Sri Lanka"
        ),
        "authors": ["de Silva, Chandra Richard"],
        "year": "2025",
        "journal": "Sri Lanka Journal of Social Sciences",
        "volume": "48",
        "issue": "2",
        "pages": "43-51",
        "doi": "10.4038/sljss.v48i02.9220",
        "url": "https://doi.org/10.4038/sljss.v48i02.9220",
        "verified": "sljss.sljol.info volume 48 issue 2 contents",
    },
    {
        "key": "rajapaksha2026transport",
        "type": "article",
        "ris_type": "JOUR",
        "title": (
            "Multiplex centrality-driven analysis for enhancing urban transport "
            "resilience and infrastructure planning"
        ),
        "authors": [
            "Rajapaksha, R. W. K. T.",
            "Lanel, G. J.",
            "Athapattu, A. M. C. U. M.",
            "Sanjeewa, R.",
        ],
        "year": "2026",
        "journal": "Ceylon Journal of Science",
        "volume": "55",
        "issue": "4",
        "pages": "1224-1237",
        "doi": "10.4038/cjs.v55i4.9482",
        "url": "https://doi.org/10.4038/cjs.v55i4.9482",
        "verified": "cjs.sljol.info articles listing",
    },
    {
        "key": "cbsl2026review",
        "type": "report",
        "ris_type": "RPRT",
        "title": "Annual economic review 2025",
        "authors": ["Central Bank of Sri Lanka"],
        "year": "2026",
        "publisher": "Central Bank of Sri Lanka",
        "place": "Colombo",
        "url": "https://www.cbsl.gov.lk/en/publications/economic-and-financial-reports/annual-economic-review",
        "note": (
            "The Central Bank's Annual Report was discontinued after 2022 and replaced "
            "by this series. Check which one your source actually is."
        ),
        "verified": "cbsl.gov.lk annual economic review listing: title, year, publisher, 20 April 2026",
    },
    {
        "key": "sljol",
        "type": "web",
        "ris_type": "ELEC",
        "title": "Sri Lankan Journals Online",
        "authors": ["Sri Lankan Journals Online"],
        "year": "n.d.",
        "publisher": "National Science Foundation of Sri Lanka",
        "url": "https://sljol.info/",
        "note": "A database of journals published in Sri Lanka, across all disciplines. Start here for a Sri Lankan source.",
        "verified": "sljol.info home page: site name and managing organisation",
    },
]

HEADER_NOTE = (
    "Campus Survival Pack starter library - ictcampus.lk. "
    "Every entry here was checked against its source. "
    "Open a source yourself before you cite it."
)

# ---------------------------------------------------------------------------
# RIS
# ---------------------------------------------------------------------------
ris_lines = []
for e in ENTRIES:
    ris_lines.append(f"TY  - {e['ris_type']}")
    for author in e["authors"]:
        ris_lines.append(f"AU  - {author}")
    ris_lines.append(f"TI  - {e['title']}")
    if e["year"] != "n.d.":
        ris_lines.append(f"PY  - {e['year']}")
    if e.get("journal"):
        ris_lines.append(f"JO  - {e['journal']}")
    if e.get("volume"):
        ris_lines.append(f"VL  - {e['volume']}")
    if e.get("issue"):
        ris_lines.append(f"IS  - {e['issue']}")
    if e.get("pages"):
        start, _, end = e["pages"].partition("-")
        ris_lines.append(f"SP  - {start}")
        if end:
            ris_lines.append(f"EP  - {end}")
    if e.get("publisher"):
        ris_lines.append(f"PB  - {e['publisher']}")
    if e.get("place"):
        ris_lines.append(f"CY  - {e['place']}")
    if e.get("doi"):
        ris_lines.append(f"DO  - {e['doi']}")
    if e.get("isbn"):
        ris_lines.append(f"SN  - {e['isbn']}")
    if e.get("url"):
        ris_lines.append(f"UR  - {e['url']}")
    if e.get("note"):
        ris_lines.append(f"N1  - {e['note']}")
    ris_lines.append("ER  - ")
    ris_lines.append("")

with open(f"{OUT}/zotero-starter-library.ris", "w", encoding="utf-8") as fh:
    fh.write("\n".join(ris_lines))

# ---------------------------------------------------------------------------
# BibTeX
# ---------------------------------------------------------------------------
BIB_TYPE = {"book": "book", "article": "article", "report": "techreport", "web": "misc"}


def bib_field(name, value):
    return f"  {name} = {{{value}}},"


bib_lines = [f"% {HEADER_NOTE}", ""]
for e in ENTRIES:
    bib_lines.append(f"@{BIB_TYPE[e['type']]}{{{e['key']},")
    bib_lines.append(bib_field("title", e["title"]))
    bib_lines.append(bib_field("author", " and ".join(e["authors"])))
    if e["year"] != "n.d.":
        bib_lines.append(bib_field("year", e["year"]))
    if e.get("journal"):
        bib_lines.append(bib_field("journal", e["journal"]))
    if e.get("volume"):
        bib_lines.append(bib_field("volume", e["volume"]))
    if e.get("issue"):
        bib_lines.append(bib_field("number", e["issue"]))
    if e.get("pages"):
        bib_lines.append(bib_field("pages", e["pages"].replace("-", "--")))
    if e.get("publisher"):
        key = "institution" if e["type"] == "report" else "publisher"
        bib_lines.append(bib_field(key, e["publisher"]))
    if e.get("place"):
        bib_lines.append(bib_field("address", e["place"]))
    if e.get("doi"):
        bib_lines.append(bib_field("doi", e["doi"]))
    if e.get("isbn"):
        bib_lines.append(bib_field("isbn", e["isbn"]))
    if e.get("url"):
        bib_lines.append(bib_field("url", e["url"]))
    if e.get("note"):
        bib_lines.append(bib_field("note", e["note"]))
    bib_lines.append("}")
    bib_lines.append("")

with open(f"{OUT}/zotero-starter-library.bib", "w", encoding="utf-8") as fh:
    fh.write("\n".join(bib_lines))

print(f"wrote zotero-starter-library.ris and .bib ({len(ENTRIES)} verified entries)")
for e in ENTRIES:
    print(f"  {e['key']}: verified via {e['verified']}")
