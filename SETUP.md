# Setup — 3 steps

Everything here is free. You need a card on file for Firebase's Blaze plan, but
you stay at **Rs 0** inside the free quotas.

---

## Step 1 — Firebase console

Go to [console.firebase.google.com](https://console.firebase.google.com) and:

1. **Create a project** — name it anything, e.g. `ictclass`
2. **Authentication → Sign-in method → enable Phone**
3. **Create Firestore Database** — start in production mode
4. **Create Realtime Database** — start in locked mode
5. **Upgrade to Blaze** (bottom-left) — needs a card, stays free within quotas
6. **Add a Web app** — Project settings → Your apps → Web (`</>`)
7. **Project settings → Service accounts → Generate new private key** — downloads a `.json` file

> **Tip:** while testing, add your own number under Authentication → Sign-in
> method → Phone → *Phone numbers for testing*. Real SMS costs money; test
> numbers don't.

## Step 2 — One command

```bash
npm install
npm run setup
```

It asks for your project ID and the path to that `.json` key, then does the
rest: writes your config, deploys the security rules, and creates the O/L ICT
and A/L ICT subjects.

Then run it:

```bash
npm run dev          # → http://localhost:3000
```

Sign in with your phone, then make yourself the teacher:

```bash
node scripts/admin.mjs make-teacher +94771234567
```

Sign out and back in to pick up the teacher role, then open `/teacher`.

## Step 3 — Go live

Firebase console → **App Hosting** → **Get started** → connect this GitHub repo
and pick the branch to deploy from.

**There is nothing to configure.** App Hosting supplies your Firebase config
automatically. Every push to that branch redeploys.

You'll get a URL like `https://ictclass.web.app`.

### One thing to do after the first deploy

**Authentication → Settings → Authorized domains → add your new domain.**

Without it phone sign-in fails *silently* — no error, no SMS. It is the single
most common thing to get stuck on.

---

## What works right now

| Works | Not set up yet |
| --- | --- |
| Phone sign-in, device limits | Live classes (Zoom) |
| Student dashboard, timetable | Card payments (PayHere) |
| Teacher console | Notes & past papers (R2) |
| Bank deposit slips + approval | |
| Subscriptions & access control | |

The three on the right show a plain "not set up yet" message where they would
appear. Nothing is broken — they just aren't connected.

---

## Adding features

Come back to this chat and ask. Each takes about 10 minutes:

- **"add zoom"** — live classes. Needs a Zoom account (Pro or above for the
  simulcast that lets classes grow past your seat limit).
- **"add payments"** — PayHere card payments. Needs a registered business and a
  business bank account. *Bank slips already work without this.*
- **"add notes"** — Cloudflare R2 for notes, past papers and replays. Free tier,
  no egress fees.

Or just ask for a feature: **"add the live quiz"**, **"add the parent
dashboard"**, **"add the AI doubt bot"**. See `docs/PLAN.md` for the roadmap.

---

## If something goes wrong

| Problem | Cause |
| --- | --- |
| No SMS when signing in | Domain not in Authentication → Authorized domains |
| `Missing required environment variable` | Re-run `npm run setup` |
| Teacher console redirects to dashboard | Sign out and back in after `make-teacher` |
| Someone lost their phone / changed device | `node scripts/admin.mjs release-devices +9477...` |

Deeper reference lives in `README.md`, and the product roadmap in `docs/PLAN.md`.
