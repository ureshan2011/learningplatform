"""Builds the survey design checklist (.pdf).

One A4 page, because a checklist that runs to three pages is a document and
gets read once. It is meant to be opened next to a half-built Google Form, so
every line is a thing to check rather than a thing to learn.

Run: python3 scripts/packs/survey-checklist.py <outDir>
"""

import sys

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

OUT = sys.argv[1] if len(sys.argv) > 1 else "."

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
COL_GAP = 8 * mm
COL_W = (PAGE_W - 2 * MARGIN - COL_GAP) / 2

INK = HexColor("#1A1A1A")
GREY = HexColor("#555555")
RULE = HexColor("#CCCCCC")
ORANGE = HexColor("#E8722C")

SECTIONS = [
    (
        "Before you write a question",
        [
            "One sentence saying what the survey is for. If you cannot write it, do not build the form.",
            "Every question earns its place by answering that sentence. Delete the rest.",
            "Decide now how you will analyse each answer. A question you cannot analyse is a question you cannot use.",
        ],
    ),
    (
        "Who you ask",
        [
            "Say who your population is, exactly. 'Students' is not a population.",
            "Say how you reached them, and name it: convenience, snowball, random, stratified.",
            "Write down who your method leaves out. Every method leaves someone out.",
            "Decide your target number before you start, not after the responses stop.",
        ],
    ),
    (
        "Question order",
        [
            "Easy and factual first. Age and income near the end, never at the start.",
            "Group questions by topic. Jumping between topics loses people.",
            "Sensitive questions last, so abandoning the form still leaves you usable data.",
            "Nothing earlier in the form should teach the respondent the answer to something later.",
        ],
    ),
    (
        "Writing a question",
        [
            "One thing per question. 'Fast and reliable?' is two questions.",
            "No leading words. 'How good was...' assumes it was good.",
            "No jargon and no abbreviations your respondent would not use themselves.",
            "Every closed question needs an escape: 'Other', 'Prefer not to say', or 'Not applicable'.",
            "Check that answer options do not overlap and do cover everything.",
        ],
    ),
    (
        "Likert scales",
        [
            "Pick one scale and use it for the whole section. Mixing 5-point and 7-point invalidates comparison.",
            "Label every point, not just the two ends.",
            "Decide whether to include a middle point, and say why in your method.",
            "Keep the direction the same throughout, or your reversed items will be scored backwards.",
            "It is ordinal data. Report the median and the spread; justify any mean you report.",
        ],
    ),
    (
        "Consent and ethics",
        [
            "A consent line at the top: who you are, what it is for, how long it takes.",
            "Say whether it is anonymous. If you collect email addresses, it is not.",
            "Say what happens to the data and when it is deleted.",
            "Make participation clearly voluntary, and say they can stop at any point.",
            "If your university requires ethics approval, get it before you collect anything.",
        ],
    ),
    (
        "Pilot it",
        [
            "Give it to five people who are not in your group.",
            "Time them. If it takes longer than you said, fix the form, not the claim.",
            "Ask each one which question confused them. Something always does.",
            "Export the pilot responses and try your actual analysis on them.",
            "Fix the form, then delete the pilot responses before you go live.",
        ],
    ),
    (
        "Before you send it",
        [
            "Test the form on a phone. Most of your responses will come from one.",
            "Check required questions are the ones you meant to make required.",
            "Check the export: one row per response, one column per question.",
            "Keep a copy of the final questionnaire for your appendix.",
        ],
    ),
]


def draw():
    c = canvas.Canvas(f"{OUT}/survey-design-checklist.pdf", pagesize=A4)
    c.setTitle("Survey design checklist")
    c.setAuthor("ICT Campus")
    c.setSubject("A one-page checklist for designing a student survey")

    # Title
    y = PAGE_H - MARGIN
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(MARGIN, y - 4 * mm, "Survey design checklist")

    c.setFillColor(ORANGE)
    c.rect(MARGIN, y - 7.5 * mm, 16 * mm, 1.1 * mm, stroke=0, fill=1)

    c.setFillColor(GREY)
    c.setFont("Helvetica", 8.4)
    c.drawString(
        MARGIN,
        y - 13 * mm,
        "Open this beside your half-built form. Work down it before you send the survey to anybody.",
    )

    c.setFont("Helvetica", 7.2)
    c.drawRightString(PAGE_W - MARGIN, y - 4 * mm, "Campus Survival Pack")
    c.drawRightString(PAGE_W - MARGIN, y - 7.6 * mm, "ictcampus.lk")

    top = y - 20 * mm

    # Two columns, four sections each. Measured flow put five on the left and
    # three on the right, which left the right column half empty on an
    # otherwise full page; the split is fixed because the section list is.
    COLUMN_BREAK = 4
    col = 0
    cursor = top

    def wrapped(text, font, size, width):
        """Greedy wrap — reportlab has no paragraph flow on a raw canvas."""
        c.setFont(font, size)
        words, lines, line = text.split(), [], ""
        for word in words:
            trial = f"{line} {word}".strip()
            if c.stringWidth(trial, font, size) <= width:
                line = trial
            else:
                lines.append(line)
                line = word
        if line:
            lines.append(line)
        return lines

    for index, (heading, items) in enumerate(SECTIONS):
        if index == COLUMN_BREAK:
            col, cursor = 1, top
        x = MARGIN + col * (COL_W + COL_GAP)

        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 10.2)
        c.drawString(x, cursor, heading)
        cursor -= 2.2 * mm
        c.setStrokeColor(RULE)
        c.setLineWidth(0.4)
        c.line(x, cursor, x + COL_W, cursor)
        cursor -= 4 * mm

        for item in items:
            box_y = cursor - 0.6 * mm
            c.setStrokeColor(HexColor("#999999"))
            c.setLineWidth(0.5)
            c.rect(x, box_y, 2.7 * mm, 2.7 * mm, stroke=1, fill=0)

            c.setFillColor(INK)
            for i, line in enumerate(wrapped(item, "Helvetica", 8.5, COL_W - 5.5 * mm)):
                c.setFont("Helvetica", 8.5)
                c.drawString(x + 5.5 * mm, cursor + (0 if i == 0 else 0) - i * 3.75 * mm, line)
            cursor -= len(wrapped(item, "Helvetica", 8.5, COL_W - 5.5 * mm)) * 3.75 * mm + 1.6 * mm

        cursor -= 4.2 * mm

    # Footer
    c.setFillColor(GREY)
    c.setFont("Helvetica", 6.6)
    c.drawString(
        MARGIN,
        MARGIN - 4 * mm,
        "Campus Survival Pack - ictcampus.lk. Drafted with AI and reviewed by Dr. Yasas Sri Wickramasinghe. "
        "Not accredited by any university.",
    )

    c.showPage()
    c.save()


draw()
print("wrote survey-design-checklist.pdf")
