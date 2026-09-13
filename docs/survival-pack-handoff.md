# Campus Survival Pack — build handoff

**What this is.** The first self-serve digital product on the platform: a
one-payment, buy-any-day kit of files and in-app guides for students starting
university. Rs 1,990 (owner can change it in the console). Sold on its own,
and bundled free into every Campus Ready cohort seat so the landing page's
"Campus Survival Pack" promise becomes true.

**Why it exists.** Campus Ready takes money for a few weeks twice a year. The
pack takes money every day of the year, at a price that needs no thought, from
the same audience — and from current undergraduates who never bought the
cohort. It is the tripwire into the Rs 30,000 sale.

**Read first, in this order, nothing else:** `CLAUDE.md`,
`docs/campus-ready-handoff.md` §2–§4 (how a cohort is a `Subject`; the
invariants), then only the files named in §5 below. Do not re-explore the repo.

---

## 1. Decisions locked

| | |
|---|---|
| Product name | Campus Survival Pack |
| Subject id / URL slug | `campus-survival-pack` — one document, stable across years |
| Model | A `Subject` with `grade: "CAMPUS"` and a new `product` block. **Not** a `cohort` block — a pack has no start, no end, no enrolment window |
| Price | `feeLKR` on the product block; default 1,990 from `lib/content/survival-pack.ts` |
| Access | `accessDays: 1095` (3 years — the length of a degree). Not "lifetime": we cannot promise storage forever on a Rs 1,990 sale |
| Double purchase | Refused at checkout (`already_owned`), never at grant time — same reasoning as the cohort enrolment window |
| Bundle | `includedWithCohorts: true` → every cohort payment also grants the pack, inside `grantForPayment()` |
| Payment kind | `Payment.kind` gains `"product"` |
| Files | Cloud Storage via the existing teacher upload + signed-URL download. Nothing new in the media path |
| Guides | Static TypeScript in `lib/content/survival-pack.ts`, en + si, gated pages under `/packs/[subjectId]/...` |
| Power BI template | **Out of v1.** It cannot be authored without Power BI Desktop. Ships with the Power BI module later. Never list it |
| AI disclosure | Every guide footer and the sales page say: drafted with AI, reviewed by Dr. Yasas. Never "accredited", never "recognised" |

---

## 2. What is in the pack (v1)

Seven downloads and four in-app guides. Item keys are the `slug` used to
match an uploaded file to its slot on the pack page.

**Downloads** (generated once, uploaded by the owner from Teacher → Content)

| key | File | Must contain |
|---|---|---|
| `word-template` | University assignment template `.docx` | Cover page fields; Heading 1–3 styles; auto table of contents; figure and table captions; page numbers; References heading; Appendix. A4. Built with the docx skill |
| `assignment-planner` | Assignment planner `.xlsx` | Enter due date → back-planned milestones by formula; word budget per section; submission checklist. xlsx skill, real formulas, no hardcoded results |
| `data-workbook` | Excel practice workbook `.xlsx` | A clearly labelled **synthetic** dataset shaped like Sri Lankan district data (25 districts × 5 years); a formulas sheet (SUM/AVERAGE/IF/VLOOKUP/XLOOKUP); a pivot-ready tidy sheet; a "what to try" sheet. Do not present synthetic data as real |
| `python-starter` | Python starter notebook `.ipynb` + its `.csv` | Load, clean, group, chart the same dataset with pandas and matplotlib. Opens in Google Colab — say so, it is the phone-friendly path |
| `zotero-library` | Zotero starter library `.ris` and `.bib` | Only sources verified by fetching the page during generation: Dept of Census & Statistics, Central Bank annual report, UGC statistics, NIE, a Sri Lankan journal article. **Fewer real sources beat one invented one.** Mark any unverified entry `verify` and exclude it |
| `ai-declaration` | AI-use declaration template `.docx` | The form universities are starting to ask for: what tool, what for, what was the student's own work, signed statement |
| `survey-checklist` | Survey design checklist `.pdf` | One page. Sampling, question order, Likert scales, consent line, pilot. pdf skill |

**Guides** (in-app, gated, en + si, from static content)

