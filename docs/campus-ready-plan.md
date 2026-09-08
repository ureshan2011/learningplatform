# Campus Ready — the must-have programme for every university-bound student

> **Status: approved, not yet launched.** Target first intake January 2027.
>
> An intake can now be opened from the teacher console, and a student can find
> it, read the syllabus and pay for it by card, bank slip or cash. Still to
> build: the Python playground and auto-grading, submissions and peer review,
> the certificate and verification page, and the public SEO cluster.
>
> **For the engineering state — what exists, the invariants, and what to do
> next — read `docs/campus-ready-handoff.md`.**
>
> Market figures here were researched in September 2026 and go stale — the
> A/L cohort numbers change yearly, and the competitor prices in §1 will move.
> Re-check before quoting them in marketing.

## Context

ICT Campus sells one thing: A/L ICT tuition, monthly, to Grade 12–13 students. That
is an optional subject inside one stream. When a student finishes their A/L exam they
disappear and the revenue stops.

Between the A/L exam and the first university lecture there is a **~10–14 month dead
window**. For the 2025 cohort: exam ended 5 Dec 2025 (some papers 20 Jan 2026),
results 1 Apr 2026, selection results 1 Aug 2026, admissions from Sept 2026 — and
FUTA warned in Aug 2026 that admissions could slip a further one to two years.
**281,810 sat; 176,538 qualified; ~42,937 will be admitted.**

Nobody sells into that window. The nearest paid product — University of Colombo's
online *Certificate Course in Data Analysis* (60 hours, weekends, Sinhala + English,
**Rs 30,000**, now on its 3rd intake) — targets people *already* in university. It
proves Sri Lankans pay Rs 30,000 online for a data certificate, and leaves the
pre-university window wide open.

**Outcome:** a second product with a ~10× larger addressable cohort than A/L ICT,
near-zero marginal cost per student, positioned so that every university-bound
student feels they *need* it — not that it would be nice to have.

---

## Decisions locked with the owner

| | |
|---|---|
| Format | 3 months, one large cohort, weekly live class + video lessons + interactive activities + coding playground |
| Mentoring | **None.** All assessment automated or peer-driven |
| Price | **Rs 30,000 total** |
| Intakes | **Two per year — January and July** |
| Language | Sinhala teaching, English technical terms |
| Credential | ICT Campus certificate signed **Dr. Yasas Sri Wickramasinghe**. No TVEC registration |

---

## 1. Positioning — why this is a must-have, not a nice-to-have

### The mistake to avoid

Calling this a "data analytics course" makes it sound optional and specialist. An Arts
or Management student reads that and thinks *not for me*. It also puts us head-on
against Colombo, Moratuwa and Sri Jayewardenepura on their own turf, for a search term
almost nobody types.

### The reframe

**Category = the computer and academic skills university assumes you already have.
Payoff = data analytics, Python and Power BI.**

Universal on the way in. Aspirational on the way out. The category makes them buy;
the payoff makes them proud.

### Product name: **Campus Ready**

Sri Lankan students say *campus*, not *university* — "campus යනවා", "campus එකේ",
"campus first year". The name has to sound like how they talk. Campus Ready reads
naturally in a Sinhala sentence and in English.

**Certificate name:** *Certificate in Digital & Research Skills for University* —
names both halves the owner asked for: ICT/IT basics, and academics.

### The core message

> **Your degree assumes you already know this. Nobody taught you.**
>
> Every assignment, every presentation, every research project at campus runs on a
> computer — Word, Excel, referencing, data, and now AI. Campus Ready teaches all of
> it, in Sinhala, in 3 months, before your first lecture.

### The four reasons every student needs it

Written in this order deliberately — nearest fear first, biggest prize last.

1. **First-year coursework.** Your lecturer will say "2,000 words, APA referencing,
   submit as PDF on Moodle by Friday". Nobody has ever taught you any of that.
