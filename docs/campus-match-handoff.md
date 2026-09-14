# Campus Match — build handoff

**What this is.** A one-payment report that tells a student who has just received A/L results which state university degrees they can realistically get into, with an estimated chance for each course in their district, the safest and riskiest picks, and a recommended order for the UGC application form. Rs 1,490. Sold from results day (1 April) through the application deadline, and again when selection results come out (1 August) as a "what now" check.

**Why it exists.** Every one of the roughly 176,000 qualified candidates and their parents asks exactly this question in the same week, and nobody sells a data-backed answer. The audience is ten times the ICT class and four times the Campus Ready cohort. Every buyer is a Campus Ready lead.

**The no-cost rule.** Nothing calls an AI model per student. The forecast is a small model fitted once on published UGC cut-offs and evaluated in code. The degree profiles are written once by AI, reviewed, and shipped as static content. Marginal cost per sale is the PayHere fee.

**The no-stale-data rule.** The product is scoped to one admission cycle. Its data carries the UGC round it came from, the report prints it, the console warns when it ages, and a new cycle is a new product with a new dataset. No page ever shows a number without its source year.

**Read first, nothing else:** `CLAUDE.md`; `docs/campus-ready-handoff.md` §2 to §4; `docs/survival-pack-handoff.md` §1, §3 (the `product` block and the money path — this product reuses it exactly); `lib/content/university-pathways.ts` and `components/university-pathways/EligibilityExplorer.tsx` (the seed of the free checker). Then only the files named below.

---

## 1. Decisions locked

| | |
|---|---|
| Product name | Campus Match |
| Subject id | `campus-match-2027` — one per admission cycle. The cycle is the academic year the student is applying for (results April 2027 → admission 2027/2028) |
| Model | A `Subject` with `grade: "CAMPUS"` and the `product` block from the Survival Pack handoff. If that has not landed yet, build §3 of that handoff first, as step 1 here |
| Price | Rs 1,490, `product.feeLKR`, editable in the console |
| Access | `accessDays: 420` — covers results day, the application deadline, selection results and any appeal |
| Free tier | The checker on `/university-pathways`: eligibility plus the **last published** cut-off for the student's district. Public data stays public; that is what ranks |
| Paid tier | Forecast cut-off and chance for the coming round, four-band grouping, the preference-order builder with expected outcome, degree profiles, saved inputs, printable report, share card |
| Forecast method | Damped trend on each course × district series with an empirical error band from historical year-to-year changes. No neural anything. Backtested and calibrated before launch (§4) |
| Data home | Static TypeScript/JSON under `lib/content/ugc/`, server-only. The client never receives the full dataset |
| Freshness | Report and checker print "Based on UGC rounds A to B, published DATE". Console shows a freshness panel. A `published` switch under `settings/campusMatch2027`, default off, like the predicted paper |
| Laptop | Not needed. This is a phone product, built for a cheap Android on results day |
| Honesty | "Estimate, not a promise" on every screen with a number. Not affiliated with, endorsed by or a substitute for the UGC. The UGC handbook is the authority on eligibility; every course row links to it |

---

## 2. Data required — collect and verify before writing product code

Every dataset below gets an entry in `lib/content/ugc/SOURCES.md`: source URL, document title as printed on its cover, academic year as printed, date fetched, SHA-256 of the file, and who verified it. A dataset without a manifest entry does not ship. All documents come from the UGC (`ugc.ac.lk`, University Admissions section) or the Department of Examinations (`doenets.lk`). Do not take any figure from a tuition site, a news article or a course-aggregator blog, and do not take any figure from memory.

### 2.1 Cut-off marks by course and district, one file per admission round
- **What:** the UGC's published Z-score cut-off tables: one row per course code and university, one column per district (25), cells numeric or NQC (no qualified candidates).
- **Rounds:** every round the UGC has published from 2018/2019 up to and including the newest one on the site at build time. Minimum five rounds or the forecast does not launch. Record in `SOURCES.md` which round is newest and its publish date; if the newest is older than the current admission cycle, stop and tell the owner before building anything on it.
- **Store:** `lib/content/ugc/cutoffs/<round>.json` as `{ round, publishedAt, source, rows: [{ code, course, university, districts: { [districtKey]: number | "NQC" } }] }`.
- **Verify:** every row has exactly 25 district cells; every numeric cell is between -3.5 and 3.5; course codes join across rounds; a random sample of 40 cells per round is checked by eye against the rendered PDF page and the check is recorded in `lib/content/ugc/QA.md`.

