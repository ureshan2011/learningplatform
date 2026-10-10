# Adding services

Reference for the optional services — Zoom, PayHere, class reminders and Google Meet.
**You don't need any of them to go live** — see `SETUP.md`. Add them one at a
time, and just ask in chat rather than working through this by hand.

Until one is connected, the app says "not set up yet" where it would appear
(`lib/features.ts` decides this). Nothing breaks.

File storage (notes, past papers, replays) isn't on this list — it needs no
separate setup at all; see below.

---

## Zoom — live classes

You need **two** apps in the Zoom Marketplace:

1. **Server-to-Server OAuth** — creates meetings and registers students.
   Scopes: `meeting:write:admin`, `meeting:read:admin`, `user:read:admin`.
   → `ZOOM_ACCOUNT_ID`, `ZOOM_S2S_CLIENT_ID`, `ZOOM_S2S_CLIENT_SECRET`
2. **Meeting SDK** — the embedded desktop player.
   → `NEXT_PUBLIC_ZOOM_SDK_KEY`, `ZOOM_SDK_SECRET`

Also set `ZOOM_HOST_USER_ID` to the Zoom user who hosts classes.

**Webhooks.** On the S2S app's *Feature* tab, add an event subscription pointing
at `https://<your-domain>/api/zoom/webhook`, subscribing to `meeting.started`,
`meeting.ended`, `meeting.participant_joined`, `meeting.participant_left` and
`recording.completed`. Copy the Secret Token into `ZOOM_WEBHOOK_SECRET_TOKEN`.
Attendance comes from these events, not from anything the student's browser
reports.

**Simulcast — the important part.** Enable *Custom Live Streaming Service*
(Settings → In Meeting (Advanced)). Requires Zoom Pro or above.

This is what stops your Zoom licence capping class size. The Zoom room holds the
paid seats; the simulcast mirrors the class to YouTube Live, and the app plays
that stream for mobile students and everyone beyond the seat limit. Since all
the interactivity lives in this app rather than in Zoom, those students get the
same class — not a lesser one.

---

## PayHere — card payments

### What PayHere asks for before approving you

- A **bank account** the settlements are paid into.
- **Business registration** for a business account. PayHere's own onboarding
  also has an individual/personal route — ask their support which applies to
  you before paying to register anything.
- **The site itself**, with contact details, terms, a privacy policy and a
  refund policy published and reachable without signing in. Those four pages
  exist at `/terms`, `/privacy`, `/refund-policy` and `/contact`, and are
  linked from the footer. They fill themselves in from
  **Teacher → Payments → Bank details & receipt identity** — until you enter
  your name, address and phone there, they render visible `[blanks]`.

### Configuration

**From the browser (the normal route).** Teacher → Payments → *Card payments
(PayHere)*: merchant id, merchant secret, mode. Saved to Firestore, read only
by the server, never sent back to a browser. This exists because setting an
App Hosting secret needs Secret Manager and a command line — without it, card
payments could not be switched on at all by the person who owns this platform.

**From the environment (optional).** `NEXT_PUBLIC_PAYHERE_MERCHANT_ID`,
`PAYHERE_MERCHANT_SECRET`, `NEXT_PUBLIC_PAYHERE_MODE`. When both id and secret
are present they win, and the console form goes read-only and says so.

Two things that are easy to miss and both fail *before* a card is entered:

- Sandbox and live are **separate accounts with separate credentials**. The
  sandbox merchant id and secret come from sandbox.payhere.lk; the live ones
  from the real dashboard. Swapping the mode without swapping the credentials
  fails every signature check.
- Your **domain must be added and approved** in the PayHere portal under
  Settings → Domains & Credentials. An unapproved domain has its checkout
  refused outright.

Notify URL (PayHere calls this; it is the only thing that unlocks a class):
`https://<your-domain>/api/payments/payhere/notify`

### Testing it

Everything is on **Teacher → Payments**, at the bottom: the mode it is running
in, the notify URL, and every notification PayHere has sent, with the reason
each was accepted or rejected.

The one thing that cannot be tested from a laptop is the notification itself:
PayHere calls the notify URL from their servers, so it has to be a real public
`https` address. In practice that means testing on the deployed site with the
mode still set to sandbox — the deployment is safe to test against, because in
sandbox mode no real card is ever charged.