| key | Guide | Notes |
|---|---|---|
| `apa-harvard` | APA 7 and Harvard, quick reference | Book, journal, website, government report, lecture slides, AI tool. Every example a Sri Lankan source. In-text and reference-list forms side by side |
| `first-week` | First week on campus | Moodle, reading a brief, file naming, PDF submission, asking for an extension, group work |
| `academic-email` | Academic email templates | To a lecturer, extension request, missed class, group-work problem, asking for a reference. Copy buttons. **The first two templates are also published free at `/campus/academic-email`** as the SEO sample |
| `ai-rules` | Using AI honestly | Help vs misconduct, what to declare, and the **AI-declaration generator**: checkboxes for what AI was used for + tool name → a ready English paragraph with a copy button. Pure client logic, no AI call |

---

## 3. Money path — what changes where

The existing path, unchanged in shape: `SubscribeButton` → `POST
/api/payments/payhere/checkout` writes a pending `Payment` → browser form-POSTs
to PayHere → PayHere calls `/api/payments/payhere/notify` →
`processPayHereNotification()` → `grantForPayment()` → `paidPatch()` mints the
receipt → PayHere returns the browser to `/payments/success?order=` →
`PaymentStatusWatcher` polls `/api/payments/status`.

Every change below is a branch beside the existing `cohort` branch. Where the
cohort branch is, a product branch goes; nowhere else.

### `lib/types.ts`
```ts
export interface SubjectProduct {
  feeLKR: number;
  accessDays: number;
  /** Granted free with every cohort seat. */
  includedWithCohorts?: boolean;
}
// Subject: product?: SubjectProduct;   — present only on packs; this is the product test
// Payment.kind: "monthly" | "cohort" | "product"
// ContentKind: add "pack"
// ContentItem.slug already exists — a pack file's slug is its item key from §2
```

### `lib/payments/pricing.ts`
`payableLKR`: `subject.product ? subject.product.feeLKR : subject.cohort ? … : priceLKR`.
`billingLabel`: product → `"one payment"`.

### `lib/payments/entitlements.ts`
- Extract the body of `grantCohortAccess` into a private `grantUntil({…, endsAt})`.
  `grantCohortAccess` calls it unchanged.
- Add `grantProductAccess({ uid, subjectId, tenantId, endsAt, source, paymentId })`
  → `grantUntil`. Same fixed-end, non-stacking rule; the comment says why
  (re-buying after expiry gets a fresh period from checkout, not a sum).
- `grantForPayment`: add `if (payment.kind === "product") return grantProductAccess({… endsAt: payment.periodEnd …})`.
  In the **cohort** branch, after the cohort grant: `await grantBundledProducts(payment, source)` —
  reads `listProducts()`, filters `includedWithCohorts`, grants each with
  `endsAt = now + accessDays`, `paymentId: payment.id`. Inside the choke point so
  the webhook, slip approval and manual entry all agree.
- `startFreeTrial`: refuse when `subject.cohort || subject.product` (same error).

### `lib/referrals.ts`
`applyReferralBonus`: return early on `kind === "cohort" || kind === "product"`.

### `lib/queries.ts`
- `listProducts()` / `getProduct(id)` — mirror of `listCohorts` / `getCohort`,
  filter `grade === "CAMPUS" && s.product`. Equality-only query, narrow in memory.
- `listSellableSubjects()`: include `(s.grade === "CAMPUS" && s.product)`.
- `listCohorts` / `getCohort` need no change — they already require `cohort`.

### `app/api/payments/payhere/checkout/route.ts`
After the cohort window check:
```ts
if (subject.product) {
  // Purchase de-dupe, not an access check: a live enrollment means "already bought".
  const e = await col.enrollments().doc(enrollmentId(user.uid, subjectId)).get();
  const cur = e.exists ? (e.data() as Enrollment) : undefined;
  if (cur && cur.status === "active" && cur.currentPeriodEnd > now)
    return NextResponse.json({ error: "already_owned" }, { status: 409 });
}
// Payment: kind: subject.product ? "product" : cohort ? "cohort" : undefined
// periodEnd: product ? now + accessDays*DAY : cohort ? cohort.endsAt : addMonths(now, 1)
// itemName: product or cohort → subject.name; monthly → `${name} — 1 month`
```
Read the enrollment directly rather than `hasAccess()` on purpose: `hasAccess`
says yes for a teacher, which would stop the owner rehearsing a purchase.

### `app/api/payments/slip/route.ts`, `app/api/teacher/payments/record/route.ts`
Same `kind` / `periodEnd` branch. The review route needs nothing —
`grantForPayment` ignores `months` for non-monthly kinds already.

