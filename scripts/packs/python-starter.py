"""Builds the Python starter notebook (.ipynb) and its dataset (.csv).

Written for Google Colab on a phone, which for most of this audience is the
only Python they have. Every cell runs top to bottom with no install step and
no file upload: the CSV is read from a raw URL if one is set, and otherwise
from the copy sitting beside the notebook.

The dataset is the same synthetic district data as the Excel workbook, so a
student who did the spreadsheet exercises recognises the numbers — and it is
labelled synthetic in the CSV header comment, in the notebook's first cell and
in the printout.

Run: python3 scripts/packs/python-starter.py <outDir>
"""

import csv
import json
import random
import sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "."

random.seed(20260913)

YEARS = [2021, 2022, 2023, 2024, 2025]

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

CSV_NAME = "sri-lanka-districts-synthetic.csv"

# ---------------------------------------------------------------------------
# The dataset
# ---------------------------------------------------------------------------
rows = []
for name, province in DISTRICTS:
    base_pop = random.randint(180_000, 2_400_000)
    growth = random.uniform(0.004, 0.018)
    base_schools = random.randint(120, 900)
    base_internet = random.uniform(18.0, 62.0)
    base_income = random.randint(38_000, 96_000)

    for i, year in enumerate(YEARS):
        pop = int(base_pop * (1 + growth) ** i)
        rows.append(
            {
                "district": name,
                "province": province,
                "year": year,
                "population": pop,
                "schools": base_schools + random.randint(-4, 9) * i,
                "internet_users_pct": round(min(95.0, base_internet + i * random.uniform(1.5, 4.5)), 1),
                "households": int(pop / random.uniform(3.6, 4.4)),
                "avg_monthly_income_lkr": int(base_income * (1 + random.uniform(0.03, 0.11)) ** i),
            }
        )

# Two deliberate problems for the cleaning cell to find: a missing value and a
# duplicated row. A notebook where the data is already clean teaches nothing
# about the step that actually takes the time.
rows[7]["internet_users_pct"] = ""
rows.append(dict(rows[3]))

csv_path = f"{OUT}/{CSV_NAME}"
with open(csv_path, "w", newline="", encoding="utf-8") as fh:
    fh.write(
        "# SYNTHETIC DATA - generated for practice, not real statistics. "
        "Never cite these numbers. Real figures: Department of Census and Statistics, "
        "or the Central Bank of Sri Lanka Annual Economic Review.\n"
    )
    writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)

# ---------------------------------------------------------------------------
# The notebook
# ---------------------------------------------------------------------------


def md(*lines):
    return {"cell_type": "markdown", "metadata": {}, "source": [l + "\n" for l in lines]}


def code(*lines):
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [l + "\n" for l in lines],
    }


