# A/L ICT 2027 Exam Pack — handoff

**Status: built, off sale.** Nothing is sold and no student can see the pack
until the owner presses *Put it on sale* in Teacher console → Exam Pack. The
sales page 404s until then.

The flagship product: one card payment, Rs 9,900 by default, 400 days of access.

## What a buyer gets

| | Where |
| --- | --- |
| 2027 predicted Paper I — timed, server-scored, ranked against every pack holder | `/exam-pack/papers/predicted-2027-p1` |
| 2026 Paper I (the real one) — same | `/exam-pack/papers/al-2026-p1` |
| A walkthrough of all 100 questions, shown after submitting | `lib/content/*-walkthrough.ts` |
| 2027 predicted Paper II with mark scheme, and the focus-areas briefing | `/exam-pack/paper-2` |
| Personalised print copies (Save as PDF) of every paper and answer key | `/exam-pack/print/[doc]` |
| Six file slots for Dr. Yasas's own walkthroughs and revision sheets | Teacher → Content → Pack file → Exam Pack |
| One 30-minute consultation on Google Meet, booked in the app | `/exam-pack/consultation` |
| The weekly live ("Saturday live with Dr. Yasas from New Zealand"), Google Meet | Join button on `/exam-pack` |

Public sales page: `/al-ict-exam-pack` (cream, ISR every 5 minutes, in the
sitemap only while on sale). Console: `/teacher/exam-pack`.

## Decisions

- **A `Subject` with `grade: "AL"` and a `product` block** (`al-ict-exam-pack-2027`),
  created inactive by `ensureExamPack()`. `listSubjects()`/`getSubject()` now
  exclude anything with a `product` block, so the pack is never treated as a
  class; `listSellableSubjects()` keeps it, so the ledger names it.
- **Its own on/off switch**, `settings/examPack2027.enabled`, independent of
  `TRIAL_ONLY_LAUNCH`. The PayHere checkout checks the switch for this subject
  and the trial-only flag for everything else. The switch also flips the
  subject's `active`, like Campus Match's publish toggle.
- **Card only.** The slip route refuses the pack (`card_only`); the payment
  watcher never offers a deposit for it. The console will not put the pack on
  sale while PayHere is unconfigured. The teacher's manual-record route still
  accepts it — that is the override for a PayHere payment whose notification
  was lost.
- **Access** goes through `hasAccess()` and nothing else. Sittings, bookings and
  live links are only ever handed out behind `buyerRoute()` / `requireExamPackPage()`,
  which are thin wrappers over it.

## Invariants

1. **Answer keys never reach a browser before a sitting is locked.** A sitting
   in progress gets `SittingQuestion`s (no key). The key travels only in a
   `ReviewQuestion`, after submit, or in the gated print copy — and the answer
   print copies open only after that paper has been submitted.
2. **The server marks.** `submitSitting()` scores from `lib/exam-pack/papers.ts`;
   the browser's score is never trusted. First sitting only, locked in a
   transaction.
3. **Late submits are marked on the last autosave inside the time** (the paper
   autosaves every few seconds and when the tab is hidden), never refused and
   never on answers given after the deadline.
4. **One consultation per buyer** — the booking id is `${uid}_${subjectId}` and
   booking is a transaction over the slot and the booking together.
5. **Meet links are server-only.** `examPackLives` and `consultBookings` are
   closed to clients (firestore.rules). Students get a link from a POST, inside
   the join window. A new Meet every week.
6. **One Meet per week / per booking.** `attachMeet()` takes a lease and saves
   the Calendar event id before calling Google; a retry with the same id gets
   409 and reads the existing event back.
7. **Times are Sri Lanka wall-clock** (fixed +5:30) everywhere a student or the
   owner types or reads one. New Zealand time is display-only, on the console.

## Google Meet

OAuth web-server flow against the owner's Google account, scope
`calendar.events`, plain `fetch` (no SDK). Client id/secret and the refresh
token live in `settings/google`; env vars win for the client. Meet links come
from Calendar `events.insert` with `conferenceData.createRequest`. Setup steps
are in `docs/services.md` → Google Meet, and repeated on the console.

No scheduler is needed: each week's live is created on demand
(`ensureUpcomingLives`) when a buyer opens the pack, for this week and next.
After a Google failure, page views back off for five minutes; console retry
buttons force it.

## What to verify against the live project

Nothing here has run against live Firebase or Google yet. It typechecks, lints,
builds, and the pure logic is unit tested (`lib/exam-pack/*.test.ts`).

1. Console → Exam Pack loads; the checklist reflects PayHere and Google.
2. Connect Google; *Check the connection*; *Prepare the next two weeks now* —
   two events with Meet links appear in the owner's Google Calendar, at 4pm
   Sri Lanka time, shown in NZ time in the calendar.
3. Publish consultation slots for tomorrow.
4. With PayHere in **sandbox**: put the pack on sale, buy it as a student with a
   test card, land on "Your Exam Pack is ready".
5. Sit a paper; reload mid-paper (clock continues, answers kept); submit; see
   rank, weak topics and walkthroughs; print the answers.
6. Book a slot; check the event in Google Calendar; move it; book again.
7. Within 15 minutes of a live, press Join as the student.
8. Take it off sale; confirm the buyer still has everything and a new student
   gets a 404.
9. Switch PayHere to live before selling for real.

## Open questions for the owner

- **Review before selling.** The walkthroughs and predicted papers were drafted
  with AI. Read them in the console's preview before turning the pack on.
- **The monthly class also unlocks the predicted paper** at
  `/subjects/{id}/predicted-paper` when it is published there. Keep it, or keep
  the predicted paper exclusive to the pack.
- **Refund wording** on the sales page: "within seven days, if you have not
  started a paper or had your consultation". Check it matches the refund policy
  you want.
- **More papers.** Adding one is an entry in `lib/exam-pack/papers.ts` and an id
  in `PAPER_IDS`; the sitting, ranking, review and print all follow.
EOF
echo ok