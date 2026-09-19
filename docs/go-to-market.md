# Go to market — what to sell, in what order, with no live classes

> Written 19 September 2026, against the repo as it stands at `8b2e3ee`.
>
> This is the commercial counterpart to `docs/PLAN.md`. PLAN.md answered "what
> should we build". This answers "what should we sell first, and why that and
> not the other thing". Where the two disagree, this file is newer and knows
> something PLAN.md did not: **the teacher cannot run live classes.**
>
> Market figures come from `docs/campus-ready-plan.md` §1 and the UGC data in
> `lib/content/ugc/SOURCES.md`. Re-check before quoting them in marketing.

---

## 1. The constraint that changes the strategy

The owner can record video, write lessons and build tutorials. The owner
**cannot run live classes**, and the A/L ICT tuition market is saturated.

Both halves of that matter, and together they invalidate an assumption that
runs through every earlier document in this repo.

`docs/PLAN.md` is built on a live Zoom class with an RTMP overflow stream and
a Live Arena beside it. `docs/campus-ready-plan.md` §3 puts "a 2-hour weekly
live class" at the centre of the 12-week programme and then names it, in §9,
as the main defence against completion collapse. Neither can be delivered.

That is not a small edit. It is the reason the plan below reorders the
products and redesigns Campus Ready.

### Why "saturated" is the more dangerous word

Sri Lankan A/L tuition is not bought the way a course is bought. Students buy
**a teacher**: a name their friends already say, a class they physically or
virtually attend at a fixed hour, and an exam track record. The incumbents'
moat is live presence plus local brand.

A new entrant who cannot teach live is attacking that moat with the one weapon
it is immune to. Recorded A/L ICT lessons are also the most pirated and most
price-compressed asset in the category — the thing that gets passed around a
Telegram group the week it is published.

**So: do not sell an A/L ICT class.** Not because the product is bad, but
because it competes on the single axis where this founder is weakest.

### Where the same assets are worth much more

`lib/seo/site.ts` already carries the credentials: a PhD from Canterbury, a
former University of Moratuwa lectureship, a senior lectureship in New Zealand,
70,000+ students taught online.

In A/L tuition those are close to commercially worthless. A Grade 13 student
choosing a class asks how many A's the teacher produced last year, not where
they did their doctorate.

One category over — **preparing students for university** — that same
credential set is the entire product. A former Moratuwa lecturer telling a
student what campus expects of them is the most credible voice available, and
there is no incumbent holding that position.

**The strategic call: the campus products are the business. A/L ICT is the
funnel that feeds them, repositioned so it stops competing with live classes.**

---

## 2. What is actually built

Readiness assessed by reading the code, not the handoffs.

| Product | Price | Built | Content still needed | Needs live? |
|---|---|---|---|---|
| **Campus Survival Pack** | Rs 1,990 | **Complete.** Seven files generated and committed under `content-packs/`, four in-app guides, sales page, self-seeding product | **None** | No |
| **Campus Match** | Rs 1,490 | **Near complete.** Eight rounds of verified UGC data, backtested forecast, free checker, report, order builder, degree profiles en+si, console panel | None — needs a live-data refresh each cycle | No |
| **Campus Ready** | Rs 30,000 | **Shell only.** Sellable and enrollable end to end; no lessons, no Python lab, no peer review, no certificate | ~40+ hours of video, 12 weeks of labs and rubrics | **Yes, as designed** |
| **A/L ICT class** | Rs 1,500–2,500/mo | Complete: practice engine, mock exams, predicted paper, labs, certificates, parent dashboard, XP | Ongoing lessons | As designed, yes |
| Public SEO pages | free | 15+ pages ranking on A/L ICT terms | — | No |

And one fact that governs everything below:

**`TRIAL_ONLY_LAUNCH` in `lib/payments/launch.ts` is `true`. The platform
currently cannot take a single rupee from anybody.**

---

## 3. The mistake to avoid

The owner's instinct — prioritise the campus side over A/L ICT — is correct.
The specific product is not.

Campus Ready is the wrong thing to start with, on four counts:

1. **It is the least built.** A sellable shell with no lessons in it.
2. **It needs the most content by an order of magnitude.** Forty hours of
   recorded video, twelve weeks of graded labs, a peer-review subsystem, a
   Python playground on Pyodide, a certificate and a verification page.
3. **Its completion model depends on the weekly live class that cannot
   happen.** Its own plan names this as the primary risk.
4. **Rs 30,000 is the hardest sale on the shelf** — to a brand with no
   reviews, no alumni and no accreditation, for a family that has just
   discovered what university will cost them.

Building it first means spending six months and all the content capacity
before learning whether one Sri Lankan student will pay this brand anything at
all.

**Start with the two products that are already finished, cost nothing more to
make, and answer that question in a fortnight.**