### 2.2 Course catalogue and eligibility, from the newest UGC admission handbook
- **What:** for every course code: name, university, faculty, stream(s) admitted, required subject passes (for example "Credit pass in Biology", "English medium only"), whether an aptitude or practical test is required and when it is held, medium of instruction, and the intake number if the handbook prints it.
- **Store:** `lib/content/ugc/courses.json`. Encode eligibility as structured rules where the handbook is unambiguous (`streams: [...]`, `requires: [{ subject, minGrade }]`, `medium`, `aptitudeTest: true`), and set `eligibilityVerify: true` with the handbook page reference wherever it is not. The report shows "check the handbook" beside any course carrying that flag, never a guess.
- **Verify:** every course code in 2.1's newest round exists here; every course here has at least one stream; 30 courses checked by eye against the handbook, recorded in `QA.md`.

### 2.3 Selection scheme rules
- **What:** the all-island merit share, the district share, the educationally disadvantaged district share and the list of those districts; how preference order is processed; the number of preferences the form allows this cycle; application window dates if published.
- **Store:** `lib/content/ugc/scheme.json` with a page reference for each rule. Anything not found in the handbook is left out, not assumed.

### 2.4 Districts and the A/L streams
- **What:** the 25 administrative districts with the exact spelling the UGC tables use; the A/L streams and their subject lists as the Department of Examinations names them; the Z-score's plausible range.
- **Store:** `lib/content/ugc/districts.json`, `lib/content/ugc/streams.json`.

### 2.5 Degree profiles, written once by AI, reviewed by the owner
- **What:** for every course in 2.2, in English and Sinhala: what you actually study in year one, the tools and skills the degree assumes (mapped to Campus Ready weeks), typical graduate paths in Sri Lanka. **No salary figures, no employer names, no job-market claims** unless a source was fetched and is cited in the profile. Sinhala in everyday register, technical terms in English.
- **Store:** `lib/content/ugc/profiles/<code>.ts` exporting `{ en, si, campusReadyWeeks: number[] }`. Group by faculty if the count makes one file per course unwieldy.
- **Verify:** the owner reads ten at random in Sinhala before the publish switch is flipped.

### 2.6 What is deliberately not collected
Private university or SLIIT/NSBM entry data (different system, out of scope). Salary surveys (unsourced claims are the fastest way to a refund and a bad name). Any year's data the UGC has not itself published.

---

## 3. Data pipeline

`scripts/campus-match/` holds the pipeline so the next cycle is one session, not a rebuild. It runs in the build session, never on the server.

1. `fetch.mjs` — downloads each document listed in `sources.json`, records SHA-256 and fetch date, refuses a document whose cover year does not match the entry.
2. `extract-cutoffs.py` — PDF tables to `cutoffs/<round>.json` with the pdf skill (pdfplumber; OCR only when a page has no text layer, and then flag the round for a full eye check). Emits a per-round validation summary: row count, district count per row, numeric range, NQC count, unmatched course codes.
3. `extract-courses.py` — handbook to `courses.json`, with `eligibilityVerify` set wherever a rule was not parsed cleanly.
4. `validate.mjs` — the cross-checks in §2. Fails the build session on any error. Writes `QA.md`.
5. `backtest.mjs` — §4. Writes `BACKTEST.md`.

Commit the generated JSON, `SOURCES.md`, `QA.md`, `BACKTEST.md` and the scripts. The PDFs themselves are not committed; the manifest lets anyone re-fetch them.

---

## 4. The forecast

`lib/campus-match/forecast.ts`, pure functions, no I/O, unit-testable.

