# Setup — all from the browser

No computer, no code, no command line. Everything below happens in two browser
tabs: the Firebase console and GitHub.

It's free. Firebase needs a card on file for the Blaze plan, but you stay at
**Rs 0** inside the free quotas.

---

## Part 1 — Switch on three things in Firebase

Your project is **`srizone-1fc76`** (project number `272944098194`), already
pinned in `.firebaserc`. Open it here:

**https://console.firebase.google.com/project/srizone-1fc76/overview**

### 1.1 Phone sign-in

**Build → Authentication → Get started → Sign-in method → Phone → enable → Save**

Then, on the same Phone panel, expand **Phone numbers for testing** and add your
own number with a code like `123456`. Real SMS costs money; test numbers don't.
Delete it before real students sign up.

### 1.1b Allow SMS to Sri Lanka

**Authentication → Settings → SMS Region Policy → Allow → tick Sri Lanka → Save**

New projects block SMS to every country by default, as protection against
SMS-pumping fraud. Without this you get:

> `Firebase: SMS unable to be sent until this region enabled by the app
> developer. (auth/operation-not-allowed)`

**Allow Sri Lanka only.** Every student is in Sri Lanka, and an open allowlist
lets an attacker pump verification requests to expensive destinations on your
card. Keeping the list to one country caps that risk at nearly nothing.

### 1.2 Firestore

**Build → Firestore Database → Create database**

- Location: **asia-south1 (Mumbai)** — closest to Sri Lanka
- **Start in production mode**

Production mode locks out direct browser access, which is correct: this app
reads Firestore only from the server, so nothing is blocked.

### 1.3 Realtime Database

**Build → Realtime Database → Create Database**

- Location: **Singapore (asia-southeast1)**
- **Start in locked mode**

Not used until live classes arrive, but making it now saves a trip back.

When you get there, copy the URL shown at the top of the Data tab — it will look
like `https://srizone-1fc76-default-rtdb.asia-southeast1.firebasedatabase.app`.
Paste it to me then. Only us-central1 databases use the older
`.firebaseio.com` form, so this URL cannot be guessed from the project ID.

### 1.4 Blaze plan

Bottom-left, click the **Spark** badge → **Upgrade** → **Blaze** → add a card.

Set a budget alert when it offers (Rs 5,000 is a sensible ceiling). Required for
App Hosting; free within quotas.

---

## Part 2 — Connect GitHub and go live

**Build → App Hosting → Get started**

Then, in order:

| Prompt | Answer |
| --- | --- |
| Connect to GitHub | Authorize, and install the Firebase app on `ureshan2011/learningplatform` |
| Repository | `ureshan2011/learningplatform` |
| Root directory | `/` (leave as-is) |
| Live branch | **`main`** |
| Automatic rollouts | **On** |
| Backend name | **`learningplatform`** — matches `firebase.json` |
| Region | **asia-southeast1 (Singapore)** — same region as the Realtime Database |
| Firebase web app | **Create a new one** — it wires the config in for you |

Click **Finish and deploy**. First build takes 3–5 minutes.

**That is the GitHub link.** You never push from your own machine — Firebase
watches the repo. Every future change I make here lands on `main`, and your site
rebuilds itself.

---

## Part 3 — Two minutes after it deploys

### 3.1 Authorize your domain

**https://console.firebase.google.com/project/srizone-1fc76/authentication/settings**

→ **Authorized domains** → **Add domain** → paste exactly:

```
learningplatform--srizone-1fc76.asia-southeast1.hosted.app
```

No `https://`, no trailing slash — just the hostname.

Without this, phone sign-in fails **silently** — no error, no SMS. It is the
single most common thing to get stuck on.

### 3.2 Sign in and set up your classes

1. Open your site, sign in with your phone.
   **The first person to sign in becomes the teacher automatically** — that's
   you. Everyone after is a student.
2. Go to `/teacher` and click **Create my A/L ICT class**.
3. Go to **Teacher → Payments** and fill in *Bank details & receipt identity*.
   This is what students see when they pay by deposit, and what gets printed on
   receipts and into the terms, privacy and refund pages. Until it is filled in,
   students have no account number to pay into.

You can take money from day one this way — bank deposits and cash both work
with no payment gateway at all. See `docs/services.md` for adding PayHere card
payments on top.

Your site: **https://learningplatform--srizone-1fc76.asia-southeast1.hosted.app**

---

## What works now

| Working | Not set up yet |
| --- | --- |
| Phone sign-in, device limits | Live classes (Zoom) |
| Student dashboard, timetable | Card payments (PayHere) |
| Teacher console | Notes & past papers (R2) |
| Subscriptions & access control | |
| Bank deposits, cash, receipts, ledger | |

The three on the right show a plain "not set up yet" message where they'd
appear. Nothing is broken — they just aren't connected.

---

## Adding features

Come back to the chat and ask. Each takes about 10 minutes:

- **"add zoom"** — live classes. Needs a Zoom account, Pro or above for the
  simulcast that lets classes grow past your seat limit.
- **"add payments"** — PayHere cards. Needs a registered business and business
  bank account.
- **"add notes"** — Cloudflare R2 for notes, past papers and replays.

Or ask for product features: **"add the live quiz"**, **"add the parent
dashboard"**, **"add the AI doubt bot"**. Roadmap in `docs/PLAN.md`.

---

## Optional — working on your own computer

Only if you want to run it locally or use the admin commands:

```bash
git clone https://github.com/ureshan2011/learningplatform
cd learningplatform
npm install
npm run setup      # asks for your project + service account key
npm run dev
```

Admin commands (need `npm run setup` first):

```bash
node scripts/admin.mjs make-teacher +94771234567    # promote someone
node scripts/admin.mjs release-devices +94771234567 # they changed phone
```

**Bank slip upload** is the one feature needing security rules deployed:

```bash
npx firebase-tools deploy --only storage
```

Or paste `storage.rules` into the console under **Storage → Rules → Publish**.

---

## If something goes wrong

| Problem | Cause |
| --- | --- |
| No SMS, no error at all | Domain missing from Authentication → Authorized domains |
| `SMS unable to be sent until this region enabled` | Sri Lanka not allowed in Authentication → Settings → SMS Region Policy |
| Signed in but no teacher console | Someone else signed in first — use `make-teacher` |
| Build fails in App Hosting | Check the build log; live branch must be `main` |
| Site loads but no subjects | Click **Create my A/L ICT class** on `/teacher` |
