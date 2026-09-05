# ICT Campus — working notes for Claude

Online tuition platform for Sri Lankan A/L ICT (Grades 12 & 13), Sinhala medium.
The owner is a teacher, not a developer.

## How to respond in this project

- **Never produce HTML artifacts.** Answer in plain text in the chat. This
  applies to every session, not just the one where it was asked.
- Keep explanations short and concrete. Prefer exact click paths and commands
  over concepts.
- The owner sets things up through the **browser**, not a terminal. Do not
  assume Node, a cloned repo, or a command line is available. If a change would
  force them onto a command line, look for a way to do it in-app instead.

## Project facts

| | |
| --- | --- |
| Firebase project ID | `srizone-1fc76` |
| Firebase project number | `272944098194` |
| GitHub repo | `ureshan2011/learningplatform` |
| Live branch | `main` (the only branch) |
| Hosting | Firebase App Hosting backend `learningplatform`, asia-southeast1, auto-deploys on push to `main` |
| Firestore region | asia-south1 (Mumbai) |
| Realtime Database region | asia-southeast1 (Singapore) |
| Live URL | `learningplatform--srizone-1fc76.asia-southeast1.hosted.app` |

Firebase must stay on the **Blaze** plan — App Hosting requires it. Free within
quotas.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Firebase Auth
(phone OTP) · Firestore · Realtime Database · Cloudflare R2 · Zoom · PayHere.

## Design system

The ICTCAMPUS system runs **two worlds from one palette**, and which one a
screen belongs to is decided by whether the visitor has signed in.

- **Cream world** — every public page. `.landing-ict` and the marketing
  components. Already built to the system.
- **Dark world** — everything behind sign-in, plus the sign-in page itself,
  scoped by `.ict-app` (see `app/globals.css`). Warm near-black surfaces,
  orange accent, cocoa for one feature banner per screen.

Tokens live once, at the top of `app/globals.css`, as `--color-ict-*`,
`--radius-ict-*`, `--shadow-ict-*`, `--ease-ict*`. `.landing-ict` aliases them,
so a colour is decided in exactly one place.

**Build signed-in screens from `components/ds/`** — `Button`/`ButtonLink`,
`Card`, `CardLink`, `Chip`, `Badge`, `StatusDot`, `StatusChip`, `IconBadge`,
`ProgressBar`, `StatCard`, `Avatar`, `Eyebrow`, `SectionHeading`, `PageHeader`,
`SectionBar`, `EmptyState`. Reach for a raw `<div className="rounded-xl border">`
only when the thing genuinely is not there, then add it there.

Rules that are easy to break:

1. **No gradient fills.** Flat orange, flat ink. The only permitted gradients
   are a protection scrim over imagery and the radial spotlight on a brand
   surface. `--color-awaken-rose` is aliased to the brand orange precisely so
   the ~50 legacy `from-accent to-rose` buttons resolve flat.
2. **Pills for actions, soft-squares for containers.** Buttons, chips, tabs,
   avatars, inputs are `rounded-full`; cards are 14/20/28px. A 4px "slightly
   rounded" corner is off-brand.
3. **Orange is rationed** — one orange thing per region of the screen. Neutrals
   do the structural work.
4. **Semantic colour is a 6px dot or a thin badge**, never a large fill. Use
   `StatusDot`/`StatusChip`/`Badge`.
5. **One `Card variant="feature"` (cocoa) per screen**, carrying the single most
   important thing on it.
6. **Line icons only** — `components/ui/Icon.tsx` is backed by Lucide. Never a
   filled icon set, never mixed weights. **No emoji anywhere**, in UI or copy.
7. **Sentence case** for headings and buttons. The only uppercase is `Eyebrow`.
   The orange full stop closes at most one headline per screen.
8. Motion is a 8-12px translate plus fade, 120/200/340ms, `--ease-ict`. No
   bounce, no spring, no infinite loops, never scale-from-zero.

The `.ict-app` scope also remaps the legacy `--color-awaken-*` variables to
their dark equivalents, so a screen nobody has migrated yet still renders
correctly on near-black. That is a floor, not a licence to skip the redesign.

**Navigation is `components/nav/AppShell.tsx`** for both roles: a 232px dark
rail on desktop, a bottom tab bar plus a "More" sheet on mobile. Route-group
layouts (`app/(student)/layout.tsx`, `app/(teacher)/layout.tsx`) build the nav;
pages render only their own content. Never add a per-page header or a "back to
console" link — the rail is the way back.

The supplied system is written for a New Zealand provider and its copy examples
use NZ register ("Kia ora", "programme"). **Ignore that half** — this is a Sri
Lankan platform. The visual system, casing and voice rules apply; the locale
does not.

## Language

