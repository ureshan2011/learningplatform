"""Builds the Excel practice workbook (.xlsx).

Shaped like Sri Lankan district data — 25 districts across 5 years — but the
numbers are **generated, not real**. That is stated on the first sheet, in the
sheet name, and in a note on the data sheet itself, because a student who takes
these figures into an assignment and cites them has been handed a much worse
problem than a missing dataset.

A fixed seed, so regenerating gives the same workbook and the worked answers on
the formulas sheet stay true.

Run: python3 scripts/packs/data-workbook.py <outDir>
"""

import random
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

OUT = sys.argv[1] if len(sys.argv) > 1 else "."

random.seed(20260913)

INK = "1A1A1A"
HEAD_FILL = PatternFill("solid", fgColor="EFEFEF")
WARN_FILL = PatternFill("solid", fgColor="FFF4E5")
THIN = Side(style="thin", color="D0D0D0")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
H1 = Font(bold=True, size=14, color=INK)
H2 = Font(bold=True, size=11, color=INK)
NOTE = Font(italic=True, size=10, color="666666")

YEARS = [2021, 2022, 2023, 2024, 2025]

# The 25 administrative districts, with their province. Names and the
# district-to-province mapping are real; every number below is invented.
DISTRICTS = [
    ("Colombo", "Western"), ("Gampaha", "Western"), ("Kalutara", "Western"),
    ("Kandy", "Central"), ("Matale", "Central"), ("Nuwara Eliya", "Central"),
    ("Galle", "Southern"), ("Matara", "Southern"), ("Hambantota", "Southern"),
    ("Jaffna", "Northern"), ("Kilinochchi", "Northern"), ("Mannar", "Northern"),
    ("Vavuniya", "Northern"), ("Mullaitivu", "Northern"),
    ("Batticaloa", "Eastern"), ("Ampara", "Eastern"), ("Trincomalee", "Eastern"),
    ("Kurunegala", "North Western"), ("Puttalam", "North Western"),
    ("Anuradhapura", "North Central"), ("Polonnaruwa", "North Central"),
    ("Badulla", "Uva"), ("Monaragala", "Uva"),
    ("Ratnapura", "Sabaragamuwa"), ("Kegalle", "Sabaragamuwa"),
]

DISCLAIMER = (
    "SYNTHETIC DATA — these numbers were generated for practice. "
    "They are not real statistics and must never be cited in an assignment."
)


def widths(ws, spec):
    for col, width in spec.items():
        ws.column_dimensions[col].width = width


def header_row(ws, row, values):
    for i, value in enumerate(values, start=1):
        cell = ws.cell(row=row, column=i, value=value)
        cell.font = H2
        cell.fill = HEAD_FILL
        cell.border = BOX
        cell.alignment = Alignment(vertical="center", wrap_text=True)


wb = Workbook()

# --------------------------------------------------------------------------
# Read me first
# --------------------------------------------------------------------------
intro = wb.active
intro.title = "Read me first"
widths(intro, {"A": 96})

intro["A1"] = "Excel practice workbook"
intro["A1"].font = H1

intro["A3"] = DISCLAIMER
intro["A3"].font = Font(bold=True, size=11, color="8A4B00")
intro["A3"].fill = WARN_FILL
intro["A3"].border = BOX
intro["A3"].alignment = Alignment(wrap_text=True, vertical="center")
intro.row_dimensions[3].height = 42