---

## 4. The calendar decides the sequence

Everything in this market is seasonal, and the seasons are fixed.

| When | What is happening | What sells |
|---|---|---|
| **Now, Sept 2026** | The previous cohort is being admitted to university | **Survival Pack** — peak week |
| Sept 2026 – Mar 2027 | The 2026-exam cohort sits in the dead window waiting for results | Survival Pack, nurture, list building |
| **1 April 2027** | Results day for the 2026 A/L. The single largest student-search moment of the Sri Lankan year | **Campus Match** |
| Apr – Jun 2027 | Application period, preference forms | Campus Match, Campus Ready pre-sell |
| **1 Aug 2027** | Selection results | Campus Match round two |
| **Jul / Sept 2027** | Admissions; students arrive on campus | **Campus Ready intake 1**, Survival Pack |
| Late 2027 | A/L 2027 exam | Predicted paper, mock exams, past papers |

Two consequences fall straight out of this table.

**The Survival Pack's best week of the year is happening right now, and
payments are switched off.** New undergraduates are arriving on campus this
month. The product that sells to them is finished, committed, and unreachable.

**Campus Match has no audience until April 2027.** It is the most valuable
product in the repo and it cannot earn anything for six months. That time is
not spare — it is exactly the runway the SEO cluster needs to index before
results day, and the window in which the audience has to be built.

---

## 5. The plan

### Phase 0 — Now to end of October 2026: take one real payment

The only goal is to falsify the core assumption cheaply. Not revenue, not
scale — proof that a Sri Lankan student will hand this brand money online.

1. **Make `paymentsPaused()` per-product rather than global.** Today it is one
   boolean over the whole platform. The Survival Pack and Campus Match are
   finished products that should sell now; the A/L monthly class is the thing
   being repositioned and should stay free while that happens. This is a small
   change to `lib/payments/launch.ts` and the routes that read it.
2. **Rehearse the purchase in PayHere sandbox** through Teacher → Payments →
   self-test, then take one real payment on the owner's own card, then refund
   it. Confirm the receipt number, the ledger row and the CSV export.
3. **Launch the pack at Rs 990, not Rs 1,990**, described honestly as a
   founding price for the first 100 buyers. The first hundred sales are not
   being bought for revenue; they are being bought for testimonials, for
   "1,000+ students" on the sales page, and for the knowledge of whether the
   funnel converts at all. Rs 990 is an impulse; Rs 1,990 is a decision, and a
   decision needs social proof this brand does not yet have.
4. **Ask every buyer for one line and their university.** A testimonial from a
   named first-year at a named campus is the single missing asset across all
   four products. Ask on the pack page after first download, and by SMS a week
   later.
5. **Post it where the audience already is.** Facebook groups for new
   undergraduates of each university, the university-entrant WhatsApp and
   Telegram groups, and a comment on every "what to bring to campus" thread.
   This is manual, unglamorous and the only distribution available in month one.

**Phase 0 succeeds at 30 paying customers and 10 usable testimonials.** If it
produces 3, the problem is distribution or trust, and it is much better to
learn that now than after recording forty hours of Campus Ready.

### Phase 1 — Nov 2026 to Mar 2027: build the audience, publish the cluster

This is where the recording capacity finally gets pointed somewhere, and the
target is deliberately not Campus Ready lessons.

**YouTube in Sinhala is the one channel where recorded-only is an advantage.**
A live class is gone the moment it ends; a video published today still earns
in 2029. Sinhala search and Sinhala YouTube for "campus first year", "APA
referencing", "Zotero", "assignment", "Z-score" is close to empty. That is
uncontested ground, and it is the same ground the SEO cluster targets.

1. **Publish the SEO cluster from `campus-ready-plan.md` §2 now.** `/after-al`,
   `/campus/apa-referencing`, `/campus/zotero`, `/campus/turnitin`,
   `/campus/ai-rules`, `/campus/first-year-guide`,
   `/campus/degree-requirements/<faculty>`. It needs months to index before
   1 April. Published in April, it is worthless in April.
2. **Add the `/si/` Sinhala routes** for those public pages, with `hreflang`.
   Locale is a cookie, so Googlebot only ever sees English today — the Sinhala
   long tail is unreachable until this exists. See `campus-ready-handoff.md` §7.
3. **One video a week, every week, forever.** Each one answers exactly one
   question a student types, in Sinhala, with English technical terms, and ends
   pointing at the free checker or the pack. Twenty videos by April is a
   library; two is a channel nobody subscribes to.
4. **Capture email and phone on every free page.** `EmailCaptureForm` and the
   leads console already exist. The list built between now and April is what
   makes results day work — an audience assembled on the day is not an audience.