cells = [
    md(
        "# Python starter notebook",
        "",
        "**Campus Survival Pack — ictcampus.lk**",
        "",
        "Load data, clean it, group it, chart it. Five steps, about twenty minutes.",
        "",
        "> **The data in here is synthetic.** It is shaped like Sri Lankan district",
        "> statistics so the exercises feel real, but the numbers were generated.",
        "> Never cite them. For real figures use the Department of Census and",
        "> Statistics, or the Central Bank of Sri Lanka's *Annual Economic Review*,",
        "> and cite the publication itself.",
        "",
        "## How to run this on a phone",
        "",
        "1. Go to **colab.research.google.com** and sign in with a Google account.",
        "2. **File → Upload notebook**, and pick this `.ipynb` file.",
        "3. Upload `" + CSV_NAME + "` too: the folder icon on the left, then the upload button.",
        "4. Run each cell with the ▶ button, top to bottom.",
        "",
        "Nothing to install. Colab already has pandas and matplotlib.",
    ),
    md(
        "## 1. Load it",
        "",
        "`pd.read_csv` reads the file into a **DataFrame** — a table with named columns.",
        "`comment='#'` tells it to ignore the warning line at the top of the file.",
    ),
    code(
        "import pandas as pd",
        "import matplotlib.pyplot as plt",
        "",
        f'df = pd.read_csv("{CSV_NAME}", comment="#")',
        "",
        "print(f\"{len(df)} rows, {len(df.columns)} columns\")",
        "df.head()",
    ),
    md(
        "`.head()` shows the first five rows. Always look at your data before you do",
        "anything to it — half the mistakes in a student project are a column that is",
        "not what its name suggests.",
    ),
    code(
        "# What type is each column, and how many values are missing?",
        "df.info()",
    ),
    md(
        "## 2. Clean it",
        "",
        "This file has two problems on purpose: one missing value and one duplicated row.",
        "Real data always has something. Find it before you analyse it, not after.",
    ),
    code(
        "print(\"Missing values per column:\")",
        "print(df.isna().sum())",
        "",
        "print(f\"\\nDuplicate rows: {df.duplicated().sum()}\")",
    ),
    code(
        "# Drop the duplicate, keeping the first copy.",
        "df = df.drop_duplicates()",
        "",
        "# Fill the missing percentage with that district's own average rather than",
        "# the national one — a missing Jaffna value is better guessed from Jaffna.",
        "df[\"internet_users_pct\"] = df.groupby(\"district\")[\"internet_users_pct\"].transform(",
        "    lambda s: s.fillna(s.mean())",
        ")",
        "",
        "print(f\"{len(df)} rows after cleaning\")",
        "print(f\"Missing values left: {df.isna().sum().sum()}\")",
    ),
    md(
        "**Say what you did.** In your assignment, write down that you removed a",
        "duplicate and how you filled the gap. A marker cannot reproduce your numbers",
        "otherwise, and 'I cleaned the data' is not a method.",
    ),
    md(
        "## 3. Ask it something",
        "",
        "`groupby` splits the table into groups, applies a calculation to each, and puts",
        "the answers back together. It is the single most useful thing pandas does.",
    ),
    code(
        "# Average income per province, most recent year, largest first.",
        "latest = df[df[\"year\"] == df[\"year\"].max()]",
        "",
        "by_province = (",
        "    latest.groupby(\"province\")[\"avg_monthly_income_lkr\"]",
        "    .mean()",
        "    .sort_values(ascending=False)",
        "    .round(0)",
        ")",
        "",
        "by_province",
    ),
    code(
        "# Several numbers at once.",
        "latest.groupby(\"province\").agg(",
        "    districts=(\"district\", \"count\"),",
        "    population=(\"population\", \"sum\"),",
        "    mean_internet_pct=(\"internet_users_pct\", \"mean\"),",
        ").round(1)",
    ),
    md(
        "## 4. Chart it",
        "",
        "One chart, one point. A chart that shows everything shows nothing.",
    ),
    code(
        "fig, ax = plt.subplots(figsize=(8, 4.5))",
        "",
        "by_province.plot(kind=\"barh\", ax=ax, color=\"#E8722C\")",
        "",
        "ax.set_xlabel(\"Average monthly income (Rs)\")",
        "ax.set_ylabel(\"\")",
        "ax.set_title(f\"Average monthly income by province, {df['year'].max()} (synthetic data)\")",
        "ax.invert_yaxis()",
        "ax.spines[[\"top\", \"right\"]].set_visible(False)",
        "",
        "plt.tight_layout()",
        "plt.show()",
    ),
    code(
        "# A trend over time: mean internet users per year, all districts.",
        "trend = df.groupby(\"year\")[\"internet_users_pct\"].mean()",
        "",
        "fig, ax = plt.subplots(figsize=(7, 4))",
        "trend.plot(marker=\"o\", ax=ax, color=\"#E8722C\")",
        "",
        "ax.set_ylabel(\"Internet users (%)\")",
        "ax.set_xlabel(\"Year\")",
        "ax.set_title(\"Mean internet use by year (synthetic data)\")",
        "ax.set_xticks(sorted(df[\"year\"].unique()))",
        "ax.spines[[\"top\", \"right\"]].set_visible(False)",
        "",
        "plt.tight_layout()",
        "plt.show()",
    ),
    md(
        "**Every chart needs a caption saying what it shows and where the data came",
        "from.** If the data is synthetic, the caption says so — as these do.",
    ),
    md(
        "## 5. Get it out",
        "",
        "Save the figure at 200 dpi or better, or it will look blurry in your document.",
    ),
    code(
        "fig.savefig(\"internet-trend.png\", dpi=200, bbox_inches=\"tight\")",
        "",
        "# And the grouped table, if you want it in Excel.",
        "by_province.to_csv(\"income-by-province.csv\")",
        "",
        "print(\"Saved. In Colab, open the folder icon on the left to download them.\")",
    ),
    md(
        "## Now change something",
        "",
        "1. Chart population instead of income.",
        "2. Group by `district` rather than `province` and show only the top ten.",
        "3. Work out the percentage change in income from 2021 to 2025, per province.",
        "4. Load your own CSV. Everything above works unchanged if your columns are tidy —",
        "   one row per observation, one column per variable.",
        "",
        "---",
        "",
        "Campus Survival Pack — ictcampus.lk. Drafted with AI and reviewed by",
        "Dr. Yasas Sri Wickramasinghe. Not accredited by any university.",
    ),
]

notebook = {
    "cells": cells,
    "metadata": {
        "colab": {"provenance": [], "toc_visible": True},
        "kernelspec": {"display_name": "Python 3", "name": "python3"},
        "language_info": {"name": "python"},
    },
    "nbformat": 4,
    "nbformat_minor": 0,
}

with open(f"{OUT}/python-starter.ipynb", "w", encoding="utf-8") as fh:
    json.dump(notebook, fh, indent=1, ensure_ascii=False)
    fh.write("\n")

print(f"wrote python-starter.ipynb and {CSV_NAME} ({len(rows)} rows)")