for i, line in enumerate(
    [
        "",
        "What is in here",
        "Synthetic data — 125 rows shaped like district statistics, one row per district per year.",
        "Formulas — SUM, AVERAGE, IF, VLOOKUP and XLOOKUP, each one worked, with the answer beside it.",
        "Pivot ready — the same data in tidy form, one row per observation, ready to select and insert a pivot table.",
        "What to try — eight exercises, hardest last.",
        "",
        "How to use it",
        "Open the Formulas sheet and read the formula bar, not just the answer. Then break one on purpose and see what happens.",
        "Do the exercises on the What to try sheet against the Pivot ready sheet.",
        "If a formula shows #NAME?, your Excel is older than XLOOKUP. Use the VLOOKUP row instead — both are shown.",
        "",
        "Why the data is fake",
        "Real district statistics change, and a workbook that ships with a copy of them teaches students to cite a spreadsheet instead of the source.",
        "For real numbers go to the Department of Census and Statistics, or the Central Bank's Annual Economic Review, and cite the publication itself.",
    ],
    start=4,
):
    cell = intro.cell(row=i, column=1, value=line)
    if line in ("What is in here", "How to use it", "Why the data is fake"):
        cell.font = H2
    elif line:
        cell.alignment = Alignment(wrap_text=True)

# --------------------------------------------------------------------------
# Synthetic data — the wide sheet, one row per district
# --------------------------------------------------------------------------
data = wb.create_sheet("Synthetic data")
widths(data, {"A": 16, "B": 16, **{get_column_letter(c): 13 for c in range(3, 9)}})

data["A1"] = "Synthetic district data"
data["A1"].font = H1
data["A2"] = DISCLAIMER
data["A2"].font = Font(bold=True, size=10, color="8A4B00")

header_row(data, 4, ["District", "Province", "Year", "Population", "Schools",
                     "Internet users (%)", "Households", "Avg. monthly income (Rs)"])

# Each district gets a stable base; years grow from it with a little noise.
bases = {}
for name, province in DISTRICTS:
    bases[name] = {
        "pop": random.randint(180_000, 2_400_000),
        "growth": random.uniform(0.004, 0.018),
        "schools": random.randint(120, 900),
        "internet": random.uniform(18.0, 62.0),
        "income": random.randint(38_000, 96_000),
    }

row = 5
for name, province in DISTRICTS:
    b = bases[name]
    for i, year in enumerate(YEARS):
        pop = int(b["pop"] * (1 + b["growth"]) ** i)
        households = int(pop / random.uniform(3.6, 4.4))
        internet = round(min(95.0, b["internet"] + i * random.uniform(1.5, 4.5)), 1)
        income = int(b["income"] * (1 + random.uniform(0.03, 0.11)) ** i)
        schools = b["schools"] + random.randint(-4, 9) * i

        for col, value in enumerate(
            [name, province, year, pop, schools, internet, households, income], start=1
        ):
            cell = data.cell(row=row, column=col, value=value)
            cell.border = BOX
            if col in (4, 5, 7, 8):
                cell.number_format = "#,##0"
            if col == 6:
                cell.number_format = "0.0"
        row += 1

LAST = row - 1

# --------------------------------------------------------------------------
# Formulas — each one worked, with the answer beside it
# --------------------------------------------------------------------------
f = wb.create_sheet("Formulas")
widths(f, {"A": 26, "B": 52, "C": 18, "D": 48})

f["A1"] = "The formulas you actually need"
f["A1"].font = H1
f["A2"] = "Column B shows the formula as text. Column C is the same formula, live. Click C and read the formula bar."
f["A2"].font = NOTE

header_row(f, 4, ["What it does", "The formula", "Live result", "When you use it"])

LOOKUP_DISTRICT = "Kegalle"
f["F4"] = "Lookup district"
f["F4"].font = H2
f["F5"] = LOOKUP_DISTRICT
f["F5"].fill = WARN_FILL
f["F5"].border = BOX
f["F6"] = "Change F5 and the lookup rows below follow it."
f["F6"].font = NOTE