5. **Move lapsed A/L students into a campus nurture sequence automatically.**
   `campus-ready-plan.md` §6 item 1 — highest-ROI acquisition available, and it
   is a few lines against the existing enrollment lifecycle.
6. **Redesign Campus Ready to not need a live class.** See §7 below. Do this on
   paper in this phase; do not record a single lesson until Phase 2 proves the
   audience exists.

### Phase 2 — April 2027: Campus Match, the one day that matters

Everything in Phase 1 exists to make this day work.

1. **The free checker on `/university-pathways` is the magnet.** Public,
   rankable, no login, inputs carried in the URL so a shared WhatsApp link
   reproduces the result. This is the results-day loop.
2. **Refresh the data the week the UGC publishes**, run the pipeline in
   `scripts/campus-match/`, confirm `SOURCES.md` and `BACKTEST.md`, then flip
   `published`.
3. **Campus Match is the moat.** Eight rounds of extracted UGC data and a
   calibrated forecast is not something a tuition teacher can answer with a
   Facebook post. It is built from engineering and data, which is what this
   founder actually has, rather than from teaching hours, which is what he does
   not.
4. **Every buyer is tagged as a Campus Ready lead** for the intake that opens
   after selection results.

Campus Match at Rs 1,490 has a commercial property none of the others do: it
costs less than a family spends on the day out to check results, it answers a
question every single one of 176,000 qualified candidates is asking in the
same week, and the answer is worthless a month later — so nobody haggles and
nobody shares it, because it is personal to one Z-score and one district.

### Phase 3 — July to September 2027: Campus Ready, small and honest

Not 250 students. **30 to 50, at a founding price of Rs 12,500 to 15,000.**

The reasoning is not timidity. Completion rate, not demand, is the binding
constraint on this product — its own plan says so — and the second intake is
sold on the first intake's results. Fifty students who finish, get graded
certificates and post them on LinkedIn will sell the January 2028 intake at
full price. Two hundred and fifty who drop out in week four will kill the
product permanently and generate refund demands the business cannot absorb.

Frame the price honestly: first intake, founding price, smaller cohort, direct
access to the teacher, and tell me what is wrong with it. That is true, it is
attractive, and it sets expectations a first intake can actually meet.

Build order inside this phase, tightest first: weeks 1–4 recorded (the
"foundations" strand the marketing leads with) → auto-graded quizzes on the
existing `lib/practice/engine.ts` → weeks 5–12 → Python lab → peer review →
certificate and verification page.

### Phase 4 — ongoing: A/L ICT, repositioned

See §6. Runs alongside all of the above; it is the funnel, not the product.

---

## 6. What ICT Campus becomes

Do not shut it down. Three reasons:

1. **It is the top of the funnel for everything else.** Every A/L student
   captured today is a Campus Match buyer 12 months later and a Campus Ready
   buyer 14 months later. The ranking pages — command words, logic gates,
   number systems, past papers, the predicted paper — are the traffic that
   feeds the campus line. Killing the A/L side kills the campus funnel.
2. **It is already built and costs nothing to keep.**
3. **The list is the asset**, not the monthly fee.

But change what it sells.

**From** "join my A/L ICT class" — which competes head-on with live mass-class
teachers on their own axis, and loses.

**To** "the practice and past-paper system your class does not give you."

That is a complement, not a substitute. It is sold to a student who is already
paying Rs 2,000 a month to a tuition teacher, and it does not ask them to
leave. It is also exactly what software does better than a live teacher, and
exactly what this platform already has: the practice engine, mock exams with
marking, the predicted paper, the labs, the revision plan, progress tracking
and the parent dashboard.

Three concrete changes:

- **Reposition the copy.** "Whoever teaches your class, ICT Campus makes sure
  you pass." Lead the landing page with papers, marking and the predicted
  paper, not with lessons.
- **Reprice.** Rs 1,500–2,500/month is class pricing and invites a class
  comparison this product loses. Either Rs 500–750/month as an obvious
  add-on, or better, **one payment of about Rs 4,900 for the whole year to the
  exam**. A single payment also removes renewal churn, renewal SMS cost and the
  entire recurring-billing problem for a solo operator — and it matches how the
  product is really used, which is hardest in the three months before the exam.
- **Put the recorded lessons behind the papers, not in front of them.** Lessons
  are the pirated commodity; marked practice and a personalised weak-area plan
  are not, because they are worthless to anyone but the account holder.

---

## 7. Campus Ready without a live class

The weekly live class was doing three jobs. Each needs a replacement, and none
of the replacements requires the owner to be in a room at a fixed hour.