### `app/api/payments/status/route.ts`
Add `kind: payment.kind ?? "monthly"` to the response.

### `components/payments/PaymentStatusWatcher.tsx`
On `kind === "product"`: heading "Your pack is ready", button "Open my pack" →
`/packs/${subjectId}`. Everything else unchanged.

### `components/payments/SubscribeButton.tsx`
Add `label?: string` (default stays "Pay monthly") and `kind?: string` passed
to `track("begin_checkout", …)`. Pack page passes `label={`Buy — ${formatLKR(fee)}`}`.

### `app/api/teacher/payments/simulate/route.ts`
Check it builds the pending payment through the same `kind`/`periodEnd`
rule; if it copies the checkout's branch, add the product case there too.

---

## 4. Files — what changes where

- `components/teacher/ContentUploadForm.tsx`: add `{ value: "pack", label: "Pack file" }`;
  when kind is `pack`, show a select of §2 download keys → posts `slug`.
  Accept list: add `.docx,.xlsx,.pptx,.ipynb,.csv,.ris,.bib,.zip,.txt`.
- `app/api/teacher/content/route.ts`: `kind` enum gains `"pack"`; optional
  `slug: z.string().regex(/^[a-z0-9-]+$/).max(40)`; store it on the item.
- `app/(teacher)/teacher/content/page.tsx`: use `listSellableSubjects()` so the
  pack appears in the subject picker. `components/teacher/ContentList.tsx`:
  `KIND_LABEL.pack = "Pack file"`, icon `inventory_2`.
- `storage.rules` `content/` write: widen `contentType` to also match
  `application/vnd.openxmlformats-officedocument.*|application/x-ipynb\+json|text/.*|application/zip|application/x-research-info-systems|application/octet-stream`.
  **The owner installs rules by pasting them into Firebase console → Storage →
  Rules** (as in `SETUP.md`). Say so in the PR description and in the console
  hint beside the Pack kind.
- `app/api/content/[contentId]/download/route.ts`: **no change.** It already
  gates on `hasAccess(uid, item.subjectId)` — the pack is a subject.
- `components/content/DownloadButton.tsx`: accept `expiredMessage?: string`;
  pack page passes "Your pack access has ended."

---

## 5. Screens

Build signed-in screens from `components/ds/` under `.ict-app`; the public
page from the `lp-*` landing system used by `app/(public)/campus-ready/page.tsx`.
No gradients, no emoji, pills for actions, sentence case, one orange thing per
region, one `Card variant="feature"` per screen.

### `lib/content/survival-pack.ts` (new, static, the one place the pack is described)
`SURVIVAL_PACK = { id: "campus-survival-pack", name, feeLKR: 1990, accessDays: 1095, tagline }`,
`PACK_ITEMS: PackItem[]` — `{ key, kind: "download" | "guide", icon, title: {en,si}, blurb: {en,si}, fileLabel?: "Word" | "Excel" | "Notebook" | "PDF" | "Zotero" }`,
`PACK_GUIDES: PackGuide[]` — `{ key, title: {en,si}, sections: [{ heading: {en,si}, body: {en,si}, templates?: [{ label, text }] }] }`.
Server resolves the locale and passes one language down, like `lesson-interactives.ts`.

### `app/(student)/packs/[subjectId]/page.tsx` — the pack, signed in
`requirePageUser(`/packs/${id}`)`; `getProduct(id)` else `notFound()`;
`hasAccess`, `getPayHereConfig`, `getPaymentSettings`, `listContent(id)`, `getT`, `localeAttrs`.
- `PageHeader` title + tagline.
- Feature card (cocoa): not owned → price, "one payment", `SubscribeButton`
  with the Buy label, bank-slip link if enabled, a `Notice` "Works on a phone
  for the guides; the Word and Excel files need a laptop or the mobile Office
  apps." Owned → "Yours until {date}", receipt link to `/account`.
- "What's inside" `SectionBar` → grid of item cards: `IconBadge`, title, blurb,
  `Badge` with file label. Owned + download → `DownloadButton` (matched by
  `slug` to the `ContentItem`; unmatched slot shows "Coming soon" `StatusChip`,
  never an error). Owned + guide → `ButtonLink` to the guide. Not owned → lock
  `StatusDot` + the blurb; the whole list is readable before buying, like the
  cohort week list.