EXAMPLES = [
    ("Add a column up",
     f"=SUM('Synthetic data'!D5:D{LAST})",
     "Total population across every district and year. Rarely meaningful — but this is the formula."),
    ("Average",
     f"=AVERAGE('Synthetic data'!F5:F{LAST})",
     "Mean internet-user percentage across all rows."),
    ("Count rows",
     f"=COUNTA('Synthetic data'!A5:A{LAST})",
     "How many observations you actually have. Run this before you trust any average."),
    ("Count matching one thing",
     "=COUNTIF('Synthetic data'!B5:B{last},\"Western\")".format(last=LAST),
     "How many rows are Western Province."),
    ("Add up matching one thing",
     f"=SUMIF('Synthetic data'!C5:C{LAST},2025,'Synthetic data'!D5:D{LAST})",
     "Total population in 2025 only. SUMIF is the one that turns a long sheet into an answer."),
    ("Average matching one thing",
     f"=AVERAGEIF('Synthetic data'!B5:B{LAST},\"Southern\",'Synthetic data'!H5:H{LAST})",
     "Mean income in Southern Province."),
    ("Add up matching two things",
     f"=SUMIFS('Synthetic data'!D5:D{LAST},'Synthetic data'!B5:B{LAST},\"Central\",'Synthetic data'!C5:C{LAST},2025)",
     "Central Province, 2025 only. SUMIFS takes as many conditions as you need."),
    ("A decision",
     "=IF(C6>50,\"Above half\",\"Below half\")",
     "IF returns one thing or the other. C6 is the average internet percentage, on the Average row above."),
    ("A decision with three outcomes",
     "=IF(C6>=60,\"High\",IF(C6>=35,\"Medium\",\"Low\"))",
     "Nesting IF inside IF. Readable up to about three; past that use IFS."),
    ("VLOOKUP",
     f"=VLOOKUP($F$5,'Synthetic data'!A5:H{LAST},4,FALSE)",
     "First matching row's population. FALSE means exact match — leave it out and VLOOKUP lies quietly."),
    ("XLOOKUP",
     f"=XLOOKUP($F$5,'Synthetic data'!A5:A{LAST},'Synthetic data'!D5:D{LAST})",
     "Same answer, newer formula. Looks left as well as right, and does not break when a column is inserted."),
    ("XLOOKUP with a fallback",
     f"=XLOOKUP($F$5,'Synthetic data'!A5:A{LAST},'Synthetic data'!H5:H{LAST},\"Not found\")",
     "The fourth argument is what to show when there is no match. Always give it one."),
    ("Highest value",
     f"=MAX('Synthetic data'!H5:H{LAST})",
     "The largest monthly income in the sheet."),
    ("Which row is highest",
     f"=INDEX('Synthetic data'!A5:A{LAST},MATCH(MAX('Synthetic data'!H5:H{LAST}),'Synthetic data'!H5:H{LAST},0))",
     "INDEX and MATCH together answer 'which one', not just 'how much'."),
    ("Round a number",
     "=ROUND(C6,1)",
     "One decimal place. Round for display, never in the middle of a calculation."),
    ("Percentage of a total",
     f"=SUMIF('Synthetic data'!C5:C{LAST},2025,'Synthetic data'!D5:D{LAST})/SUM('Synthetic data'!D5:D{LAST})",
     "Format the cell as a percentage rather than multiplying by 100."),
]

for i, (what, formula, when) in enumerate(EXAMPLES):
    r = 5 + i
    f.cell(row=r, column=1, value=what)
    # The text copy is prefixed with an apostrophe so Excel shows it rather
    # than evaluating it — the point is to read the formula, not the answer.
    f.cell(row=r, column=2, value=formula).alignment = Alignment(wrap_text=True, vertical="top")
    f.cell(row=r, column=2).number_format = "@"
    f.cell(row=r, column=3, value=formula)
    f.cell(row=r, column=4, value=when).alignment = Alignment(wrap_text=True, vertical="top")
    for col in range(1, 5):
        f.cell(row=r, column=col).border = BOX

# Column B has to *show* the formula rather than run it. openpyxl types any
# string beginning with "=" as a formula, so the cell type is forced back to
# string afterwards — the apostrophe trick only works when typing into Excel
# by hand, and stored literally it would show up as a stray apostrophe.
for i in range(len(EXAMPLES)):
    cell = f.cell(row=5 + i, column=2)
    cell.value = EXAMPLES[i][1]
    cell.data_type = "s"