**Rehearse it first.** In sandbox mode the same page offers *Run a sandbox test
payment*: it builds a notification for a real student, signs it with your real
merchant secret and feeds it through the same handler PayHere hits — same
signature check, same ledger write, same receipt, same unlock. If that works,
everything on this side is correct and anything still failing is at PayHere's
end. It refuses to run in live mode.

**Then the real pass:** sign in as a student on a second phone number in a
different browser → Pay monthly → pay with PayHere's published sandbox test
card → the class unlocks, the payment shows as **Paid** with a receipt number,
the notification is listed as `accepted`, and the Activity bell in the console
counts it within twenty seconds. If it stays **Pending** with no notification
listed, PayHere could not reach the notify URL — check the URL is your real
https domain and that the domain is approved. Nothing else causes that.

**Watch out:** `NEXT_PUBLIC_APP_URL` must be your real domain before enabling
this. PayHere's `notify_url` is built from it, and that notification is the only
thing that activates a paid enrollment — point it at a placeholder and students
pay but stay locked out.

### The other two ways to get paid

**Bank deposit slips work without PayHere at all**, and are how most Sri Lankan
parents pay tuition. Enter your account details in
**Teacher → Payments**, and students see them (with one-tap copy) on the
deposit page, upload a photo of the slip, and you approve it — correcting the
amount to whatever actually reached the account before you do.

**Cash and direct transfers** are recorded from the same page, under *Record a
payment you received*. They unlock the class and get a receipt number like any
other payment, so the books stay complete.

> **Auto-renewal is deliberately not wired up.** PayHere's Recurring API needs
> their PLUS plan (~Rs 3,990/month), which is not worth paying before there is
> revenue covering it. Students pay monthly from a reminder, and
> `grantAccess()` in `lib/payments/entitlements.ts` extends the period.
> Switching later changes `lib/payments/payhere.ts` and nothing else. Verify
> current fees before enabling live mode — PayHere changes them.

---

## Notes, past papers and replays — Cloud Storage for Firebase

