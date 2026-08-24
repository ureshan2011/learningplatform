# ICT Class — online tuition platform

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

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Firebase

Create a project, then enable:

- **Authentication → Phone** (add your own number under test numbers to avoid burning SMS credit while developing)
- **Firestore**
- **Realtime Database**
- **Storage**

Generate a service account key (Project settings → Service accounts) and put
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` into
`.env.local`. Keep the private key's `\n` escapes and wrap it in quotes.

Deploy the security rules:

```bash
npx firebase deploy --only firestore:rules,database,storage
```

The rules assume that **only the server writes anything that grants access,
moves money, or awards XP**. If a client can write it, a student can forge it.

### 3. Zoom

You need **two** Zoom apps in the Zoom Marketplace:

1. **Server-to-Server OAuth** — creates meetings and registrants.
   Scopes: `meeting:write:admin`, `meeting:read:admin`, `user:read:admin`.
   Fills `ZOOM_ACCOUNT_ID`, `ZOOM_S2S_CLIENT_ID`, `ZOOM_S2S_CLIENT_SECRET`.
2. **Meeting SDK** — the embedded desktop player.
   Fills `NEXT_PUBLIC_ZOOM_SDK_KEY`, `ZOOM_SDK_SECRET`.

On the S2S app's **Feature** tab, add the event subscription pointing at
`https://<your-domain>/api/zoom/webhook` and subscribe to `meeting.started`,
`meeting.ended`, `meeting.participant_joined`, `meeting.participant_left` and
`recording.completed`. Copy the Secret Token into `ZOOM_WEBHOOK_SECRET_TOKEN`.

For the simulcast, enable **Custom Live Streaming Service** in Zoom settings
(Settings → In Meeting (Advanced)). Requires Zoom Pro or above.

### 4. PayHere

Register a business (sole proprietorship is enough) and a business bank account
— PayHere will not approve a merchant account without one.

Start in **sandbox** mode. Set the notify URL to
`https://<your-domain>/api/payments/payhere/notify`.

> Auto-renewal is **not** wired up yet, deliberately. PayHere's Recurring API
> requires their PLUS plan (~Rs 3,990/month). Until there is monthly revenue to
> cover that, students pay once a month from a reminder and
> `lib/payments/entitlements.ts` extends the period. Switching to auto-renewal
> later changes `lib/payments/payhere.ts` and nothing else.
> Verify current fees and plan tiers before enabling live mode.

### 5. Cloudflare R2

Create a bucket and an API token. Fill the `R2_*` variables. Set a public
hostname for the bucket if you want free/SEO content served directly.

### 6. Seed and run

```bash
node scripts/admin.mjs seed          # creates the O/L ICT and A/L ICT subjects
npm run dev
```

Sign in once with your own phone, then promote yourself:

```bash
node scripts/admin.mjs make-teacher +94771234567
```

Sign in again to pick up the teacher role, then open `/teacher`.

---

## Deploying

**Host: Firebase App Hosting.** Same console as Auth/Firestore/RTDB, native
Next.js support, auto-deploy from GitHub, and a permanent free tier (10 GiB
egress/month, 180k vCPU-seconds). Because media serves from R2 with zero egress,
that 10 GiB carries only HTML and JS.

> **GitHub Pages cannot host this**, and it is not a limitation to work around.
> Pages serves static files and runs no server code, but this app has 9 API
> routes and 16 server-side secrets. Put `ZOOM_SDK_SECRET` in the browser and
> anyone can mint a *host* signature and take over a live class; put
> `PAYHERE_MERCHANT_SECRET` there and anyone can forge a payment. `hasAccess()`
> would run on the student's own machine, which means it would not run at all.
> **Static hosting and paid content are mutually exclusive.**
>
> Vercel's free Hobby tier is also unavailable: their fair-use terms prohibit
> commercial projects and name payment processing explicitly.

### 1. Create the backend

In the Firebase console → App Hosting → Create backend, connect this GitHub
repo, and pick the branch to deploy from (`main` for production).

### 2. Create the secrets

Six values are secrets. Each becomes a Cloud Secret Manager entry:

```bash
firebase apphosting:secrets:set zoom-sdk-secret
firebase apphosting:secrets:set zoom-s2s-client-secret
firebase apphosting:secrets:set zoom-webhook-secret-token
firebase apphosting:secrets:set payhere-merchant-secret
firebase apphosting:secrets:set r2-access-key-id
firebase apphosting:secrets:set r2-secret-access-key
```

`apphosting.yaml` references them by name, so it is safe to commit.

**There is no `FIREBASE_PRIVATE_KEY` in production.** The backend authenticates
with Application Default Credentials — the Cloud Run service account. The key
only exists in your local `.env.local`. A secret that is never stored cannot
leak.

### 3. Fill in the public config

Replace every `REPLACE_ME` in `apphosting.yaml`. These are `NEXT_PUBLIC_*`
values that Next.js inlines at **build** time — that is why they carry
`availability: [BUILD, RUNTIME]`. Drop `BUILD` and they compile to empty strings
and the app fails at runtime with no obvious cause.

### 4. Deploy twice — this trips everyone once

`NEXT_PUBLIC_APP_URL` is not cosmetic. PayHere's `return_url`, `cancel_url` and
**`notify_url`** are all derived from it, as is Zoom's simulcast `page_url`. But
you do not know your domain until the first deploy finishes. So:

1. Push with the placeholder. Let it deploy.
2. Copy the real backend URL from the Firebase console.
3. Put it in `apphosting.yaml`, commit, and let it redeploy.

Skip step 3 and PayHere posts payment confirmations into the void — students pay
and stay locked out.

### 5. Post-deploy checklist

| Do this | Or else |
| --- | --- |
| Add the domain to **Firebase Auth → Authorized domains** | Phone OTP fails **silently** — reCAPTCHA refuses to run and no SMS is ever sent |
| Set the **PayHere notify URL** to `<domain>/api/payments/payhere/notify` | Nothing ever activates a paid enrollment |
| Set the **Zoom webhook** to `<domain>/api/zoom/webhook` and re-run Zoom's validation | Attendance stops recording |
| Set a **budget alert** in Google Cloud Billing | App Hosting is pay-as-you-go past the free tier |

### Cold starts

`minInstances: 0` is free but means the first request to a cold backend waits a
few seconds. That is fine most of the time and bad at 6pm when a whole class
hits `/api/sessions/[id]/join` at once. Raise it to 1 before a big class, or
leave it at 1 once revenue covers it.

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
