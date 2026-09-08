# Campus Ready — implementation handoff

**Read `docs/campus-ready-plan.md` first.** It holds the product reasoning, the
market research and the full build list. This file is the engineering state:
what exists, why it is shaped that way, what will bite you, and what to do next.

Branch: `claude/ict-skills-sri-lanka-market-bdj6sr`
Status at handoff: **the cohort is sellable and enrollable end to end. No
content, no lab, no certificate, no public marketing page.**

---

## 1. What Campus Ready is, in one paragraph

A 12-week, Rs 30,000, one-payment online programme sold to Sri Lankan students
during the ~10–14 month gap between sitting the A/L exam and starting
university. Two intakes a year (January and July). Taught in Sinhala with
English technical terms. **No mentoring** — every mark is automated or peer
produced. It is a second product on the same platform, not a second platform.

---

## 2. The one architectural decision everything rests on

**A cohort is a `Subject`.** Not a new collection, not a new access path.

```
Subject {
  grade: "CAMPUS"          // instead of "AL"
  cohort: {                // present only on cohorts — this is the cohort test
    startsAt, endsAt, enrolmentClosesAt, feeLKR
  }
}
```

Because it is a `Subject`, it inherits enrollments, payments, receipts,
`hasAccess()`, device binding, sessions and Zoom **without any of them learning
a new concept**. `hasAccess(uid, subjectId)` was already time-scoped on
`enrollment.currentPeriodEnd`, so it needed no change at all and must not get
one (CLAUDE.md rule 1 — it is the single access check).

The `grade` discriminator was chosen over a separate boolean flag for one
specific reason: `listSubjects()` and `getSubject()` in `lib/queries.ts` already
filter to `grade === "AL"` as a documented product decision. So cohorts are
excluded from the landing page, the syllabus, the A/L dashboard listing and the
sitemap **automatically, with no page changes, and no future page can leak one
by forgetting.**

### The query split — learn this before touching `lib/queries.ts`

| Function | Answers | Returns |
|---|---|---|
| `listSubjects()` / `getSubject()` | "What do we teach?" | A/L only |
| `listCohorts()` / `getCohort()` | "What intakes exist?" | CAMPUS only, and only with a `cohort` block |
| `listSellableSubjects()` | "What can money be taken for?" | A/L **and** cohorts |

Money screens must use `listSellableSubjects()`. This is not cosmetic: those
screens resolve a payment's `subjectId` to a name, so an A/L-only list makes a
Campus Ready payment export to CSV **with a blank subject**, which is an
accounting defect. Marketing and syllabus screens must keep using
`listSubjects()`.

`getCohort()` requires `cohort` to be present, not just the grade, so every
downstream caller can treat it as guaranteed rather than re-checking.

---

## 3. Invariants — do not break these

1. **`hasAccess()` stays the only access check.** A cohort is already covered by
   it. Never add a parallel "is this student in the cohort" helper.
2. **`grantForPayment()` is the only place that decides monthly vs cohort.**
   Access is granted from three routes — the PayHere webhook
   (`lib/payments/payhere-notify.ts`), slip approval
   (`app/api/teacher/payments/review/route.ts`) and manual entry
   (`app/api/teacher/payments/record/route.ts`). All three go through it. Three
   copies of that branch is how one of them quietly keeps handing cohort
   students a month.
3. **`payableLKR()` is the only place that picks a price.** `Subject.priceLKR`
   is *monthly*; `Subject.cohort.feeLKR` is the *whole programme*. This choice
   had reached four independent copies before it was centralised. Its failure
   modes are billing Rs 0 or billing a Rs 30,000 course every month.
4. **The enrolment window is enforced at checkout, never at grant time.**
   `grantCohortAccess()` deliberately does not check it. Once PayHere has
   captured a card, refusing the grant leaves a student paid up with nothing.
   The gate belongs in front of the payment: `app/api/payments/payhere/checkout`
   and `app/api/payments/slip`. The teacher's manual-record route has no window
   check *on purpose* — recording cash is an override by definition, and it is
   the escape hatch for a genuine late bank deposit.
5. **Cohort access never stacks.** `grantCohortAccess()` sets
   `currentPeriodEnd = cohort.endsAt` absolutely. Paying twice, or paying late,
   must not buy a private extension into an empty classroom.
6. **Only the server writes anything that grants access or awards a mark**
   (CLAUDE.md rule 5). This matters enormously for the peer-review work below.

---

## 4. Two bugs already closed — do not reintroduce them

**Referral bonus.** `applyReferralBonus()` in `lib/referrals.ts` grants bonus
*days* against `payment.subjectId`. On a cohort that (a) pushes the student past
the cohort's fixed end date and (b) mints an enrollment on the cohort's subject
id **for the referrer**, handing someone three days of a Rs 30,000 programme
they never bought. It now returns early on `payment.kind === "cohort"`. If you
want to reward cohort referrals, it needs its own currency — a discount, not
days.