# --------------------------------------------------------------------------
# Pivot ready — tidy, one row per observation
# --------------------------------------------------------------------------
tidy = wb.create_sheet("Pivot ready")
widths(tidy, {"A": 16, "B": 16, "C": 10, "D": 24, "E": 16})

tidy["A1"] = "Tidy data, ready for a pivot table"
tidy["A1"].font = H1
tidy["A2"] = "One row per observation, one column per variable. This shape is what a pivot table needs."
tidy["A2"].font = NOTE
tidy["A3"] = "Select A5 and press Ctrl+A, then Insert, PivotTable."
tidy["A3"].font = NOTE

header_row(tidy, 5, ["District", "Province", "Year", "Measure", "Value"])

MEASURES = [
    ("Population", 4, "#,##0"),
    ("Schools", 5, "#,##0"),
    ("Internet users (%)", 6, "0.0"),
    ("Households", 7, "#,##0"),
    ("Avg. monthly income (Rs)", 8, "#,##0"),
]

trow = 6
for src in range(5, LAST + 1):
    district = data.cell(row=src, column=1).value
    province = data.cell(row=src, column=2).value
    year = data.cell(row=src, column=3).value
    for label, col, fmt in MEASURES:
        tidy.cell(row=trow, column=1, value=district)
        tidy.cell(row=trow, column=2, value=province)
        tidy.cell(row=trow, column=3, value=year)
        tidy.cell(row=trow, column=4, value=label)
        value = tidy.cell(row=trow, column=5, value=data.cell(row=src, column=col).value)
        value.number_format = fmt
        trow += 1

# --------------------------------------------------------------------------
# What to try
# --------------------------------------------------------------------------
try_sheet = wb.create_sheet("What to try")
widths(try_sheet, {"A": 6, "B": 74, "C": 34})

try_sheet["A1"] = "What to try"
try_sheet["A1"].font = H1
try_sheet["A2"] = "In order. Do them on the Pivot ready sheet unless it says otherwise."
try_sheet["A2"].font = NOTE

header_row(try_sheet, 4, ["#", "Exercise", "What you should end up with"])

EXERCISES = [
    ("Sort the Synthetic data sheet by income, largest first.",
     "Data, Sort. Kegalle is not top."),
    ("On Synthetic data, freeze the header row so it stays visible while you scroll.",
     "View, Freeze Panes, Freeze Top Row."),
    ("Use SUMIF to total the population of Western Province in 2025.",
     "One number. Use SUMIFS — it needs two conditions."),
    ("Make a pivot table: Province down the side, Year across the top, Value in the middle, filtered to Population.",
     "A 9 by 5 grid of numbers."),
    ("Add a column to Synthetic data: internet users as a count, not a percentage.",
     "= population * percentage / 100. Round it."),
    ("Use XLOOKUP to pull any district's 2025 income into a cell of its own.",
     "Change the district name and the number follows."),
    ("Chart the average internet percentage per year, across all districts.",
     "A line going up. Insert, Line chart."),
    ("Find which province had the largest increase in average income from 2021 to 2025.",
     "A pivot table, then a subtraction. There is more than one right way."),
]

for i, (task, answer) in enumerate(EXERCISES, start=1):
    r = 4 + i
    try_sheet.cell(row=r, column=1, value=i)
    try_sheet.cell(row=r, column=2, value=task).alignment = Alignment(wrap_text=True, vertical="top")
    try_sheet.cell(row=r, column=3, value=answer).alignment = Alignment(wrap_text=True, vertical="top")
    for col in range(1, 4):
        try_sheet.cell(row=r, column=col).border = BOX

for sheet in wb.worksheets:
    sheet.sheet_view.showGridLines = False

data.freeze_panes = "A5"
tidy.freeze_panes = "A6"

wb.save(f"{OUT}/excel-practice-workbook.xlsx")
print(f"wrote excel-practice-workbook.xlsx ({LAST - 4} data rows, {trow - 6} tidy rows)")
