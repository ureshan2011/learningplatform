# Campus Survival Pack — file generators

The seven downloads are generated here and committed under
`content-packs/campus-survival-pack/`. They **ship with the deployment** and are
served by `app/api/packs/[subjectId]/files/[name]/route.ts`, which re-checks
`hasAccess()` on every request. Nothing has to be uploaded for the pack to work.

They are not in `public/`, and must not be — that was the point of the
signed-URL design, and a gated route keeps the property rather than weakening
it: there is no public path at all, and access is checked per request instead of
once when a ten-minute link is minted.

`next.config.ts` lists `content-packs/**/*` under `outputFileTracingIncludes`
for that route. Nothing imports these files, so without that entry the build's
dependency trace drops them and every download 404s in production while working
perfectly in `next dev`. If you add a file, add it to `PACK_BUNDLED_FILES` in
`lib/content/survival-pack.ts` — that list is also the download allowlist, so a
name missing from it is a 404 rather than a path to traverse.

To replace one without a deploy, upload it from **Teacher console → Content**,
kind **Pack**, into its slot. An uploaded file wins over the bundled one.

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

## Which file fills which slot

Slot keys come from `PACK_ITEMS` in `lib/content/survival-pack.ts`; the mapping
itself is `PACK_BUNDLED_FILES` in the same file.

| Slot | File |
|---|---|
| `word-template` | `university-assignment-template.docx` |
| `assignment-planner` | `assignment-planner.xlsx` |
| `data-workbook` | `excel-practice-workbook.xlsx` |
| `python-starter` | `python-starter.ipynb` |
| `zotero-library` | `zotero-starter-library.ris` |
| `ai-declaration` | `ai-use-declaration.docx` |
| `survey-checklist` | `survey-design-checklist.pdf` |

`sri-lanka-districts-synthetic.csv` (the notebook's dataset) and
`zotero-starter-library.bib` have no slot of their own and appear under "More
files" on the pack page.

A slot with neither a bundled nor an uploaded file shows "Coming soon" rather
than an error — to someone who has just paid, an error reads as "it is broken".

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