**Free trial.** `startFreeTrial()` would have given 7 days on a cohort, which is
the first two weeks of the course for free. It now reads the subject and refuses
with `reason: "trial_not_available"`. The check lives inside `startFreeTrial`,
not in its callers, so neither route can forget it.

---

## 5. What is built

### Data model — `lib/types.ts`
- `Grade` gained `"CAMPUS"`.
- `SubjectCohort` — one object, not four loose optionals, so "is this a cohort?"
  is a single check that cannot self-contradict.
- `Subject.cohort?: SubjectCohort`.
- `Payment.kind?: "monthly" | "cohort"`. **Absent means monthly** — no ledger
  history was rewritten. It records what was *sold* rather than re-deriving it
  from the subject at confirmation time, so a teacher fixing a cohort's end date
  cannot retroactively change what an already-captured payment bought.

### Access — `lib/payments/entitlements.ts`
- `grantCohortAccess()` — fixed end date, no stacking.
- `grantForPayment()` — the monthly/cohort choke point.
- `startFreeTrial()` — now refuses cohorts.

### Pricing — `lib/payments/pricing.ts` (new)
- `payableLKR(subject)`, `billingLabel(subject)`. Pure, no `server-only`, so
  client components can use it.

### Queries — `lib/queries.ts`
- `listCohorts()`, `getCohort()`, `isEnrolmentOpen()`, `listSellableSubjects()`.

### Content — `lib/content/campus-ready.ts` (new)
- `CAMPUS_READY` (slug, name, certificate title, fee, weeks, tagline).
- `CAMPUS_READY_WEEKS` — the 12-week curriculum, each with a `strand`
  (`foundations` weeks 1–4, `analysis` weeks 5–12) and a `deliverable`.
- Static, like `al-ict-units.ts`. A syllabus should not cost a Firestore read.

### Routes
- `POST /api/teacher/cohorts` — opens an intake. Teacher-only, merges rather
  than overwrites, validates that the end is after the start and that enrolment
  does not close after the end.
- Cohort branches added to: PayHere checkout, slip upload, slip review, manual
  record, the sandbox simulator, CSV export, trial start.

### Screens
- Teacher console (`app/(teacher)/teacher/page.tsx`): a Campus Ready section
  listing intakes with dates and enrolment state, plus `OpenCohortForm`.
- `app/(student)/campus/[subjectId]/page.tsx` — the cohort page. Week list is
  readable **before** enrolling, on purpose.
- Student dashboard: a `CohortCard` section, shown only when an intake is open
  or the student is in one.
- Student nav: a Campus Ready entry when the student has an active cohort.
- Dictionary: `campus.*` keys and `nav.campus`, English and Sinhala.

---

## 6. Gotchas that will bite you

- **`Subject.priceLKR` is 0 on a cohort.** Set deliberately in
  `app/api/teacher/cohorts/route.ts`: anything that misreads it as a monthly
  subscription should bill nothing, not Rs 30,000 a month. Always use
  `payableLKR()`.
- **`<input type="date">` gives midnight UTC**, which reads as the *previous*
  day in Colombo. `OpenCohortForm` converts explicitly — a start at noon, an end
  at `23:59:59.999`. Access that expired at noon on the final day would cut a
  student off mid-class. Reuse `colomboTime()` if you add date fields.
- **`listCohorts()` guarantees `cohort` is present, but TypeScript does not
  narrow the optional.** Destructure to a local (`const term = c.cohort; if
  (!term) return null;`) rather than using `!`.
- **No composite Firestore indexes.** See the long note at the top of
  `lib/queries.ts` — index deploys need a command line, which this project does
  not have. Keep queries equality-only and narrow in memory.
- **Locale is a cookie, not a URL segment.** Googlebot has no cookie, so Sinhala
  pages are currently unindexable. See §7 item 5 — this is a real constraint on
  the SEO work, not a detail.
- **The teacher console is English only**, by design. Do not add `t()` there.
- **Design system**: build from `components/ds/`. No gradients, no emoji, pills
  for actions, sentence case. `SeedSubjectsButton.tsx` is legacy — do not copy
  its `awaken-*` variables or its gradient button as a pattern.

---

## 7. What to do next, in order

### 1. Verify the flow end to end against a real project
Nothing here has run against live Firebase — it typechecks, lints and builds,
but no cohort has actually been created or paid for. Do this before building
more. See §8.