English and Sinhala, switchable from the sidebar and from Account. **English is
the default and stays the default** — the interface has always been English, and
silently moving a returning student into another language is worse than letting
them choose.

- Copy lives in `lib/i18n/dictionary.ts`. Server components read it through
  `getT()` from `lib/i18n/server.ts`; client components take strings as props,
  because the dictionary never ships to the browser.
- The choice is a cookie (`ictclass_lang`), written by the `setLocale` server
  action. Not the user document: it has to work on the sign-in page where there
  is no user, and it must not cost a Firestore read per render.
- Wrap translated pages in `lang={loc.lang}` with `localeAttrs()`. The `[lang]`
  rule in globals.css gives Sinhala the extra leading and tracking it needs —
  Sinhala glyphs carry more detail per character and break down first.

**Writing the Sinhala.** Everyday spoken Sinhala, the way a 16-year-old actually
talks. **Technical words stay in English, in Latin script** — subscribe, XP,
Code Lab, SQL, Zoom, Live, Mock exam, rank, code — because that is what students
say out loud and what the exam itself uses. A coined Sinhala equivalent nobody
uses is harder to read than the English it replaced. Use the settled Sinhala
where one exists in daily use: පන්තිය, ගුරු, ගෙවීම්, නෝට්ස්.

The teacher console is **English only**, on purpose: one reader, who set the
platform up in English, and a half-translated accounting ledger is worse than an
untranslated one.

## Type scale

Tailwind's default scale is redefined in `@theme` — `text-xs` is 13px, `text-sm`
15px, `text-base` 17px — because most of this app was written in `text-sm` and
`text-xs`, and the audience reads Sinhala on cheap Android phones. Moving the
scale lifted every existing class at once. **Do not "fix" readability by
sprinkling bigger classes at call sites**; change the scale.

## Rules that must not be broken

1. **`hasAccess()` in `lib/payments/entitlements.ts` is the single access
   check.** Every gated resource goes through it. Never scatter access logic
   into pages or components.
2. **All live class traffic goes to Realtime Database, never Firestore.**
   Firestore bills per operation; a 1,000-student chat would exhaust the daily
   free quota in one class.
3. **Never subscribe a client to a Firestore collection.** Aggregate
   server-side into one node and let clients read that.
4. **All media from Cloudflare R2**, never Firebase Storage — R2 has no egress
   fees, and video/PDF egress is the main cost risk at scale.
5. **Only the server writes anything that grants access, moves money, or awards
   XP.** If a client can write it, a student can forge it.
6. **Zoom host `start_url` and RTMP stream keys live in `sessionSecrets`**,
   never on the session document — sessions are student-readable for the
   timetable.
7. **Never guess the Realtime Database URL.** Only us-central1 uses
   `.firebaseio.com`; other regions use `.<region>.firebasedatabase.app`. A
   wrong host fails silently.

## Money

Three ways in, one ledger: PayHere cards, uploaded bank slips, and cash or
transfers the teacher records by hand. All three land in `payments` and all
three get a receipt number from the same yearly series (`ICT-2026-0001`),
issued once, in a transaction, when a payment first becomes `paid`.

- **Teacher → Payments** (`/teacher/payments`) is the only money screen: slips
  to approve, the full ledger, month-by-month totals, CSV export, manual entry,
  the PayHere self-test, and the bank details students deposit into.
- Bank details and the identity printed on receipts live in Firestore
  (`settings/payments`), not env vars — the owner edits them from a phone. The
  public policy pages read the same document, so an unfilled field shows as a
  visible `[blank]`.
- Every PayHere notification is written to `paymentEvents` before it is acted
  on, accepted or rejected. That log is the only evidence when a student says
  they paid and nothing unlocked.
- PayHere credentials live in `settings/payments` too, entered in the console.
  Environment variables still win when present. `getPayHereConfig()` resolves
  the two; never read the env vars directly to decide whether cards are on.
- In sandbox mode the console can rehearse a notification through the real
  handler (`/api/teacher/payments/simulate`). It refuses in live mode, and must
  keep refusing — it mints a paid enrollment.
- PayHere order ids are unique **per attempt**. Never key them by billing month
  again: two payments in one month then collide, the second is dismissed as a
  duplicate, and the student pays for nothing.

## Optional services

Zoom, PayHere and R2 are each optional and detected at runtime by
`lib/features.ts`. When one is unconfigured, API routes return
`503 not_configured` and pages render a "not set up yet" card. Keep this
property — the app must always run with Firebase alone.

## Roles and admin

Four roles: `student`, `parent`, `teacher`, `admin`. There are **no passwords
anywhere** — the phone number is the account and the SMS code is the credential
— so "admin credentials" means a phone number, not a login.