2. **The research project every honours degree ends with.** Four-year special degrees
   (SLQF Level 6) finish with a dissertation. Students reach it in year 3 with no
   data, statistics or referencing skills, and panic.
3. **AI, without getting into trouble.** 99% of Sri Lankan undergraduates already use
   AI tools for academic work; 94% use ChatGPT. No university has taught them the
   rules, and the research literature is explicitly asking for structured training
   rather than bans. We teach the line between help and misconduct, and how to declare it.
4. **Getting hired afterwards.** Entry-level data analysts in Sri Lanka earn LKR
   65,000–100,000/month. Python is the most in-demand language; Power BI is
   specifically valued by local banks and corporates. Your degree will not teach you either.

### The anti-positioning

There is a visible paid **assignment-writing industry** in Sri Lanka — several
services rank on the first page for "assignment help Sri Lanka". That is revealed
proof of the pain, and it hands us a line that is both persuasive and honest:

> **Don't pay someone to write your assignment. Learn to do it yourself.**

Name the category, don't name the companies.

### Why they should trust us instead of a university

The credential answer is not an institution — it is the teacher. `lib/seo/site.ts`
already publishes these and they must be front and centre on every Campus Ready page:

- PhD in Human Interface Technology, University of Canterbury, New Zealand
- **Former lecturer, University of Moratuwa**
- Senior Lecturer, New Zealand
- **70,000+ students taught** on Udemy and open.uom.lk

A former Moratuwa lecturer with a doctorate, teaching in Sinhala, is a stronger trust
signal to a rural student than an unfamiliar institute's logo. Lead with the person.

---

## 2. SEO strategy

The brand name is for memorability; **traffic comes from the content cluster, not the
name.** Nobody searches "Campus Ready". They search questions.

### Don't fight for the wrong keyword

"Data analytics course Sri Lanka" is owned by universities and barely searched. The
volume is in the question keywords students actually type in this window — and ICT
Campus already has topical authority with Google in the A/L space, which carries over.

### The cluster

Follow the existing pattern of `/command-words`, `/logic-gates`, `/number-systems`,
`/past-papers` — genuinely useful static reference pages that rank, each linking to the
product.

**Head pages**
- `/campus-ready` — the product page
- `/after-al` — "after A/L what to do" / "after A/L courses": the single highest-volume
  query in this window, currently owned by course-aggregator blogs with thin content
- `/university-pathways` — **already exists**, with real UGC Z-score data. Extend it.

**Reference cluster** (each answers one real query, each converts)
- `/campus/first-year-guide` — what first year actually looks like
- `/campus/assignment-guide` — how to write a university assignment
- `/campus/apa-referencing` and `/campus/harvard-referencing`
- `/campus/zotero` — a Zotero guide in Sinhala; effectively nonexistent today
- `/campus/turnitin` — what Turnitin actually checks
- `/campus/ai-rules` — using AI for assignments without getting into trouble
- `/campus/excel-for-university`
- `/campus/research-project-guide`
- `/campus/moodle-guide`
- `/campus/degree-requirements/<faculty>` — one page per faculty

**The degree-requirement pages do two jobs at once**: they are the SEO long tail, *and*
they are the "aligned with a university requirement" proof the owner says Sri Lankans
need before they buy. Each page says: *your degree requires research methods and
statistics in year N — here is the module that covers it.*

**Honesty constraint (non-negotiable):** these pages state *what universities require*
and *what we cover*. They must never imply endorsement, accreditation or partnership by
any university, or by Microsoft. Wording reviewed before publication.

### Sinhala SEO is uncontested — and currently impossible

Sinhala-language search for "APA referencing", "Zotero", "university assignment",
"campus first year" is close to empty. That is free territory.

**But the platform cannot rank in Sinhala today.** `lib/i18n/server.ts` resolves locale
from the `ictclass_lang` **cookie**, defaulting to English. Googlebot has no cookie, so
it will only ever see and index the English version of every page.