For one course × district series `c[y]` over the available rounds:
- **Point forecast:** `last + 0.5 × mean(last three year-to-year changes)`. Damped so one odd year does not swing it. Fewer than three rounds of history → use `last` and widen the band.
- **Error band:** `sigma = stdev(all year-to-year changes for that course across all districts)`, floored at 0.08. Pooling across districts is what makes the estimate stable for a course with thin history in one district.
- **Chance:** `P(Z_student ≥ forecast)` under a normal with that `sigma`, clamped to 3 to 97 percent. Never print 0 or 100.
- **Bands:** Likely ≥ 70, Possible 35 to 69, Reach 10 to 34, Unlikely < 10.
- **NQC handling:** an NQC year is a gap, not a zero. A series that is NQC in the newest round gets "no cut-off published for your district last round" and no chance figure.
- **Preference-order outcome:** walking the student's ordered list, chance of landing on course i is `p_i × Π(1 − p_j)` over the courses above it; "chance of no offer from this list" is `Π(1 − p)`. State on the screen that this treats courses as independent, which slightly overstates certainty.

**Backtest before launch.** For each round R from the third onward, forecast R from rounds before R and compare with the real R. Report mean absolute error, and calibration: of the course × district cells where a hypothetical student at the forecast plus one sigma was labelled Likely, what share actually cleared. Tune the damping and the sigma floor until Likely clears at least 70 percent of the time and Unlikely clears at most 10 percent. Write the numbers into `BACKTEST.md` and print the headline calibration in the report's method note. If the backtest cannot reach those bars, the bands widen until it does; the labels are not allowed to promise more than the data can.

---

## 5. Product and money

Everything from `docs/survival-pack-handoff.md` §3 applies unchanged: `Payment.kind: "product"`, `payableLKR()`, `grantForPayment()`, the checkout `already_owned` refusal, slip and manual branches, `PaymentStatusWatcher` product copy. Only two additions:

- **`PaymentStatusWatcher`** routes a `campus-match-*` subject to `/campus-match/report` with the heading "Your Campus Match is ready".
- **Checkout refuses with `not_published`** when `settings/campusMatch2027.published` is false, so a product cannot be sold before the owner has flipped the switch, and `stale_data` when the newest round in `SOURCES.md` is older than 400 days. Both checks sit in front of the payment, never behind it.

Inputs are stored server-side after purchase in `campusMatch/{uid}` (`{ tenantId, uid, cycle, z, district, stream, passes, medium, preferences: string[], updatedAt }`), written only by `POST /api/campus-match/inputs` after `hasAccess(uid, "campus-match-2027")`. No client rule grants write. A student may delete the document from Account.

---

## 6. The experience, end to end

Signed-in screens from `components/ds/` under `.ict-app`; the public checker on the cream landing system. Phone first: no chart library, bars are CSS, the whole flow works on a 360-pixel Android over 3G. Sinhala and English via the dictionary and `localeAttrs()`.

### 6.1 Free checker — `/university-pathways` (extend the existing page)
1. Three inputs above the fold: Z-score (numeric, validated to the plausible range), district (select, 25), stream (select). Then the stream's subjects as toggles for "passed with C or better", and one toggle for "I can study in English medium".
2. Results appear as the student types, from `POST /api/campus-match/check` (public, rate-limited, returns only eligible course rows with last-round cut-off for that district and a plain trend arrow). The full dataset never leaves the server.
3. Each row: course, university, "Last round cut-off in {district}: 1.72", eligibility note or "check handbook" chip. Sorted by cut-off nearest the student's Z.
4. The inputs live in the URL (`?z=1.85&d=gampaha&s=bio&p=bio,chem,phy&m=en`) so a shared link or a return visit needs nothing retyped. No login.
5. One orange call to action, sticky at the bottom on mobile: "See my chances for next round — Rs 1,490". A one-line honest teaser under it: "Forecast, four bands, application-order builder. Estimate, not a promise."
6. Source line at the foot of the results: "Cut-offs from UGC round B, published DATE. Eligibility summarised from the UGC handbook; the handbook is the authority."

### 6.2 Buying — no retyping, no dead ends
- The call to action goes to `/campus-match?` with the same query string. `requirePageUser("/campus-match?…")` sends an unsigned student through OTP and back to the same URL with the inputs intact.
- `/campus-match` (signed in, not owned): the feature card shows what the report contains, the price, the `SubscribeButton` with the Buy label, the bank-slip link if enabled, and the same source line. The inputs from the URL are shown as chips so the student can see they were kept.
- After PayHere returns, the watcher lands on `/campus-match/report`. The report page reads inputs from the URL if present and saves them to `campusMatch/{uid}` on first render through the inputs route; a student who arrives without a query string sees the inputs form first.