- The first person ever to sign in becomes the teacher (`lib/auth/provision.ts`).
- **While no admin exists, a teacher may appoint the first one** — `set_role` to
  `admin` and nothing else, in `app/api/teacher/users/[uid]/route.ts`. Same
  self-heal as `claimTeacherIfVacant`, and for the same reason: otherwise a
  platform with no admin can never get one, and there is no terminal to fix it
  from. The door closes the moment an admin exists.
- **`ADMIN_PHONES`** (env, comma-separated) is the last-resort recovery path if
  every admin is somehow demoted: anyone listed becomes an admin on their next
  sign-in, whatever their stored role says. It lives **commented out** in
  `apphosting.yaml` — App Hosting rejects an env var with an empty value, so it
  cannot sit there blank waiting to be filled. Not a secret: signing in as that
  number still needs the code sent to the SIM.
- Everything else is done from **Teacher console → People** (`/teacher/users`):
  the full roll, searchable, with each person's subscriptions, payments,
  devices and history. Teachers may free devices and sign people out; **only an
  admin may change a role or switch an account off**, and the API enforces it.
  Nobody can demote themselves, and the last admin cannot be demoted.
- Any role change signs that account out (`revokeAllSessions`) — access rules
  read the role from token claims, so the change has to take effect now, not
  eventually.

## Sessions

Read `lib/auth/session.ts` before touching any of this.

1. **Session verification never makes a network call.** `verifySessionCookie` is
   called with `checkRevoked: false` — signature and expiry only. It used to be
   `true`, which asked Google's Auth backend on every page render and treated
   any transient failure as "signed out". That was the cause of constant
   spurious logouts.
2. **Revocation is `sessionsValidFrom` on the user document**, compared against
   the cookie's `auth_time`. It rides along with a read we already do.
3. **Revoking means both halves.** Always use `revokeAllSessions()` — it sets
   `sessionsValidFrom` *and* revokes refresh tokens. Setting only the first is a
   revocation that undoes itself, because `SessionKeeper` mints a new cookie
   from the still-valid refresh token seconds later.
4. **A Firestore failure must not sign anyone out.** `resolveSession` falls back
   to the role and tenant in the cookie's own claims.
5. **Cookies are 14 days (Firebase's maximum) and renewed silently.**
   `SessionKeeper` posts a fresh ID token to `PUT /api/auth/session` about once
   a day, so a student who keeps using the site never re-OTPs. Shortening the
   cookie does *not* save SMS money — it costs it, which is why it was raised
   from 5 days.
6. **Gated pages call `requirePageUser(next)` / `requireStaffPage(next)`**, never
   a hand-written `redirect("/signin")`. That is what returns a student to the
   class they tapped through to instead of dumping them on the dashboard.
7. **Client calls to gated routes use `fetchWithSession`**, which repairs a
   lapsed session and retries once. Never plain `fetch` — a raw 401 mid-action
   is how a finished mock exam gets thrown away.

## Devices

`MAX_DEVICES_PER_USER` caps students at 3 bound devices. **Teachers and admins
are exempt** — the owner has to open the console on a laptop, a phone and a
second browser to test what students see, and there is nobody above them to ask
for a reset.

**The device hash is `sha256(uid + clientId)` and nothing else.** It must never
mix in the user agent, platform or screen size again: all three change under a
student who has not touched anything (Chrome ships a new UA roughly monthly,
`screen.width` flips on rotation), each change minted a bogus "new device", and
the student was locked out behind a message telling them to find their teacher.

A capped student can free their own least-recently-used slot once a week
(`swapOldestDevice`). The teacher's backstop is Teacher console → People, or
Device reset (`/api/teacher/devices`) — the browser equivalent of
`scripts/admin.mjs release-devices`. Releasing one device signs out only that
browser, via the `ictclass_device` cookie; it must not revoke refresh tokens, or
freeing a broken phone's slot also kicks the student off the phone in their hand.

## Phone auth gotchas

Two separate settings, both under Authentication, both fail confusingly:

- **Authorized domains** — the live hostname must be listed, or sign-in fails
  silently with no SMS and no error.
- **SMS Region Policy** — must allow Sri Lanka, or you get
  `auth/operation-not-allowed`. Keep the allowlist to Sri Lanka only: an open
  list invites SMS-pumping fraud against the billing account.

SMS is billed per verification on Blaze, which is why sessions are long and
renew themselves — see **Sessions** above. Every avoidable trip to the sign-in
screen is a real invoice line.

## Bootstrapping

The first person to sign in on an empty project becomes the teacher
automatically (`lib/auth/provision.ts`). The teacher console offers a "Create my
A/L ICT class" button while none exist. Both exist so the platform can be set up
without a command line.

## Docs

- `SETUP.md` — the three-part browser-only setup
- `docs/services.md` — adding Zoom, PayHere, R2
- `docs/PLAN.md` — product roadmap and the reasoning behind the architecture

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
