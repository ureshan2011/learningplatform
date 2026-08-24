# ICT Class — working notes for Claude

Online tuition platform for Sri Lankan O/L and A/L ICT, Sinhala medium.
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
| Hosting | Firebase App Hosting, auto-deploys on push to `main` |
| Firestore region | asia-south1 (Mumbai) |
| Realtime Database region | asia-southeast1 (Singapore) |

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

## Optional services

Zoom, PayHere and R2 are each optional and detected at runtime by
`lib/features.ts`. When one is unconfigured, API routes return
`503 not_configured` and pages render a "not set up yet" card. Keep this
property — the app must always run with Firebase alone.

## Bootstrapping

The first person to sign in on an empty project becomes the teacher
automatically (`lib/auth/provision.ts`). The teacher console offers a "Create my
two subjects" button while none exist. Both exist so the platform can be set up
without a command line.

## Docs

- `SETUP.md` — the three-part browser-only setup
- `docs/services.md` — adding Zoom, PayHere, R2
- `docs/PLAN.md` — product roadmap and the reasoning behind the architecture