### 6.3 The report — `/campus-match/report`
Owned only; not owned redirects to `/campus-match`. Sections, in order:
1. **Feature card (cocoa):** "3 likely, 5 possible, 4 reach" in words, the student's inputs as chips with an "Edit" pill, and the source line.
2. **Four bands** as `SectionBar` groups: Likely, Possible, Reach, Unlikely. Each row: course, university, forecast cut-off with the band shown as a thin CSS bar with the student's Z marked, chance as a `StatusChip` (green, amber, orange, neutral — the only semantic colour on the screen, per the design rules), last-round cut-off, three-year trend arrow, aptitude-test `Badge` where relevant, "check handbook" chip where `eligibilityVerify` is set, and a "Profile" link.
3. **Build my order:** the student taps rows to add them to a preference list, drags to reorder (pointer events, no library), and the panel shows the expected landing chance per row and "chance of no offer from this list". A one-line rule from `scheme.json`: the UGC processes preferences top down and gives the first course you clear, so list what you want most first and keep at least two Likely courses on the list. The independence assumption is stated in one sentence.
4. **Method note:** what the forecast is, the backtest calibration headline, the sigma in plain words ("cut-offs typically move about 0.15 a year for this course"), and "estimate, not a promise".
5. **Print** pill → `window.print()` with a print stylesheet that drops the nav and renders the bands as a clean A4 document. No server PDF.
6. **Share** pill → `/api/campus-match/card` renders a `next/og` PNG saying "My Campus Match: 3 likely · 5 possible" with the ICT Campus mark and no Z-score or district unless the student ticks "include my Z-score". This is the results-day WhatsApp loop.
7. Every profile link opens `/campus-match/degree/[code]`: the AI-written profile in the student's language, the course's cut-off history for their district as a small CSS bar chart, and "Campus Ready covers this in weeks 2, 3 and 8" linking to `/campus-ready`.

### 6.4 After results change
- On 1 August, when selection results arrive, the report gets a banner: "Got your selection? Tell us which course" — a single select that writes `outcome` to the inputs document. This is the only ground truth the next cycle's backtest can use, and it is asked once, kindly, and skippable.
- When the UGC publishes the new round, the owner asks for a session; the pipeline runs, a new product `campus-match-2028` is created from the console, and the old one is deactivated. Nothing on the old report changes; it keeps printing its own source year.

### 6.5 Dashboard and nav
One `CampusMatchCard` in the Campus Ready section: not owned → "See my chances" outline link; owned → "Open my report". Nav entry "Campus Match" under the Campus Ready group while owned.

### 6.6 Teacher console
- **Products** section (from the Survival Pack build) lists it like any product.
- **Campus Match panel:** newest round and publish date from `SOURCES.md`, backtest calibration headline, a freshness `StatusChip` (green under 400 days, amber after), the `published` toggle (mirrors `PredictedPaperPublishToggle`), count of reports bought, count of outcomes reported. English only.

---

## 7. Copy, legal, dictionary

Keys `match.*` and `nav.match`, en + si. Sinhala everyday register; keep in English: Z-score, cut-off, UGC, campus, stream, Likely, Possible, Reach.

Required strings, en: `match.estimate` "An estimate from published UGC cut-offs, not a promise." · `match.source` "Based on UGC rounds {from} to {to}, published {date}." · `match.notUgc` "ICT Campus is not affiliated with the UGC. The UGC handbook decides eligibility." · `match.checkHandbook` "Check handbook" · `match.noCutoff` "No cut-off was published for your district last round." · `match.orderRule` "The UGC gives you the first course on your list that you clear. Put what you want most first, and keep at least two Likely courses on the list." · `match.independence` "This treats each course as independent, so it slightly overstates certainty." · `match.bands.likely` "Likely" · `match.bands.possible` "Possible" · `match.bands.reach` "Reach" · `match.bands.unlikely` "Unlikely".

