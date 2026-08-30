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
- PayHere order ids are unique **per attempt**. Never key them by billing month
  again: two payments in one month then collide, the second is dismissed as a
  duplicate, and the student pays for nothing.

## Optional services

Zoom, PayHere and R2 are each optional and detected at runtime by
`lib/features.ts`. When one is unconfigured, API routes return
`503 not_configured` and pages render a "not set up yet" card. Keep this
property — the app must always run with Firebase alone.

## Phone auth gotchas

Two separate settings, both under Authentication, both fail confusingly:

- **Authorized domains** — the live hostname must be listed, or sign-in fails
  silently with no SMS and no error.
- **SMS Region Policy** — must allow Sri Lanka, or you get
  `auth/operation-not-allowed`. Keep the allowlist to Sri Lanka only: an open
  list invites SMS-pumping fraud against the billing account.

SMS is billed per verification on Blaze. Session cookies last 5 days
(`lib/auth/session.ts`) partly to keep that cost down — shortening them
multiplies the SMS bill.

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