- Leftover pack files with no slug: "More files" list.
- Footer line: AI-drafted, reviewed by Dr. Yasas. Not accredited by any university.

### `app/(student)/packs/[subjectId]/[guideKey]/page.tsx` — a guide
`hasAccess` denied → `redirect(`/packs/${id}`)`. Renders `PACK_GUIDES` sections
with `SectionHeading`; each `template` gets a `CopyButton` (new, tiny client
component: clipboard write + "Copied" state for 1.5s). The `ai-rules` guide
also mounts `AiDeclarationGenerator` (client): tool name input, checkboxes
(brainstorming, grammar, summarising sources, code help, translation), output
paragraph, copy. Dark world, `lang` attribute set.

### Dashboard `app/(student)/dashboard/page.tsx`
One `PackCard` in the Campus Ready section (create the section if no cohort is
showing): owned → "Open my pack" outline button; not owned → price + "See
what's inside" outline link. No second orange button on the dashboard.

### Nav `app/(student)/layout.tsx`
When the student owns a product, add `{ href: /packs/<id>, label: t("nav.pack"), icon: "inventory_2" }`
to the Campus Ready group (create the group if absent).

### Public sales page `app/(public)/campus-survival-pack/page.tsx`
`revalidate = 3600`. Reads `getProduct()` for the live fee (fallback to
`SURVIVAL_PACK.feeLKR`), never a per-visitor read. Sections, in order:
1. Hero: "Everything your first assignment assumes you already have." Price,
   one payment, instant access, phone OK for guides. CTA → `/packs/campus-survival-pack`
   (sign-in with `next` brings them straight back).
2. Inside the pack: the eleven items, grouped Downloads / Guides, icon + one line each.
3. Who it is for: post-A/L, first year, any year with a research project.
4. Free sample: link to `/campus/academic-email`.
5. Sinhala summary block (`lang="si"`), like the Campus Ready page.
6. Included free with Campus Ready → `CrossPromoBand` to `/campus-ready`.
7. FAQ (also `faqJsonLd`): phone or laptop; which apps; how to pay (card via
   PayHere, bank slip if on); refund rule for digital files; AI-drafted and
   reviewed; not accredited.
8. Footer with Terms, Privacy, Refunds.
Metadata: title "University Assignment Template, APA Guide & Study Kit for Sri Lankan Students",
keywords in en + si. `productJsonLd` (add to `lib/seo/json-ld.ts` if absent: Product with Offer in LKR).
Add to `app/sitemap.ts` with `/campus/academic-email`.

### `app/(public)/campus/academic-email/page.tsx` — free SEO sample
Two of the five templates, plain document layout like `/command-words`,
`ResourcePageCta` to the pack. Metadata targets "email to lecturer sample Sri Lanka" and the Sinhala form.

### `/campus-ready` landing
In `TAKEAWAYS`, the Survival Pack card body ends "Also sold on its own — see
the pack." linking to `/campus-survival-pack`.

### Teacher console `app/(teacher)/teacher/page.tsx`
A "Products" section beside Campus Ready: list from `listProducts()` (name,
fee, active, count of pack files from `listContent`), plus `CreateProductForm`
(id defaults to `campus-survival-pack`, name, fee, access days, included with
cohorts, description) → `POST /api/teacher/products` (new; mirror
`app/api/teacher/cohorts/route.ts`: teacher-only, zod, `priceLKR: 0`, merge,
`active` toggle via the same route). Hint under the form: "Upload the files under
Content with kind Pack, one per slot." English only.

---

## 6. Copy

Dictionary keys `pack.*` and `nav.pack`, en + si, in `lib/i18n/dictionary.ts`.
Sinhala is everyday spoken register; keep in English: pack, template, Word,
Excel, Python, Zotero, APA, Harvard, download, copy, AI.

Suggested en strings: `pack.onePayment` "{price}, one payment" · `pack.yoursUntil`
"Yours until {date}" · `pack.buy` "Buy — {price}" · `pack.open` "Open my pack" ·
`pack.inside` "What's inside" · `pack.seeInside` "See what's inside" ·
`pack.comingSoon` "Coming soon" · `pack.phoneOk` "The guides work on a phone. The
Word and Excel files need a laptop or the mobile Office apps." · `pack.aiNote`
"Drafted with AI and reviewed by Dr. Yasas Sri Wickramasinghe. Not accredited by
any university." · `pack.copied` "Copied".