| The live class provided | Replace with |
|---|---|
| A deadline that creates urgency | **Weekly drip release plus a weekly deadline.** Never publish all twelve weeks at once. A course released in full is a course nobody starts. The quiz closes on Sunday night and the cohort leaderboard updates — that is the pressure |
| The feeling of a real teacher present | **A weekly recorded "week review".** Students upvote questions in-app during the week; the owner records 15–20 minutes answering the top ones by name, published every Friday. Asynchronous, twenty minutes of work, and it reads as personal because it is |
| Social presence, the sense of a class | **A cohort chat on Realtime Database, plus the existing XP, streaks and leaderboard.** Already built, already the substitute for mentors in the original plan |

Two additions that matter more without a live anchor:

- **Nudges when a student falls behind.** The at-risk detection in the existing
  platform stops being a nice-to-have and becomes the completion mechanism.
- **Say it plainly on the sales page.** "Self-paced with weekly deadlines. No
  live classes — every lesson is recorded, so you watch it when you can, and
  you get a recorded answer video every Friday." Sold as the design, not
  apologised for as a gap. For a student on a rural connection sharing a family
  laptop, this is genuinely the better product, and saying so is honest.

`campus-ready-plan.md` §3 and §8 both need updating to match. The laptop
requirement, the no-mentoring design and the non-accredited certificate must
stay stated publicly — removing the live class does not soften any of those.

---

## 8. Pricing, decided

| Product | Plan said | Recommend | Why |
|---|---|---|---|
| Survival Pack | Rs 1,990 | **Rs 990 founding, first 100**, then 1,990 | Buying testimonials, not revenue. Impulse beats decision when there is no social proof |
| Campus Match | Rs 1,490 | **Rs 1,490, unchanged** | Correctly priced. Urgent, personal, time-limited, unshareable |
| Campus Ready | Rs 30,000 | **Rs 12,500–15,000 for intake 1**, Rs 30,000 from intake 2 | Intake 1 buys completion data and alumni proof. Intake 2 sells on it |
| A/L ICT | Rs 1,500–2,500/mo | **Rs 4,900 once, to the exam** | Stops competing with tuition classes; kills churn and renewal SMS |

The bundle to build once all three campus products exist: Campus Match plus
the Survival Pack at a price below the sum, sold on results day, with the pack
credited against a Campus Ready seat later. That turns one results-day
purchase into a relationship.

---

## 9. Risks, stated honestly

1. **Nobody has paid anything yet.** Every number above is a hypothesis. Phase
   0 exists specifically to falsify it for the cost of a fortnight.
2. **The student is not the payer.** The parent pays, and for the campus
   products the family has just discovered what university will cost. Rs 30,000
   for an unaccredited certificate, days after their child got a free state
   university place, is a hard conversation. Rs 1,490 is not. This is the
   strongest single argument for the ordering in §5.
3. **Self-paced completion rates are brutal** — typically under ten per cent.
   §7 is the whole answer, and it is unproven. Measure intake 1 honestly before
   scaling, exactly as `campus-ready-plan.md` §9 says.
4. **Solo capacity.** Four products, one pair of hands. The sequence is the
   strategy; doing two phases at once is how none of them ship.
5. **The pack will be shared.** Accept it. Price low, sell trust and
   convenience, and keep the high-value products personal (Campus Match) or
   gated behind graded work (Campus Ready).
6. **Campus Match depends on the UGC publishing on time** and in the same
   format. The pipeline in `scripts/campus-match/` is the mitigation; a format
   change costs a session, not a product.
7. **TVEC registration** is skipped by decision. Unchanged risk. Never write
   "recognised" or "accredited", and take a lawyer's view once revenue allows.

---

## 10. The first two weeks

In order. Items marked **owner** cannot be done in code.

1. Make `paymentsPaused()` per-product; open payments for the Survival Pack
   only.
2. Set the pack's founding price to Rs 990 in the teacher console, with the
   "first 100" line on the sales page. **owner** for the price; code for the copy.
3. Run one sandbox purchase end to end from Teacher → Payments. Then one real
   card payment, then refund it. **owner**
4. Add a testimonial request to the pack page after first download, and a
   one-question SMS a week after purchase.
5. **owner:** post the pack in ten new-undergraduate Facebook and WhatsApp
   groups. Personally, as Dr. Yasas, not as an advertisement.
6. **owner:** record and publish the first three Sinhala YouTube videos —
   "campus එකේ පළවෙනි සතිය", APA referencing, and what Turnitin actually checks.
7. Start the SEO cluster: `/after-al` and `/campus/apa-referencing` first, since
   they carry the most search volume and both already have source material in
   the pack guides.
8. Reposition the A/L landing copy from class to practice system.

Review at 30 days against one number: **paying customers.** Not visits, not
sign-ups, not trial starts. If it is above 30, Phase 1 starts. If it is under
10, the problem is distribution and trust, and nothing in Phase 1 fixes that —
go back to §5 Phase 0 item 5 and do it properly before writing more code.
