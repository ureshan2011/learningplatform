# Setup — all from the browser

No computer, no code, no command line. Everything below happens in two browser
tabs: the Firebase console and GitHub.

It's free. Firebase needs a card on file for the Blaze plan, but you stay at
**Rs 0** inside the free quotas.

---

## Part 1 — Switch on three things in Firebase

Go to [console.firebase.google.com](https://console.firebase.google.com) and
open your project.

### 1.1 Phone sign-in

**Build → Authentication → Get started → Sign-in method → Phone → enable → Save**

Then, on the same Phone panel, expand **Phone numbers for testing** and add your
own number with a code like `123456`. Real SMS costs money; test numbers don't.
Delete it before real students sign up.

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
| Backend name | anything, e.g. `ictclass` |
| Region | **asia-south1 (Mumbai)** |
| Firebase web app | **Create a new one** — it wires the config in for you |

Click **Finish and deploy**. First build takes 3–5 minutes.

**That is the GitHub link.** You never push from your own machine — Firebase
watches the repo. Every future change I make here lands on `main`, and your site
rebuilds itself.

---

## Part 3 — Two minutes after it deploys

### 3.1 Authorize your domain

Copy your new URL, then:

**Authentication → Settings → Authorized domains → Add domain** → paste it.

Without this, phone sign-in fails **silently** — no error, no SMS. It is the
single most common thing to get stuck on.

### 3.2 Sign in and set up your classes

1. Open your site, sign in with your phone.
   **The first person to sign in becomes the teacher automatically** — that's
   you. Everyone after is a student.
2. Go to `/teacher` and click **Create my two subjects** (O/L ICT and A/L ICT).

Done. Your site is live.

---

## What works now

| Working | Not set up yet |
| --- | --- |
| Phone sign-in, device limits | Live classes (Zoom) |
| Student dashboard, timetable | Card payments (PayHere) |
| Teacher console | Notes & past papers (R2) |
| Subscriptions & access control | |

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
| No SMS when signing in | Domain missing from Authentication → Authorized domains |
| Signed in but no teacher console | Someone else signed in first — use `make-teacher` |
| Build fails in App Hosting | Check the build log; live branch must be `main` |
| Site loads but no subjects | Click **Create my two subjects** on `/teacher` |