The fix must not disturb the app. Keep the cookie exactly as CLAUDE.md describes for
everything behind sign-in; add **real Sinhala URLs for the public marketing/SEO pages
only** (e.g. `/si/campus/apa-referencing`), with `hreflang` pairing to the English
version. Public reference pages are static content — the same way `/command-words` and
`/papers` already are — so this does not touch the dictionary/cookie design.

### Timing

1 April (results) and 1 August (selection results) are the largest student-search
moments of the Sri Lankan year. The cluster must be published and indexed **months
before**, not on the day.

---

## 3. Curriculum — 12 weeks, one cohort

Serves the maximum number of degrees: Management, Commerce, Arts, Social Sciences,
Science, Agriculture, Bio/Health, Education, Nursing. Does not serve Engineering
design, Architecture, Fine Arts or clinical Medicine — an accepted skip.

~1 hour of video + a 2-hour weekly live class + lab tasks + a quiz each week.
**75–85 hours** of student effort against Colombo's 60, at the same price.

| Wk | Module | Deliverable |
|---|---|---|
| 1 | How campus actually works: Moodle, assignment briefs, academic email, file discipline | Setup lab |
| 2 | Word properly — styles, auto table of contents, captions, a real assignment template | Assignment 1 |
| 3 | Spreadsheets properly — formulas, lookups, pivot tables | Spreadsheet lab |
| 4 | Data cleaning; survey design with Google Forms; presenting without reading slides | **Milestone 1** |
| 5 | Python foundations — variables, lists, loops, functions | Python lab |
| 6 | pandas — load, filter, group, merge, on real Sri Lankan data | Python lab |
| 7 | Visualisation — charts that don't lie | **Milestone 2** |
| 8 | Statistics for your research project — sampling, t-test, chi-square | Python + sheets |
| 9 | Correlation and regression; reading output like a supervisor will | Quiz |
| 10 | Power BI — data model, DAX basics, dashboards | Power BI file |
| 11 | Literature search, Zotero, APA/Harvard, Turnitin, **ethical AI use + declaration** | Research pack |
| 12 | **Capstone** — full pipeline on real Sri Lankan open data → dashboard + report | Portfolio |

Weeks 1–4 are deliberately the "must-have ICT basics" half and are what the marketing
leads with. Weeks 5–12 are the payoff half. A student who only wanted to survive
first year finishes able to do data analysis, which is the upsell built into the product.

**Capstone uses Sri Lankan open data** — district A/L results, census, dengue, weather,
economic indicators. A portfolio piece about their own country beats a recycled Kaggle
dataset with any local employer or lecturer.

### Assessment without mentors

- Auto-graded weekly quizzes — reuse `lib/practice/engine.ts` and the existing
  `Question` / `QuestionAttempt` types.
- Auto-graded lab tasks — extend `lib/lab/` with test-case checking.
- Milestones and capstone — structured **peer review**, 3 reviewers per submission
  against a fixed rubric, plus automated structural checks.
- Owner spot-checks only the Distinction band and the top 10. Bounded workload.

---

## 4. What the student takes home

The price matches a state university's, so the certificate must be a better object.

1. **Verifiable graded certificate** — QR code to a public `ictcampus.lk/verify/<code>`
   page showing name, cohort, date, grade, modules, capstone link. Colombo issues a PDF
   nobody can check. Signed by Dr. Yasas Sri Wickramasinghe, with the Canterbury PhD
   and Moratuwa lectureship printed on it.
2. **Pass / Merit / Distinction bands.** Sri Lankan students respond to grades far more
   than to completion — the cheapest available lever on completion rate, which is what
   makes a self-issued certificate credible at all.
3. **Public portfolio page** — `ictcampus.lk/p/<handle>` carrying their capstone
   dashboard, notebook and grade. A real CV line; nobody in Sri Lanka gives this.