Legal:
- `app/(public)/refund-policy/page.tsx`: under "When we do not refund", add: a Campus Match forecast that differed from the real cut-off — every screen says it is an estimate from published data.
- `app/(public)/terms/page.tsx`: a clause "Campus Match": forecasts are estimates from UGC-published figures; ICT Campus is not affiliated with the UGC; the handbook governs eligibility; the student's inputs are stored to render their report and can be deleted from Account.
- `app/(public)/privacy/page.tsx`: name the stored fields (Z-score, district, stream, passes, preferences, optional outcome) and the deletion path.

Never on any page: "guarantee", "accredited", "recognised", "official", a UGC logo, or a university logo.

---

## 8. Order of work

Each step ends with `npm run typecheck && npm run lint && npm run build` clean, one commit, one push to `claude/campus-ready-monetization-xf225s`. Steps 1 to 3 are data and produce no product UI; do not start step 5 until step 3's QA and backtest are written.

1. **Data collection.** `scripts/campus-match/sources.json`, `fetch.mjs`, `SOURCES.md`. Stop and report if fewer than five rounds exist or the newest round is older than the current cycle.
2. **Extraction and validation.** `extract-cutoffs.py`, `extract-courses.py`, `validate.mjs`, all JSON under `lib/content/ugc/`, `QA.md` with the eye-check samples.
3. **Forecast and backtest.** `lib/campus-match/forecast.ts` with unit tests on fixed series; `backtest.mjs`; `BACKTEST.md`; tune until the calibration bars in §4 hold.
4. **Product type** if the Survival Pack build has not landed (its §3), plus the `not_published` and `stale_data` checkout refusals, `settings/campusMatch2027`, the inputs route and document.
5. **Free checker** on `/university-pathways`, `POST /api/campus-match/check`, URL-carried inputs, sticky call to action, source line.
6. **Purchase pages:** `/campus-match`, watcher routing, report bootstrap from the query string.
7. **Report:** bands, order builder, method note, print stylesheet, share card route, degree profile pages.
8. **Degree profiles:** generate en + si for every course, grouped by faculty, no unsourced claims. Owner review list of ten random codes in the PR description.
9. Dashboard card, nav, teacher panel and publish toggle, dictionary keys, legal clauses, sitemap entry for `/campus-match` (public sales page is `/campus-match` when signed out: same route renders the sales version).
10. PR description: what the owner does in the browser — create `campus-match-2027` in the console, read `SOURCES.md` and `BACKTEST.md`, review ten profiles, run one sandbox purchase, flip `published`, then schedule the results-day post.

---

## 9. Verification

- `SOURCES.md` lists every file with cover year, fetch date and hash; the newest round is the newest on the UGC site on the day of the build.
- `validate.mjs` passes: 25 districts per row, values in range, codes join across rounds, every newest-round course exists in `courses.json`.
- `BACKTEST.md` shows Likely clearing at least 70 percent and Unlikely at most 10 percent on held-out rounds.
- Free checker: a Z of 1.85 in Gampaha, Biological Science stream, returns only courses that stream is eligible for; changing the district changes the cut-off column; the URL carries the inputs; a signed-out share link reproduces the results.
- Sandbox purchase from the self-test panel: `Payment.kind === "product"`, enrollment ends at now + 420 days, one receipt in the yearly series, ledger and CSV show "Campus Match 2027" and Rs 1,490. Second checkout returns `already_owned`. With `published` off, checkout returns `not_published`.
- After a purchase, the report opens with the inputs already applied and nothing to retype; `campusMatch/{uid}` exists and is not writable from a browser.
- A course with `eligibilityVerify` shows the handbook chip; a district with NQC last round shows the no-cut-off line and no percentage.
- The order builder's "no offer" chance equals the product of the complements of the listed chances, and moving a Likely course to the top changes the per-row landing chances accordingly.
- Print preview renders the report on A4 without the nav; the share card renders without a Z-score unless opted in.
- Sinhala: report, checker and one profile read correctly with `lang="si"`.
- No page contains "guarantee", "official", "accredited" or "recognised"; the estimate line appears on every screen with a number.
- Bundle output: the client receives no dataset; `/university-pathways` and the report add no new dependency.