Nothing to configure — this is the same Firebase project as everything else,
using the config already injected automatically. The one setup step is
deploying `storage.rules` once (see SETUP.md → "Optional — working on your
own computer"), which is also what bank slip upload needs.

Teacher → Content uploads a file straight from the browser to Storage (same
pattern as a student's bank slip), then records it in Firestore. A file is
never given a stable URL, paid or free: `lib/content/storage.ts` mints a
signed link valid for ten minutes, long enough to download and useless to
forward — `/notes` and `/past-papers` mint a fresh one on every hourly
regeneration.

Free tier: 5GB stored, 1GB/day served. Past that, Blaze billing is roughly
$0.026/GB stored and $0.12/GB served a month — cheap enough for this
platform's scale that it isn't worth a separate provider and a second set of
credentials just to avoid it. Revisit only if download volume grows enough
to matter.

---

## Google Analytics — traffic and conversion funnel

No credentials to enter anywhere. Firebase console → **Project settings** →
**Integrations** → **Google Analytics** → **Enable**. On the next deploy, the
measurement ID rides in on `FIREBASE_WEBAPP_CONFIG` the same way the rest of
the Firebase config already does — nothing to type into `apphosting.yaml`.

This is separate from **Teacher → Insights**, which already reports the
business numbers (revenue, at-risk students, weak topics) straight from
Firestore/RTDB. Google Analytics adds what that page doesn't: where visitors
come from, which pages they leave from, and device/browser/geography — plus
a few funnel events instrumented in the code:

- `page_view` — every route change
- `sign_up` / `login` — phone OTP verification, split by whether the account
  was just created
- `begin_checkout` — "Pay monthly" clicked
- `purchase` — a payment actually lands (`components/payments/PaymentStatusWatcher.tsx`),
  carrying the amount and provider, deduplicated per order so a page refresh
  can't double-count revenue

All of it lives behind `lib/analytics.ts` — it never throws and never blocks
a click if Analytics isn't enabled or the browser blocks it, so nothing about
enabling or skipping this can break the app.

---

## Where the values go

**Locally:** `.env.local`.

**In production:** `apphosting.yaml`. Non-secret values go inline; secrets go
into Cloud Secret Manager and are referenced by name:

```bash
firebase apphosting:secrets:set zoom-sdk-secret
```

Each service has a commented-out block in `apphosting.yaml` ready to uncomment.


---

## Class reminders — web push

"Your class starts in 15 minutes", on a student's phone. Free: no SMS, no
per-message cost, no extra account. Chrome on Android is what most students
use and it supports this; iPhone needs the site added to the home screen
first, which is worth saying to the students who ask.

Two steps, both in a browser.

**1. The Web Push key.** Firebase console → Project settings → Cloud Messaging
→ *Web Push certificates* → **Generate key pair**. Copy the public key into
`NEXT_PUBLIC_FIREBASE_VAPID_KEY` (there is a commented block for it in
`apphosting.yaml`). This is the only value that goes anywhere — sending is
authorised by the service account this project already has, so there is no
secret to store and nothing to rotate.

After this deploys, the *Class reminders* card on a student's Account page
becomes a working "Turn on reminders" button.

**2. The schedule.** App Hosting has no cron, so something has to call the
send endpoint. Google Cloud console → **Cloud Scheduler** → Create job:

| | |
| --- | --- |
| Frequency | `*/5 * * * *` |
| Timezone | Asia/Colombo |
| Target | HTTP |
| URL | `https://ictcampus.lk/api/cron/class-reminders` |
| Method | POST |
| Header | `x-cron-secret` = the value of `CRON_SECRET` |

Set `CRON_SECRET` to any long random string, stored as a secret:

```
firebase apphosting:secrets:set cron-secret
```

The endpoint refuses outright when `CRON_SECRET` is unset, and compares it in
constant time — it is the one route that can notify every student at once.

**Why both steps or neither.** Step 1 alone lets a student turn reminders on
and nothing ever arrives, which is worse than the button saying it is not set
up. Step 2 alone does nothing, because no browser is subscribed.

**What gets sent.** One notification per class, 15 minutes before it starts, to
students with an active subscription to that subject who have turned reminders
on. `remindedAt` is written to the class in a transaction before anything is
sent, so a scheduler that fires twice — or retries after a timeout — cannot
notify a thousand students the same thing twice. Dead tokens (uninstalled app,
cleared site data, revoked permission) are pruned automatically on the next
send.

---

## Google Meet — the Exam Pack's live class and consultations

The A/L ICT 2027 Exam Pack comes with a weekly live class ("Saturday live with
Dr. Yasas from New Zealand", Saturday 4pm Sri Lanka time by default) and a
30-minute one-to-one consultation per buyer. Both run on Google Meet. Once Google
is connected, the platform creates every Meet link itself, in your own Google
Calendar, with Google's reminders — you never create a meeting by hand.

**Optional, like everything on this page.** Without it, the pack still sells,
consultations are still booked and the live class still shows on the pack page;
you paste a Meet link into each week and each booking from the console instead.

All of it is done in a browser. The console walks through it too: Teacher
console → Exam Pack → Google Meet.

1. **Google Cloud console** (console.cloud.google.com), signed in as the Google
   account whose calendar should hold the classes. Choose the project
   `srizone-1fc76`.
2. **APIs & Services → Library** → *Google Calendar API* → **Enable**.
3. **APIs & Services → OAuth consent screen** → user type *External*, app name
   "ICT Campus", your email. Add the scope `.../auth/calendar.events`. Then set
   **Publishing status → In production**. Left in *Testing*, Google expires the
   connection every seven days and every Meet link stops being created.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   *Web application*. Under **Authorised redirect URIs** add exactly:
   `https://ictcampus.lk/api/teacher/google/callback`
5. Copy the **Client ID** and **Client secret** into Teacher console → Exam Pack
   → Google Meet, and save.
6. Press **Connect Google**. Google warns that the app is not verified — that is
   expected for your own app: *Advanced → Go to ICT Campus*, and allow calendar
   access.
7. Press **Check the connection**.

The client secret and the connection are stored in `settings/google`, which no
browser can read (firestore.rules). `GOOGLE_OAUTH_CLIENT_ID` and
`GOOGLE_OAUTH_CLIENT_SECRET` in the environment win over the console, the same
way PayHere's do.

**How the links behave.** Each week's live gets a new Meet, created the first
time a buyer opens the pack (or when you press *Prepare the next two weeks
now*), for this week and next. A student gets the link from the Join button,
from 15 minutes before — it is never printed into a page — so a link forwarded
to a group chat is dead the following week. Each consultation gets its own Meet
the moment it is booked. Nobody is invited by email: students wait in the Meet
waiting room and you let them in (*Admit all* for the live class).

**Limits of a free Google account.** Group calls end at 60 minutes and hold 100
people; one-to-one calls run up to 24 hours. Google One Premium or Google
Workspace lifts the group limits. Students need a Google account on their phone
to join — almost every Android phone has one.
