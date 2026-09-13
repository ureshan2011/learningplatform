"""Builds the assignment planner (.xlsx).

The whole file is one idea: type your due date into one cell and everything
else moves. Milestones are formulas against that date, not a list the student
has to recalculate by hand every time a deadline shifts — which is exactly when
a hand-made plan gets abandoned.

Every computed cell is a real formula. Nothing here is a typed-in result, so
changing the due date or the word budget updates the whole sheet.

Run: python3 scripts/packs/assignment-planner.py <outDir>
"""

import sys
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT = sys.argv[1] if len(sys.argv) > 1 else "."

INK = "1A1A1A"
HEAD_FILL = PatternFill("solid", fgColor="EFEFEF")
INPUT_FILL = PatternFill("solid", fgColor="FFF4E5")
THIN = Side(style="thin", color="D0D0D0")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

H1 = Font(bold=True, size=14, color=INK)
H2 = Font(bold=True, size=11, color=INK)
NOTE = Font(italic=True, size=10, color="666666")


def style_header(ws, row, last_col):
    for col in range(1, last_col + 1):
        cell = ws.cell(row=row, column=col)
        cell.font = H2
        cell.fill = HEAD_FILL
        cell.border = BOX
        cell.alignment = Alignment(vertical="center", wrap_text=True)


def widths(ws, spec):
    for col, width in spec.items():
        ws.column_dimensions[col].width = width


wb = Workbook()

# --------------------------------------------------------------------------
# Plan — the only sheet most students will open
# --------------------------------------------------------------------------
plan = wb.active
plan.title = "Plan"
widths(plan, {"A": 34, "B": 14, "C": 13, "D": 44})

plan["A1"] = "Assignment planner"
plan["A1"].font = H1
plan["A2"] = "Fill in the four orange cells. Everything else works itself out."
plan["A2"].font = NOTE

plan["A4"] = "Assignment title"
plan["A5"] = "Module code"
plan["A6"] = "Due date"
plan["A7"] = "Word limit"
for row in range(4, 8):
    plan.cell(row=row, column=1).font = H2
    cell = plan.cell(row=row, column=2)
    cell.fill = INPUT_FILL
    cell.border = BOX

plan["B4"] = "My assignment title"
plan["B5"] = "IS2011"
plan["B6"] = "=TODAY()+28"
plan["B6"].number_format = "yyyy-mm-dd"
plan["B7"] = 2000
plan["C6"] = '=IF(B6="","",TEXT(B6,"dddd"))'
plan["C6"].font = NOTE
plan["D7"] = "Check the brief: do references count towards the limit?"
plan["D7"].font = NOTE

plan["A9"] = "Days left"
plan["A9"].font = H2
plan["B9"] = "=IF(B6=\"\",\"\",B6-TODAY())"
plan["B9"].border = BOX
plan["C9"] = '=IF(B9="","",IF(B9<0,"Overdue",IF(B9<=3,"Very tight",IF(B9<=10,"Start now","In hand"))))'
plan["C9"].font = NOTE

# Milestones: each one a proportion of the run-up, counted back from the due date.
plan["A11"] = "Milestones"
plan["A11"].font = H1
plan["A12"] = "Step"
plan["B12"] = "Finish by"
plan["C12"] = "Days left"
plan["D12"] = "What done looks like"
style_header(plan, 12, 4)

# (label, fraction of the total run-up still remaining at this point, definition of done)
MILESTONES = [
    ("Read the brief and the rubric", 0.95,
     "Five things written down: the question, the word count, the due date, the style, the rubric."),
    ("Finish reading and note-taking", 0.60,
     "Every source you will cite is open in Zotero, read, and noted."),
    ("Outline with headings", 0.50,
     "Heading 1 and 2 typed into the template. No prose yet."),
    ("First draft done", 0.25,
     "Every section has words in it. Bad words are fine. No gaps."),
    ("Redraft against the rubric", 0.12,
     "Read the rubric line by line and fix what loses marks."),
    ("References checked", 0.07,
     "Every source opened once more. Every in-text citation is in the list, and the reverse."),
    ("Proofread and export to PDF", 0.03,
     "Read it aloud. Update the contents page. Export, then open the PDF and look at it."),
    ("Submit", 0.0,
     "Upload, then reopen the submission and confirm the right file is attached."),
]

start_row = 13
for i, (label, remaining, done) in enumerate(MILESTONES):
    row = start_row + i
    plan.cell(row=row, column=1, value=label)
    # Counted back from the due date across the whole run-up, so a deadline
    # moved a week out spreads every milestone rather than only the last one.
    plan.cell(
        row=row,
        column=2,
        value=f'=IF($B$6="","",$B$6-ROUND(MAX($B$6-TODAY(),0)*{remaining},0))',
    ).number_format = "yyyy-mm-dd"
    plan.cell(row=row, column=3, value=f'=IF(B{row}="","",B{row}-TODAY())')
    plan.cell(row=row, column=4, value=done)
    for col in range(1, 5):
        plan.cell(row=row, column=col).border = BOX
        plan.cell(row=row, column=col).alignment = Alignment(vertical="top", wrap_text=True)