### 2. Python playground + test-case grading — the biggest item
`lib/lab/` holds `pseudocode.ts`, `spreadsheet.ts` and `sql.ts`: hand-written,
dependency-free, client-side engines. Python needs Pyodide (WASM), which is a
different animal:
- **~10MB download.** Acceptable only because the programme requires a laptop
  anyway, and it **must** load on the lab route only, never in the shared
  bundle. Verify with the build output.
- The existing engines *evaluate* but do not *grade*. A shared task/assert layer
  is needed so lab tasks auto-mark. This is what makes "no mentoring" survivable,
  so it is the highest-value engineering work left.

### 3. Submissions + peer review — the only genuinely new subsystem
Storage upload, 3 assigned reviewers per submission, rubric scores, aggregate
mark. **Server-only writes** — a student must never be able to write their own
grade. Needs a rubric tight enough that peer marks are not noise.

### 4. Certificate, verification page, portfolio page
`app/api/certificate/[subjectId]/route.tsx` already renders a PNG via
`next/og` — no new dependency, and it is already gated by `hasAccess` plus
`getCertificateEligibility` from `lib/practice/engine.ts`. Extend it:
- Dr. Yasas signature and credentials (already in `lib/seo/site.ts` —
  `TEACHER_NAME`, `TEACHER_CREDENTIALS`).
- Pass / Merit / Distinction band.
- QR code to a public `/verify/[code]` page (new, readable without auth,
  exposing only name, cohort, date, grade, modules).
- A cohort-completion eligibility rule beside the existing practice one.
- Public opt-in portfolio page at `/p/[handle]`.

### 5. The public SEO cluster
Start this **early** — it needs months to index before 1 April. Follow the
`/command-words` and `/logic-gates` pattern: genuinely useful static reference
pages that rank and convert. `/after-al`, `/campus/apa-referencing`,
`/campus/zotero`, `/campus/turnitin`, `/campus/ai-rules`,
`/campus/degree-requirements/<faculty>`, and a public `/campus-ready` product
page. `lib/content/university-pathways.ts` already holds real UGC Z-score data
to build a cut-off checker on.

**Sinhala SEO needs real URLs.** Keep the cookie exactly as-is behind sign-in;
add `/si/...` routes for public marketing pages only, with `hreflang`. Those are
static content like `/papers` already is, so this does not disturb the
dictionary design.

**Honesty constraint, non-negotiable:** those pages say what universities
require and what we cover. They must never imply endorsement or accreditation by
any university or by Microsoft. The certificate is not accredited — say so
plainly. See §8 of the plan for the three things that must be stated publicly.

---

## 8. How to verify

Nothing below has been run against live Firebase yet.

```
npm install
npm run typecheck   # clean at handoff
npm run lint        # clean at handoff
npm run build       # compiles; Firebase credential warnings are the expected
                    # no-credentials path and are handled by design
```

Manual, against a real project:

1. **Open an intake.** Teacher console → Campus Ready → fill the form. Confirm
   the id in the hint matches the URL, and that the intake appears in the list
   above the form with the right dates.
2. **Bad dates are refused.** End before start, and enrolment closing after the
   end, should both produce a readable message, not a 500.
3. **Enrol.** As a student, `/campus/<id>` → pay by card (PayHere sandbox) →
   confirm `currentPeriodEnd` equals the cohort's `endsAt` **exactly**, not
   now + 3 months.
4. **Pay twice.** Confirm the second payment does not extend the end date.
5. **Enrolment closed.** Set `enrolmentClosesAt` in the past; confirm checkout
   and slip upload both return `enrolment_closed`, and that the teacher can
   still record a manual payment.
6. **No free trial.** Confirm the trial route returns `trial_not_available`.
7. **Referral.** A referred student paying for a cohort must not create an
   enrollment for the referrer on the cohort's subject id.
8. **The ledger.** A cohort payment must appear in Teacher → Payments and in the
   CSV export **with its subject name**, at the full fee, with a receipt number
   from the same yearly series.
9. **Money display.** The bank-deposit screen must show the programme fee, never
   Rs 0, and never the words "per month".
10. **A/L is untouched.** The landing page, syllabus, sitemap and A/L dashboard
    listing must not show the cohort. Existing A/L access must still work.
11. **Access ends.** After `endsAt`, `hasAccess` must deny with `expired`.

---

## 9. Open questions for the owner

- **The plan's step 1 has not been done**: validate the Rs 30,000 / 12-week /
  laptop-required proposition with fifty current and past A/L students. If the
  laptop requirement kills it for the rural base, the curriculum shape changes
  and the Pyodide work above may be wasted. Worth resolving before item 2.
- Referral reward for cohorts — a discount needs designing, or drop it.
- Whether a cohort should have its own Zoom sessions or reuse the A/L timetable
  UI. Sessions are already `subjectId`-scoped, so it should work as-is, but it
  has not been tried.