---

## 10. Do not

- Ship any figure without a manifest entry, or any figure from a non-UGC source.
- Call an AI model at request time, anywhere in this product.
- Send the cut-off dataset to the browser.
- Print a chance of 0 or 100, or a band the backtest does not support.
- Add a second access helper; `hasAccess()` stays the only check, and the inputs route uses it.
- Let a browser write `campusMatch/{uid}`, a payment or an enrollment.
- Show "per month" anywhere near this product.
- Use a UGC or university logo, or imply affiliation.
- Add `t()` to the teacher console.
- Write long comments; two to four lines on the why, matching the repo.

---

## Appendix A — what the data actually said, 14 September 2026

Recorded by the build session at step 1, because two things in §1 and §2 do not survive contact with
the published documents and every later step depends on which way they were resolved.

### A.1 The cycle arithmetic in §1 is off by one

The newest cut-off document states its own basis on its cover:

> UNIVERSITY ADMISSION - ACADEMIC YEAR 2025/2026
> [Based on the results of the G.C.E. (Advanced Level) Examination 2025 (after re-scrutiny)]

So the chain is: **A/L exam in year N → results the following April → admission year N/(N+1) → cut-offs
published that September.** Results handed out in April of year Y therefore belong to admission year
(Y−1)/Y, not Y/(Y+1).

§1 says "results April 2027 → admission 2027/2028". By the document, results in April 2027 belong to
admission year **2026/2027**. The subject id `campus-match-2027` is kept as locked — it is an opaque
key and it reads naturally as the results year — but **every displayed year is the admission round
2026/2027**, and that is the round the forecast targets. The no-stale-data rule governs what is
printed, and printing 2027/2028 would be printing a year the report has no data for.

This also keeps the forecast inside what §4 can support: history ends at 2025/2026, the target is
2026/2027, so it is a genuine one-step-ahead forecast, which is what the method and the backtest are
built and calibrated for. Targeting 2027/2028 would be two steps ahead and the bands would not hold.

### A.2 Two rounds are split by syllabus

2019/2020 and 2020/2021 each publish **two** cut-off tables, old syllabus and new syllabus, not one.
§2.1 assumes one table per round. The series uses the **new-syllabus** table for both rounds: it is
the main candidate population and the one continuous with every round before and after. The
old-syllabus tables are recorded in the manifest and left out of the series, and `QA.md` says so.

### A.3 Availability, as found

Eight rounds, 2018/2019 through 2025/2026, all still downloadable from `ugc.ac.lk`. The five-round
minimum in §2.1 is met with three to spare, and the newest round is the current admission cycle, so
neither stop condition in §8 step 1 fired.

### A.4 What the backtest found about the trend (step 3)

Both calibration bars in §4 are met comfortably — Likely clears 87.4% against a
bar of 70, Unlikely 5.7% against a bar of 10 — at every damping and sigma floor
in the sweep, so the bars do not choose between them.

Held-out error does, and it says the trend term is not earning its place: error
rises steadily as more of the recent trend is carried forward and is lowest with
none of it. Cut-offs move with the size and strength of one cohort rather than
along a path, so last round's figure is on its own the best single guess. The
difference is about 4% of error across the whole sweep, and no claim the report
makes depends on it, so the shipped damping stays at the 0.5 §1 specifies —
§4 asks for tuning until the bars are met, and they are. `DAMPING` in
`lib/campus-match/forecast.ts` is one constant if that is ever revisited.

The sigma floor matters more than the damping, and for the opposite reason: it
is what stops a course whose recent years happened to land close together being
handed a confidence it has not earned. The specified 0.08 leaves the bands
slightly wider than nominal, which is the direction §4 asks to err in.

### A.5 How much of a report is a real trend (step 3)

Across all 11,775 course-and-district cells, forecasting the coming round from
every published round: **36.6%** have enough history to read a trend from,
**48.9%** are too short and hold last round's figure with a widened band, and
**14.4%** have no cut-off to forecast from at all and are shown as
"no cut-off was published for your district last round".

Pooling sigma across districts, which §4 describes as what makes a thin district
usable, is therefore load-bearing rather than a refinement: it is what the
middle half of every report rests on.