Legal, plain words:
- `app/(public)/refund-policy/page.tsx`, new clause "Digital packs": full refund
  within 7 days if nothing was downloaded or opened; after a download, no refund,
  because a file cannot be returned; the guides say what they contain before you pay.
- `app/(public)/terms/page.tsx`, new clause "10. Digital packs": personal licence,
  no redistribution (the existing account-closure rule applies), AI-drafted and
  reviewed, access period stated on the pack page.

---

## 7. Generating the content

Do this in the same session, after the code, so the pack page can be checked
against real files. Use the docx, xlsx and pdf skills; the notebook is JSON.
Hand every file to the owner with `SendUserFile` and also commit the
generators under `scripts/packs/` and the outputs under
`content-packs/campus-survival-pack/` (not `public/` — a stable public path is
exactly what the signed-URL rule forbids). The owner uploads each file from
Teacher → Content with kind Pack and its slot.

Rules for the content:
- Sinhala explanation, English technical terms, the way a first-year talks.
- Every referencing example is a real, fetched Sri Lankan source, or it is not included.
- Synthetic data is labelled synthetic in the file and on the page.
- No emoji, sentence case, no "recognised", no "accredited", no university logos.
- Each guide ends with the AI-drafted-and-reviewed line.

Owner review checklist (put it in the PR description): open every download on a
phone and a laptop; read one guide in Sinhala end to end; run the notebook in
Colab; confirm the Zotero file imports; confirm nothing claims accreditation.

---

## 8. Order of work

Each step ends with `npm run typecheck && npm run lint && npm run build` clean,
one commit, one push to `claude/campus-ready-monetization-xf225s`.

1. Types, pricing, entitlements, referrals, queries, trial refusal. (§3, top half.)
2. Checkout, slip, manual record, status route, watcher, `SubscribeButton`, simulate check.
3. Content kind `pack`, slug, upload form, teacher content page, storage rules.
4. `lib/content/survival-pack.ts` with all eleven items and the four guides' full text, en + si.
5. Pack page, guide page, `CopyButton`, `AiDeclarationGenerator`, dashboard card, nav.
6. Teacher Products section + `/api/teacher/products`.
7. Public sales page, free sample page, landing takeaway link, sitemap, JSON-LD.
8. Refund and terms clauses; dictionary keys.
9. Generate the seven files; commit generators and outputs; send files to the owner.
10. PR description: what the owner does next (paste storage rules, create the
    product in the console, upload seven files, run one sandbox purchase with
    the self-test panel, then flip PayHere to live).

---

## 9. Verification

- `hasAccess` unchanged. A/L access and the cohort tests in
  `docs/campus-ready-handoff.md` §8 still pass.
- Create the product in the console; confirm it is absent from `/`, `/syllabus`,
  the A/L dashboard list, the sitemap's subject pages and `listCohorts()`.
- Sandbox purchase via Teacher → Payments self-test: `Payment.kind === "product"`,
  enrollment `currentPeriodEnd` ≈ now + 1095 days, one receipt in the yearly series,
  ledger and CSV show the pack's name and Rs 1,990.
- Second checkout attempt returns `already_owned`; the teacher can still record a
  manual payment.
- A cohort sandbox purchase also creates the pack enrollment when
  `includedWithCohorts` is on, and does not when off.
- Trial route returns `trial_not_available`; a referred pack purchase creates no
  referrer enrollment.
- Download a pack file signed in and owned → URL works; not owned → 403;
  copy the URL to a private window → still works for ten minutes, then fails.
- Guide page signed out → sign-in → returns to the guide. Sinhala renders with
  `lang="si"`.
- Success page after a product purchase says "Your pack is ready" and lands on `/packs/…`.
- Refund policy and terms show the new clauses. No page contains "accredited"
  or "recognised" in a positive claim.
- Bundle build output: no new client dependency; the pack pages add nothing to
  the shared bundle beyond `CopyButton` and the generator.

## 10. Do not

- Add a second access helper. `hasAccess()` stays the only check.
- Put the price or kind decision anywhere except `payableLKR()` and `grantForPayment()`.
- Key a PayHere order by anything but a per-attempt id (`buildOrderId`).
- Serve a file from `public/` or a stable Storage URL.
- Let the client write a payment, an enrollment or a content item.
- Add `t()` to the teacher console.
- Write long comments. Match the repo's "why, not what" style, two to four lines.