4. **The Campus Survival Pack** — files they keep for years: a Word assignment template
   with styles and auto-TOC, a preloaded Zotero library of Sri Lankan sources,
   APA/Harvard style files, a Python starter notebook, a Power BI `.pbit` template, a
   survey-design checklist, and an **AI-use declaration template** universities will
   soon demand and nobody currently supplies.
5. **Lifetime access to recordings and future updates.** No marginal cost, and it brings
   them back in year 3 when they hit the real research project.
6. **Free alumni re-entry to any future live intake**, over the existing HLS overflow path.
7. **Top 10 per cohort:** public Hall of Fame plus a written reference letter from
   Dr. Yasas. Capped at 10 so it stays scarce and the workload is bounded.
8. **"Research Project Rescue"** — an alumni-only live clinic when they reach their
   real final-year project. Turns a 3-month sale into a 4-year relationship.

---

## 5. Money

Rs 30,000 × two intakes. Marginal cost is PayHere (~3.3%, ≈ Rs 990) plus Firebase.
No mentors. Content built once, sold for years.

| | Intake 1 | Intake 2 | Revenue |
|---|---|---|---|
| Year 1 (2027) | 250 | 500 | **Rs 22.5m** |
| Year 2 (2028) | 1,000 | 1,600 | **Rs 78m** |
| Year 3 (2029) | 2,500 | 3,500 | **Rs 180m** |

Year 1 at 750 students is **0.27% of the annual A/L cohort**. Illustrative, but a low
bar given an existing audience and the results-day traffic moment. Margin should hold
above 90%. The binding constraint is completion rate, not demand.

---

## 6. Acquisition

1. **A/L alumni first** — highest ROI. When a Grade 13 enrollment lapses, move that
   student into a Campus Ready nurture sequence automatically.
2. **The SEO cluster** in §2, published early enough to be indexed before 1 April.
3. **Z-score cut-off checker** built on the existing `lib/content/university-pathways.ts`
   UGC data — results-day traffic magnet.
4. Sinhala YouTube/TikTok shorts: "campus first year එකේ කවුරුත් කියලා දෙන්නෙ නැති දේවල්".
5. Referral rewards through existing platform mechanics.

**Calendar:** the January intake opens the week the A/L exam ends — peak idle attention.
July opens off results day. Enrolment closes when the cohort starts; scarcity is the
completion mechanism.

---

## 7. What to build

**Reuse unchanged**
- `hasAccess(uid, subjectId)` in `lib/payments/entitlements.ts` is already subject- and
  time-scoped on `enrollment.currentPeriodEnd`. A cohort is just a `Subject`.
  **No access-logic changes** (CLAUDE.md rule 1 — do not add a parallel check).
- Payments, ledger, receipt series, PayHere (`lib/payments/*`).
- Zoom + RTMP → HLS overflow for the weekly live class.
- `lib/content/storage.ts` signed URLs for materials.
- `Unit` / `Lesson` / `Progress` in `lib/types.ts` already model modules.
- `lib/practice/engine.ts` + `Question` / `QuestionAttempt` for quizzes.
- Existing XP, streaks, leaderboard, attendance and at-risk nudges — these *are* the
  substitute for mentors.
- `lib/seo/site.ts` credential constants and `lib/seo/json-ld.ts` for the new pages.

**Changes required**

1. **Cohort as a Subject** — `lib/types.ts`: extend `Grade` (`"OL" | "AL"`) with a campus
   value; add `startsAt`, `endsAt`, `enrolmentClosesAt`, `oneOffPriceLKR` to `Subject`
   (`priceLKR` is documented as monthly — do not overload it).
2. **Fixed-term grant** — `grantAccess()` stacks `months` from now; add an explicit
   end-date option so a cohort ends on `endsAt`.
