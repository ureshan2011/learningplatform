# Campus Survival Pack — file generators

The seven downloads are generated here and committed under
`content-packs/campus-survival-pack/`, then uploaded by hand from
**Teacher console → Content**, kind **Pack**, one file per slot.

They are not in `public/`, and must not be: `lib/content/storage.ts` mints a
ten-minute signed URL for every download precisely so nothing on the bucket has
a stable public path.

## Running them

Two dependencies that are deliberately **not** in `package.json` or any
requirements file — these build a file that is generated once and uploaded, and
nothing the app serves imports them:

```
npm install --no-save docx
pip install openpyxl reportlab
```

Then, from the repository root:

```
node   scripts/packs/word-template.mjs      content-packs/campus-survival-pack
node   scripts/packs/ai-declaration.mjs     content-packs/campus-survival-pack
python3 scripts/packs/assignment-planner.py content-packs/campus-survival-pack
python3 scripts/packs/data-workbook.py      content-packs/campus-survival-pack
python3 scripts/packs/python-starter.py     content-packs/campus-survival-pack
python3 scripts/packs/zotero-library.py     content-packs/campus-survival-pack
python3 scripts/packs/survey-checklist.py   content-packs/campus-survival-pack
```

The two data generators use a fixed random seed, so re-running produces the
same numbers and the worked examples that reference them stay true.

## Which file goes in which slot

Slot keys come from `PACK_ITEMS` in `lib/content/survival-pack.ts`.

| Slot | File |
|---|---|
| `word-template` | `university-assignment-template.docx` |
| `assignment-planner` | `assignment-planner.xlsx` |
| `data-workbook` | `excel-practice-workbook.xlsx` |
| `python-starter` | `python-starter.ipynb` — upload `sri-lanka-districts-synthetic.csv` too, as a second Pack file with no slot; it appears under "More files" |
| `zotero-library` | `zotero-starter-library.ris` — `.bib` goes up the same way, unslotted |
| `ai-declaration` | `ai-use-declaration.docx` |
| `survey-checklist` | `survey-design-checklist.pdf` |

A slot with nothing uploaded shows "Coming soon" on the pack page rather than
an error, so uploading them one at a time is safe.

## Rules these files are held to

- **Every referencing example is a real source that was opened while it was
  written.** `zotero-library.py` records, per entry, which page was fetched to
  confirm it. A fabricated citation in a referencing library is the one error
  that does direct damage: the student cites it, the marker looks it up, and it
  does not exist. Where the source is the student's own (a lecturer's slides,
  the AI tool they used) the example is a form with blanks, not an invented
  reference.
- Several Sri Lankan government sites — the Department of Census and
  Statistics, the UGC, the NIE — refused the request when this was generated,
  so they are **named in the guides as places to look, never shipped as
  citations**. Add them only after opening them.
- **Synthetic data is labelled synthetic** in the file, on the sheet, in the
  CSV header and in every chart title.
- No emoji, sentence case, no "recognised", no "accredited", no university
  logos.
- Each file carries the AI-drafted-and-reviewed line.

## Verifying a regenerated file

LibreOffice could not run in the environment these were built in, so the checks
were structural rather than visual:

- `.docx` — read back with `python-docx`; confirm the heading tree, the `TOC`
  field, the `Caption` style and `PAGE`/`NUMPAGES` in the footer.
- `.xlsx` — read back with `openpyxl`; confirm every computed cell holds a
  formula rather than a typed-in result.
- `.ipynb` — execute every code cell against the generated CSV before
  shipping. All of them ran clean, including the cleaning cell that finds the
  deliberate duplicate row and missing value.
- `.pdf` — render with `pymupdf` and look at the page.

`repack.mjs` rewrites the generated `.docx` files so `[Content_Types].xml` is
the archive's first entry. Word tolerates what `docx` (npm) emits; LibreOffice
and several Android viewers refuse to open it, and most of this audience is on
a phone.
