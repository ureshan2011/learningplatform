# ICT Class — online tuition platform by Yasas

Interactive live-class platform for Sri Lankan **O/L and A/L ICT**, Sinhala medium.
Zoom hosts the live room; everything around it — access control, payments, the
timetable, notes and (from Phase 2) the in-class interactive layer — lives here.

The full system plan, including the growth, AI and gamification phases, is in
`docs/PLAN.md`.

---

## The one architectural decision worth knowing

Zoom's participant cap is a licence you buy, and Meeting SDK participants count
against it. Left alone, that caps class size and then taxes it heavily.

So the class is delivered two ways at once:

- **Zoom meeting** — the interactive room, holding as many seats as the licence allows.
- **RTMP simulcast → YouTube Live (unlisted) → HLS in our own player** — unlimited
  additional viewers at no marginal cost, and the better experience on mobile
  (less data, no app switch).

Because all interactivity is built in this app rather than inside Zoom, a
simulcast student gets the same class as a Zoom student. **Class size is limited
by ambition, not by the Zoom invoice.**

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind 4 | SSR gives the public notes/past-paper pages an SEO acquisition channel |
| Auth | Firebase Auth, phone OTP | The phone number is the identity anchor; one account per real number |
| Durable data | Firestore | Users, subjects, enrollments, sessions, payments, content |
| Live data | **Realtime Database** | Chat, presence, reactions, quiz state. Firestore bills per operation and a 1,000-student chat would exhaust the daily free quota in one class |
| Media | **Cloudflare R2** | Zero egress fees. A 5MB PDF × 3,000 students is 15GB/month — free on R2, billable everywhere else |
| Live video | Zoom (S2S OAuth + Meeting SDK) | Reliability students already trust |
| Payments | PayHere + bank deposit slips | Bank transfer is still how most Sri Lankan parents pay tuition |

Firebase must be on the **Blaze** plan — Cloud Functions and server-side
outbound calls do not work on Spark. Set a budget alert before your first class.

---

## Setup

**See [SETUP.md](SETUP.md)** — three steps, about 15 minutes.

The short version: create a Firebase project, run `npm run setup`, then connect
the repo in the Firebase console under App Hosting. Nothing to configure — App
Hosting supplies the Firebase config automatically.

Zoom, card payments and file storage are **not** needed to go live. Each shows a
plain "not set up yet" message until connected; add them one at a time via
[docs/services.md](docs/services.md), or just ask in chat.

> **GitHub Pages cannot host this**, and it is not a limitation to work around.
> Pages serves static files and runs no server code, but this app has 9 API
> routes and 16 server-side secrets. Put `ZOOM_SDK_SECRET` in the browser and
> anyone can mint a *host* signature and take over a live class; put
> `PAYHERE_MERCHANT_SECRET` there and anyone can forge a payment. `hasAccess()`
> would run on the student's own machine, which means it would not run at all.
> **Static hosting and paid content are mutually exclusive.**
>
> Vercel's free tier is also out: their terms prohibit commercial projects and
> name payment processing explicitly.

### Cost guardrails

`apphosting.yaml` caps `maxInstances: 5` on purpose — App Hosting is
pay-as-you-go past the free tier, and an unbounded cap is how a bad query
becomes a large bill. Set a budget alert in Google Cloud Billing too.

`minInstances: 0` is free but means a few seconds' cold start on the first
request. Raise it to 1 shortly before a big class so a whole cohort is not
waiting on a cold start at once.

---

## Verifying it works

Do these in order — each one has caught a real class of bug:

1. **Payments.** Sandbox checkout → pay → confirm `enrollments/{uid}_{subjectId}`
   flips to `active` and the subject unlocks. Then cancel a payment and confirm
   it stays locked. The `/payments/success` page grants nothing on purpose; only
   the webhook does.
2. **Access control.** An expired student, a shared registrant link, and a third
   device must each be rejected. Test with real second and third devices — an
   incognito window shares too much state to prove anything.
3. **Zoom.** Schedule a class, join from desktop (embedded SDK) and from Android
   (HLS), and confirm attendance rows appear from the webhooks rather than from
   anything the client reported.
4. **Cost.** After each pilot class, open Firebase usage and divide the day's
   cost by attendee count. If Firestore reads moved during a live class, live
   data has ended up in the wrong database. Know your cost per student per class
   *before* you scale.
5. **A real pilot.** Run one free class for ~30 students before charging anyone,
   and measure the join success rate on mobile data specifically.

```bash
npm run typecheck
npm run build
```

---

## Where things live

```
app/(public)      landing, sign-in, payment result pages   — indexable, no auth
app/(student)     dashboard, live class, subject notes
app/(teacher)     teacher console
app/api           auth, payments, Zoom, content, webhooks
components/player ZoomEmbed · HlsPlayer · Watermark
components/live   JoinClass (picks Zoom vs simulcast)
lib/auth          session cookies, device binding, provisioning
lib/payments      PayHere + entitlements (hasAccess is THE access check)
lib/zoom          S2S OAuth, meetings, registrants, SDK signatures
lib/content       R2 signed URLs
scripts/admin.mjs seed, make-teacher, release-devices
```

### Rules that keep this cheap at scale

These are not style preferences — they decide whether the subscription price
works at 5,000 students:

1. All live traffic goes to **RTDB**, never Firestore.
2. Never subscribe a client to a collection. Aggregate the leaderboard
   server-side into **one** node and let clients read that.
3. Slow-mode chat and rate-limit reactions — unbounded fan-out is the only way
   to make RTDB's per-GB bill large.
4. All media from **R2**, never Firebase Storage.
5. Denormalise; precompute anything read more than it is written.

### Revenue protection

Content leaking is the largest revenue leak in Sri Lankan online tuition:

- Phone OTP — one account per real number
- Max 2 bound devices, teacher-resettable via `scripts/admin.mjs release-devices`
- Unique Zoom registrant link per student per session
- Drifting watermark carrying the student's name over every player
- Short-lived signed URLs for every download
- Phase 3: Capacitor/TWA wrapper with `FLAG_SECURE` to block Android screen recording

---

## Status

**Phase 1 (this code):** auth, device binding, subscriptions, bank slips,
entitlements, Zoom scheduling and gated join, attendance, notes delivery,
teacher console.

**Phase 2 (next):** the Live Arena — in-class quizzes, live leaderboard, chat,
reactions, raise-hand — plus XP/streaks, the simulcast player at scale, replays
and the parent dashboard.

**Phase 3:** Gemini doubt bot over your own notes, auto-quiz generation, answer
marking, weak-area plans, churn detection, SEO content engine, referrals.

**Phase 4:** multi-tenancy. Every document already carries `tenantId`, so
onboarding other teachers for a revenue cut needs no migration.