plan.cell(row=start_row + len(MILESTONES) + 1, column=1,
          value="Dates move with the due date. If you are already past a milestone, do it today.").font = NOTE

# --------------------------------------------------------------------------
# Word budget
# --------------------------------------------------------------------------
words = wb.create_sheet("Word budget")
widths(words, {"A": 30, "B": 12, "C": 14, "D": 14, "E": 40})

words["A1"] = "Word budget"
words["A1"].font = H1
words["A2"] = "Change the percentages if your brief says otherwise. They should total 100."
words["A2"].font = NOTE

words["A4"] = "Section"
words["B4"] = "Share"
words["C4"] = "Words"
words["D4"] = "Written"
words["E4"] = "Note"
style_header(words, 4, 5)

SECTIONS = [
    ("Introduction", 0.10, "What the question is and how you will answer it."),
    ("Background / literature", 0.25, "What is already known, cited."),
    ("Method or approach", 0.15, "What you did, so someone could repeat it."),
    ("Findings", 0.20, "What you found. Figures and tables belong here."),
    ("Discussion", 0.20, "What it means. This is where analysis marks are."),
    ("Conclusion", 0.10, "The answer, in a paragraph. Nothing new."),
]

for i, (name, share, note) in enumerate(SECTIONS):
    row = 5 + i
    words.cell(row=row, column=1, value=name)
    words.cell(row=row, column=2, value=share).number_format = "0%"
    words.cell(row=row, column=3, value=f"=ROUND(Plan!$B$7*B{row},0)")
    words.cell(row=row, column=4, value=0)
    words.cell(row=row, column=5, value=note)
    for col in range(1, 6):
        words.cell(row=row, column=col).border = BOX
    words.cell(row=row, column=4).fill = INPUT_FILL

total_row = 5 + len(SECTIONS)
words.cell(row=total_row, column=1, value="Total").font = H2
words.cell(row=total_row, column=2, value=f"=SUM(B5:B{total_row - 1})").number_format = "0%"
words.cell(row=total_row, column=3, value=f"=SUM(C5:C{total_row - 1})")
words.cell(row=total_row, column=4, value=f"=SUM(D5:D{total_row - 1})")
words.cell(
    row=total_row,
    column=5,
    value=f'=IF(SUM(B5:B{total_row - 1})<>1,"Your shares do not add up to 100%.",'
          f'IF(D{total_row}>Plan!$B$7,"Over the word limit.",'
          f'"Under the limit by "&(Plan!$B$7-D{total_row})&" words."))',
)
for col in range(1, 6):
    words.cell(row=total_row, column=col).border = BOX

# --------------------------------------------------------------------------
# Checklist
# --------------------------------------------------------------------------
check = wb.create_sheet("Before you submit")
widths(check, {"A": 10, "B": 76})

check["A1"] = "Before you submit"
check["A1"].font = H1
check["A2"] = "Pick Yes or No in column A. Do not submit while anything says No."
check["A2"].font = NOTE

check["A4"] = "Done?"
check["B4"] = "Check"
style_header(check, 4, 2)

CHECKS = [
    "The file is a PDF, unless the brief asked for Word.",
    "The file name has my index number and the module code in it.",
    "The cover page is filled in and the word count is on it.",
    "The contents page has been updated (right-click, Update entire table).",
    "Every figure and table has a number and a caption, and is referred to in the text.",
    "Every in-text citation appears in the reference list.",
    "Every reference-list entry is cited somewhere in the text.",
    "I opened every source I cite, myself.",
    "The reference list is alphabetical by surname and is not numbered.",
    "I have read the whole thing once, out loud.",
    "I opened the exported PDF and looked at every page.",
    "The AI-use declaration is attached, if my module asks for one.",
    "The submission page shows the file I meant to upload.",
]

yes_no = DataValidation(type="list", formula1='"Yes,No"', allow_blank=True)
check.add_data_validation(yes_no)

for i, item in enumerate(CHECKS):
    row = 5 + i
    cell = check.cell(row=row, column=1, value="No")
    cell.fill = INPUT_FILL
    cell.border = BOX
    cell.alignment = Alignment(horizontal="center")
    yes_no.add(cell)
    check.cell(row=row, column=2, value=item).border = BOX
    check.cell(row=row, column=2).alignment = Alignment(wrap_text=True, vertical="top")

last = 5 + len(CHECKS) - 1
summary = last + 2
check.cell(row=summary, column=1, value=f'=COUNTIF(A5:A{last},"Yes")&"/"&{len(CHECKS)}').font = H2
check.cell(
    row=summary,
    column=2,
    value=f'=IF(COUNTIF(A5:A{last},"Yes")={len(CHECKS)},"Ready to submit.","Still something to do.")',
).font = H2

for sheet in wb.worksheets:
    sheet.sheet_view.showGridLines = False
    sheet.freeze_panes = "A5"

wb.save(f"{OUT}/assignment-planner.xlsx")
print("wrote assignment-planner.xlsx")