3. **Python playground** — new `lib/lab/python.ts` beside `pseudocode.ts` /
   `spreadsheet.ts` / `sql.ts`. Those are hand-written client-side engines; Python needs
   Pyodide (WASM). **~10MB download**, which conflicts with the cheap-Android assumption
   elsewhere — acceptable only because the programme requires a laptop (§8), and it must
   load on the lab route only, never in the shared bundle.
4. **Test-case grading in the lab** — the existing engines evaluate but do not grade.
5. **Certificate** — `app/api/certificate/[subjectId]/route.tsx` already renders PNG via
   `next/og`. Add signature, credentials, Pass/Merit/Distinction band, QR, and a
   cohort-completion eligibility rule beside `getCertificateEligibility`.
6. **Public verification page** — `app/(public)/verify/[code]/page.tsx`, readable without
   auth, exposing only name, cohort, date, grade, modules.
7. **Public portfolio page** — `app/(public)/p/[handle]/page.tsx`, opt-in.
8. **Submissions + peer review** — the one genuinely new subsystem: Storage upload,
   3 assigned reviewers, rubric scores, aggregate mark. Server-only writes (CLAUDE.md
   rule 5 — a student must never be able to write their own grade).
9. **Public SEO cluster** — static pages under `app/(public)/campus/*` and `/after-al`,
   following the `/command-words` pattern, plus `/si/...` Sinhala routes with `hreflang`.

All signed-in screens built from `components/ds/` under `.ict-app`. No new external
service — the "runs on Firebase alone" property holds.

---

## 8. Say these things publicly before launch

- **This programme requires a laptop.** Power BI Desktop is Windows-only and Python is
  impractical on a phone. Unlike the A/L classes. Not saying so will generate refunds.
- **No mentoring.** Sell the automated feedback and peer review as the design, not as a gap.
- **The certificate is issued by ICT Campus and is not accredited** by any university or
  awarding body. Plain words; never imply otherwise.
- **TVEC:** registration is on its face legally required to offer vocational training in
  Sri Lanka, and needs a fixed inspected premises renewed every 2 years. The owner has
  chosen to skip it — defensible for supplementary education, but a live risk. Do not use
  the words "recognised" or "accredited" anywhere. Worth a lawyer's view once revenue allows.

## 9. Risks

- **Completion collapse without mentors** — the main risk. Mitigated by grades, the weekly
  live anchor, auto-marking, peer review and existing nudges. Measure Intake 1 honestly
  before scaling.
- **A university targets the gap window.** Timing is the moat, not content. Own results day first.
- **Peer review quality.** Needs a tight rubric and moderation, or marks become noise.
- **Sinhala SEO routes** must not regress the cookie-based locale behind sign-in.

---

## 10. Sequence to a January 2027 launch (~4 months)

1. **Validate** — put the Rs 30,000 / 12-week / laptop-required proposition to current and
   past A/L students. Fifty honest answers before building.
2. Cohort Subject + fixed-term grant (small).
3. Python lab + test-case grading (largest engineering item).
4. Submissions + peer review.
5. Certificate extension, verify page, portfolio page.
6. **Publish the SEO cluster early** — it needs months to index before 1 April.
7. Record weeks 1–4; write the full syllabus and rubrics.
8. Open enrolment the week the 2026 A/L exam ends.

## Verification

- `hasAccess` unchanged: existing A/L access tests pass, and a cohort enrollment denies
  after `endsAt` with no new code path.
- Enrol a test student via the teacher console's manual-payment route; confirm one receipt
  in the existing yearly series.
- Run a lab task with a wrong answer and confirm it fails; confirm the Python bundle loads
  on no route but the lab.
- Submit a milestone, review it as three other students, confirm the aggregate mark is
  written server-side and is not writable by the student.
- Complete a cohort → certificate renders with the right band → QR resolves to the public
  verify page while signed out.
- Fetch a `/si/` SEO page with cookies disabled and confirm Sinhala content is served and
  `hreflang` pairs to the English URL.
- Confirm the sales page states the laptop requirement, no-mentoring design, and
  non-accredited status.
