# Handoff: sign-in flow redesign

This is an implementation brief for a Claude Code session. Everything below was
decided after reading the live code; do not re-open the decisions, build them.

**Read first, in this order, before touching anything:**

1. `CLAUDE.md` — especially "Design system", "Language", "Sessions", "Devices",
   "Phone auth gotchas". Every rule there applies to this work.
2. `components/auth/SignInForm.tsx` — the screen being replaced.
3. `app/api/auth/session/route.ts` and `lib/auth/session.ts`.
4. `components/auth/SessionKeeper.tsx` and `lib/auth/session-client.ts`.
5. `lib/auth/otp-budget.ts`, `lib/auth/device-client.ts`, `lib/phone.ts`.
6. `components/ds/index.tsx` and `docs/design-system/README.md`.
7. `node_modules/next/dist/docs/` for anything Next.js 16 specific.

Work on the branch you were given. Commit in small, described steps. Run
`npm run typecheck`, `npm run lint` and `npm run build` before every push; all
three must be clean.

---

## 1. The decision

**Phone number stays the only credential. Sign-in moves to the moment of
commitment, and the OTP screen is rebuilt on a state machine.**

Why not Google, email magic link, anonymous accounts or guest checkout:

- The phone number is the identity anchor of the whole business: receipts,
  PayHere customer details, the People screen, device caps, parent links and
  the teacher's WhatsApp follow-up are all keyed on it. Any second identity
  provider creates two accounts for one student the day they switch, and the
  owner has no terminal to merge them from.
- Email links open in the mail app's webview, not the browser that asked, and
  this audience does not check email. That is worse on mobile than SMS.
- Anonymous accounts would let a trial restart by clearing site data and would
  fill the People screen with nameless rows. The trial exists to capture a
  number the teacher can follow up.
- A card payment must be attached to an account before access is granted, so
  "guest checkout" still ends in a phone step. Doing it first is the same
  number of steps with less confusion.
- Cost: nothing new is added. SMS spend goes down, because the rebuilt screen
  stops the resends that the current bugs cause, and the returning-user path
  (14-day cookie, silent renewal) already means one SMS per device, roughly
  ever, once the race in §3.4 is fixed.

What "sign-in only when necessary" means here:

- Every public page stays public. Notes, past papers, syllabus, command words
  and the class page are already browsable without an account. Do not gate any
  of them.
- The moment of commitment is: start the trial, pay, join a live class, open
  paid material. Those are the only things that send anyone to sign-in.
- The thing the student chose is carried through sign-in and executed for
  them. Tapping "Start the free trial" on the marketing page must end with the
  trial running, not on a dashboard where they have to find the button again.

---

## 2. Root causes found in the current code

Fix all of these by replacement, not by patching the lines named.

### 2.1 "Wrong code", then signed in a few seconds later

`SignInForm.tsx`, the code input's `onChange`: when six digits are present it
calls `queueMicrotask(() => void verifyCode())`. `verifyCode` reads `code` from
React state, and the microtask runs before React has applied `setCode`. So the
value it verifies is the *previous* one: five digits when typing, or an empty
string when the OS autofills all six at once. Firebase rejects it with
`auth/invalid-verification-code`, the screen says "That code is not correct",
then the student taps Verify with the real value and it works. Same bug
produces "auto-submits while I am still typing".

### 2.2 Double verification

Nothing prevents the microtask verify and the form submit (Enter, or the
Verify button) from both calling `confirmation.confirm()`. `busy` is state, not
a ref, so both see `false`. The second call fails on a consumed confirmation.

### 2.3 Refresh or resend throws away a code that would have worked

The `ConfirmationResult` lives only in a ref. A refresh loses it, and every
resend replaces it, so the SMS that finally arrives from the *first* send is
refused as "wrong". Students then resend again. Firebase's `verificationId`
is a string that survives a reload and can be redeemed later with
`PhoneAuthProvider.credential(verificationId, code)`; the current code never
uses that.

### 2.4 `SessionKeeper` signs the browser out during first sign-in

`SessionKeeper.tsx` renews on `onIdTokenChanged`. That fires the instant the
OTP is confirmed, before `SignInForm` has posted to `/api/auth/session`. The
`PUT` finds no user document (new student) or no bound device (new device),
gets 401 `no_account` or 403 `device_released`, and calls `signOut()` on the
Firebase client. The `POST` still succeeds because it already holds an ID
token, so the student appears signed in, but the browser's Firebase user is
gone. Silent renewal can never run for that browser, `fetchWithSession` cannot
repair anything, and in 14 days they are back at the SMS gate. Every new
student and every new device hits this.

### 2.5 The reCAPTCHA challenge can hang "Sending…"

`#recaptcha-container` is an empty div at the bottom of the page. When Google
escalates the invisible check to a visible challenge on a suspicious network,
it renders there, often below the fold on a phone, and `signInWithPhoneNumber`
waits forever. The student sees a spinner, assumes the SMS went, and waits.

### 2.6 Intent is lost

`/al-ict-classes` and most public CTAs link to plain `/signin`. After the OTP
the student lands on `/dashboard` with nothing started.

---

## 3. What to build

### 3.1 Files

Create:

- `components/auth/sign-in/` — the new screen, split into small files:
  `SignInScreen.tsx` (client, owns the reducer), `PhoneStep.tsx`,
  `CodeStep.tsx`, `NameStep.tsx`, `DeviceLimitStep.tsx`, `machine.ts` (reducer,
  types, pure), `attempt-store.ts` (sessionStorage persistence of the current
  attempt), `phone-auth.ts` (thin wrappers around the Firebase calls).
- `app/(student)/go/page.tsx` — the intent runner (§3.6).
- `lib/i18n/dictionary.ts` — new `signin.*` keys (§3.8).
- `components/ds/index.tsx` — add `Input`, `Field` and `Notice` (§3.7).

Modify:

- `app/(public)/signin/page.tsx` — read `getT()` and pass copy as props;
  render the new screen. Keep `safeNext`, keep the already-signed-in redirect.
- `components/auth/SessionKeeper.tsx` — §3.4.
- `lib/auth/session-client.ts` — `signInHref` unchanged; export nothing new
  unless needed.
- `app/api/auth/session/route.ts` — §3.5.
- Public CTAs listed in §3.6.
- `components/payments/PaymentStatusWatcher.tsx` — §3.9.

Delete `components/auth/SignInForm.tsx` when the new screen is wired in.
Nothing else imports it.

### 3.2 The state machine

One reducer, one `phase`, one `notice`. Rendering is a pure function of the
state, so contradictory screens are impossible by construction.

```ts
type Phase =
  | { kind: "restoring" }                       // checking for an existing Firebase user, max 2s
  | { kind: "phone" }
  | { kind: "sending" }
  | { kind: "code"; status: "waiting" | "verifying" | "opening" }
  | { kind: "name" }
  | { kind: "device_limit"; devices: BoundDeviceView[]; canSwap: boolean; swapAvailableAt?: number }
  | { kind: "done" };                           // redirect issued

type Notice = { tone: "info" | "warning" | "danger" | "success"; text: string } | null;

interface Attempt {
  phone: string;                                 // E.164
  sends: { verificationId: string; sentAt: number }[];  // oldest first, keep at most 3
  wrongAttempts: number;
}
```

Rules:

- Every asynchronous action is guarded by a `useRef<boolean>` in-flight flag,
  never by state. A second call while one is running returns immediately.
- Exactly one notice slot on the screen. A new notice replaces the old one.
  Success never appears alongside an error.
- The Firebase `User` produced by a successful verification is held in a ref
  so retries of the session exchange, the device swap and the name step never
  need another SMS.

### 3.3 The code step

**Input.** One `<input>`, not six boxes. Six boxes break OS autofill on both
platforms. Attributes:

```tsx
type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*"
maxLength={6} enterKeyHint="go" autoFocus
```

iOS shows the code from Messages above the keyboard; Android Chrome fills it
from the SMS notification. Both need exactly this. Do not call the WebOTP API
(`navigator.credentials.get({otp})`): Firebase's SMS template does not carry
the `@domain #code` line it requires, so it can never match.

**Verification.** One function, `verify(raw: string)`, the only path to
Firebase:

1. `digits = raw.replace(/\D/g, "").slice(0, 6)`. If not exactly six, return.
2. If the in-flight ref is set, return. Set it. Phase → `code/verifying`. The
   input becomes `readOnly` while verifying.
3. For each send in `attempt.sends`, newest first:
   `signInWithCredential(auth, PhoneAuthProvider.credential(send.verificationId, digits))`.
   On `auth/invalid-verification-code` or `auth/code-expired`, try the next
   older send. Any other error stops the loop and is mapped by `messageFor`.
4. If every send refused it: `wrongAttempts += 1`, phase → `code/waiting`,
   notice `danger` "That code does not match. Check the newest SMS." Keep the
   digits in the field and select them. After the third wrong attempt add
   "Tap Send a new code."
5. If a send was older than the rest and was the one that succeeded, that is
   fine. It is the whole point: a late SMS from the first send still works
   after a resend.
6. On success, phase → `code/opening`, then §3.5.

**Auto-verify.** Call `verify(e.target.value)` from `onChange` when the digits
in the event value number exactly six. Pass the event value, never state. That
is the only auto-submit: it fires when the complete code is present and never
before. The form's `onSubmit` and the button call `verify(code)` with the
state value; the in-flight ref makes a double call harmless.

**Timing feedback.** Under the field show "Sent to 077 123 4567 · 12s ago",
updated every second. At 45s: "SMS can take up to a minute on some networks.
The code in it will still work." Do not hide the field, do not clear it, do
not auto-resend.

**Resend.** Uses `lib/auth/otp-budget.ts` unchanged (45s, 2min, 5min, 15min).
The button is a `Button variant="ghost"` showing the countdown while locked.
A resend appends a new send to `attempt.sends` (cap at three, drop the oldest)
and does not clear the field. After a resend the notice says `info` "New code
sent. Any code we sent you in the last few minutes still works."

**Expiry.** Treat `auth/code-expired` from Firebase as the truth; do not run a
client-side expiry clock. When *all* sends are refused with `code-expired`,
notice `warning` "That code has expired. Send a new one." and enable the
resend button regardless of the local budget countdown.

**Change number.** Clears the attempt from memory and sessionStorage, returns
to `phone` with the number still filled in.

### 3.4 `SessionKeeper` stands down during sign-in

In `SessionKeeper.tsx`:

- Read `usePathname()`. When the path is `/signin`, do nothing: no renew, no
  listeners. The sign-in screen owns the exchange on that page.
- Never call `signOut` on a 401. A 401 is `invalid_token` (a transient
  verification failure, which must not sign anyone out) or `no_account` (a
  sign-in in progress elsewhere). Keep the `signOut` for 403 only
  (`account_disabled`, `device_released`), which are real revocations.

### 3.5 Session exchange and the "opening" state

`openSession(user, { swapDevice? })` posts to `/api/auth/session` as now.

- On a network error or a 5xx, retry once after 800ms automatically. If it
  still fails, phase → `code/waiting`, notice `warning` "Your code was
  correct, but we could not open your session. Tap Retry." and show a Retry
  button that calls `openSession` again with the kept Firebase user. Never
  word this as a wrong code.
- `device_limit` → phase `device_limit` (keep the existing panel behaviour
  and copy, rebuilt with `Card variant="raised"` and `Button`).
- `account_disabled` → notice `danger`, stay on `code/waiting` with the input
  disabled.
- Success: store `localStorage["ictclass.lastPhone"] = e164`, clear the
  attempt store, call `track` and `identify` as now, then `isNewUser` →
  `name`, else phase `done` and `router.replace(next); router.refresh()`.
  Show a 300ms "Signed in. Opening…" state with a check icon before the
  redirect so the screen visibly resolves.

In `app/api/auth/session/route.ts` no behavioural change is required. Do
tighten one thing: `POST` must be safe to call twice with the same token
(it is, via the device transaction) and should return 409 `already_signed_in`
only if you find a reason to; otherwise leave it.

### 3.6 Carry the intent through sign-in

New page `app/(student)/go/page.tsx`, server component, `force-dynamic`:

- Query: `do=trial|subscribe`, `subject=<id>`. Anything else → `redirect("/dashboard")`.
- `const user = await requirePageUser("/go?do=…&subject=…")` (build the
  string from the validated params so the sign-in `next` brings them back
  here).
- `do=trial`: call `startFreeTrial`. Treat `trial_already_used` as success.
  Redirect to `/subjects/<id>`.
- `do=subscribe`: redirect to `/subjects/<id>` (that page already shows card
  and bank-slip options when locked).
- Render nothing; it only redirects. It lives in `(student)` so `AppShell` and
  the session helpers are in scope.

Change these public CTAs from `/signin` to `/go?do=trial&subject=al-ict`
(the subject id used across the public pages is `al-ict`):

- `app/(public)/al-ict-classes/page.tsx` lines ~211, ~259, ~457
- `app/(public)/syllabus/page.tsx` ~69
- `app/(public)/university-pathways/page.tsx` ~219
- `app/(public)/revision-plan/page.tsx` ~83
- `components/syllabus/SyllabusHero.tsx`, `components/syllabus/ClassCta.tsx`,
  `app/(public)/syllabus/[subjectId]/page.tsx` — these already pass
  `next=/subjects/<id>`; change to `/go?do=trial&subject=<id>`.
- `components/papers/PaperAttempt.tsx` ~164 — keep as a plain sign-in that
  returns to the current page (`signInHref()`-style `next`).

`SiteHeader`'s "Sign in" button must return the visitor to the page they were
on: wrap it in a small client component that reads `usePathname()` and links
to `/signin?next=<pathname>`. Keep the fallback `/signin` when the path is a
sign-in or payment page.

`signInUrl` and `safeNext` already accept a `next` with a query string. Verify
that `/go?do=trial&subject=al-ict` round-trips through
`/signin?next=%2Fgo%3Fdo%3Dtrial%26subject%3Dal-ict` and back.

### 3.7 Design system

The sign-in page is the threshold into the dark world: it renders inside
`.ict-app` and is built from `components/ds/`. Rules from `CLAUDE.md` that
this screen has broken before and must not again:

- Inputs are pills (`rounded-full`), as are buttons and chips. The current
  `rounded-ict-sm` inputs are off-brand.
- Flat orange, one orange thing per region: the primary button. The wordmark's
  orange "CAMPUS" is the only other orange on the screen.
- Errors are a thin line with a `StatusDot`, never a large red fill.
- Line icons from `components/ui/Icon.tsx` only. No emoji anywhere.
- Sentence case. No orange full stop on this screen; keep it for the dashboard.
- Motion: step change is an 8px translate plus fade, 200ms, `--ease-ict`.
  No spinner larger than the button's own; use the existing `ict-press`.

Add to `components/ds/index.tsx`, following the file's existing patterns and
the specs in `docs/design-system/components/forms/Input.prompt.md`:

- `Field({ label, hint, error, children })` — label above, hint or error below,
  error rendered as `StatusDot tone="danger"` plus text.
- `Input` — forwardRef pill input on `bg-ict-ink-800` with
  `border-ict-border-dark`, `focus:border-ict-orange-500`, 48px tall, 17px
  text; a `prefix` slot for the "+94" and a `size="lg"` for the code field
  (centred, 24px, `tracking-[0.4em]`).
- `Notice({ tone, children })` — the single notice slot: thin bordered row,
  `StatusDot`, text. Tones map to the existing `StatusTone` colours.

Use `Button` (`size="lg"`, `arrow="none"`, full width via `className="w-full
justify-center"`) for the primary action; `variant="ghost"` for resend and
change-number. Use `Card variant="raised"` for the device-limit panel. Do not
use `Card variant="feature"` here; the screen has no banner.

Layout: single column, `max-w-md`, vertically centred, `min-h-dvh`, 20px side
padding, wordmark top-left. The reCAPTCHA container renders *directly under
the Send button*, in flow, so a visible challenge is on screen. Put a 20s
timeout around `signInWithPhoneNumber`; on timeout clear the verifier, phase
→ `phone`, notice `warning` "That took too long. Tap Send code again."

### 3.8 Copy and language

The page becomes single-language. It is a server component, so read `getT()`
in `app/(public)/signin/page.tsx` and pass a `copy` object to the client
screen; the dictionary never ships to the browser. English is the default.
Add the keys under `signin.*` in `lib/i18n/dictionary.ts` for both languages.

Reuse the Sinhala already in `SignInForm.tsx` and `REASON_COPY` where the
meaning is unchanged. For new strings follow `CLAUDE.md`: everyday spoken
Sinhala, technical words (SMS, code, Zoom, Live) in Latin script.

English strings (the Sinhala is yours to write to the same meaning):

| key | text |
| --- | --- |
| title | Sign in |
| lead | Enter your mobile number and we will text you a code. No password. |
| phoneLabel | Mobile number |
| sendCode | Send code |
| sending | Sending… |
| codeLabel | Code from the SMS |
| sentTo | Sent to {phone} · {ago} |
| slowSms | SMS can take up to a minute on some networks. The code in it will still work. |
| verify | Continue |
| verifying | Checking… |
| opening | Signed in. Opening… |
| resend | Send a new code |
| resendIn | Send a new code in {wait} |
| resent | New code sent. Any code we sent you in the last few minutes still works. |
| changeNumber | Change number |
| wrongCode | That code does not match. Check the newest SMS. |
| wrongCodeAgain | That code does not match. Tap Send a new code. |
| expired | That code has expired. Send a new one. |
| sessionFailed | Your code was correct, but we could not open your session. Tap Retry. |
| retry | Retry |
| timeout | That took too long. Tap Send code again. |
| nameTitle | What should we call you? |
| nameHint | Shown on the class leaderboard. You can change it later in Account. |
| nameLabel | Your name |
| skip | Skip for now |
| continue | Continue |
| restoring | Signing you in… |

Keep the `reason` banners (`expired`, `revoked`, `device_released`,
`account_disabled`, `invalid`) and the referral line, moved into the
dictionary. Keep `messageFor`'s error mapping, including the authorised-domain
message that names `publicEnv.appUrl`.

Wrap the page in `lang={loc.lang}` with `localeAttrs()` like the other
translated pages.

### 3.9 Edge cases that must work

- **Refresh on the code step.** `attempt-store.ts` mirrors `Attempt` to
  `sessionStorage["ictclass_otp_attempt"]`. On mount, if an attempt exists
  with a send younger than 10 minutes, restore straight into
  `code/waiting` with the phone shown and the timer resumed from `sentAt`.
  No resend needed: the stored `verificationId` is redeemed with
  `PhoneAuthProvider.credential`.
- **Back button.** The step is component state, not a URL, so browser back
  leaves the page and returns to where they came from. `next` still works
  when they come back. Do not push history entries per step.
- **Second tab.** The Firebase client persists across tabs. Keep the
  `onAuthStateChanged` listener from the current "restoring" effect alive in
  every phase except while this tab's own exchange is in flight; when another
  tab completes sign-in, this tab's listener sees the user, runs the `PUT`
  renewal, and redirects to `next` on success.
- **Offline.** `navigator.onLine === false` at send or verify → notice
  `warning` "No internet. Turn on data or Wi-Fi and try again.", no request
  made. Listen for `online` and clear the notice.
- **Returning device.** Prefill the phone field from
  `localStorage["ictclass.lastPhone"]` when present. The "restoring" phase
  already redirects a browser that still holds a Firebase user; keep its
  2-second ceiling.
- **Interrupted checkout.** `PaymentStatusWatcher` uses `fetchWithSession`.
  When the response is 401 after the retry, render "Sign in to see this
  payment" as a `ButtonLink` to `signInHref()` so `next` carries the order id
  back to `/payments/success?order=…`. Access itself is granted by the
  PayHere notify handler regardless of the browser, so nothing is lost.
- **Rate limits.** Keep `otp-budget.ts` and Firebase's own limits. Map
  `auth/too-many-requests` to the 5-minute lock as now. Do not add a server
  rate limiter; the OTP is sent by Firebase, not by this app.

### 3.10 Non-goals

Do not add Google, Apple or email sign-in. Do not add anonymous auth. Do not
change the device cap, the cookie lifetime, `resolveSession`, `hasAccess`, or
anything under `lib/payments/`. Do not touch Firebase console settings; the
authorised-domain and SMS-region lists in `CLAUDE.md` are already correct.

---

## 4. Verification

There is no automated test suite. Before each push:

```
npm run typecheck && npm run lint && npm run build
```

Then walk this script on a real phone, using a Firebase test phone number
(Firebase console → Authentication → Sign-in method → Phone → "Phone numbers
for testing") so no SMS is billed:

1. Open `/al-ict-classes`, tap "Start the free 7-day trial". Expect
   `/signin?next=/go?…`, phone step, keyboard open.
2. Send. Expect the code step within 3s, timer counting, resend locked at 45s.
3. Type five digits. Expect nothing to happen. Type the sixth. Expect
   "Checking…", then "Signed in. Opening…", then the subject page with the
   trial active. No error is ever shown.
4. Sign out. Sign in again; on the code step refresh the page. Expect the
   code step to come back with the timer resumed. Enter the code. Expect
   success without a resend.
5. Sign out. Sign in; wait for the resend to unlock; tap resend; enter the
   *first* code. Expect success.
6. Enter a wrong code. Expect one notice, the digits selected, the field
   editable. Three wrong codes → the notice tells them to resend.
7. Turn on airplane mode, tap Send. Expect the offline notice, no spinner.
8. Open the site in a second tab on the sign-in page, complete sign-in in the
   first. Expect the second tab to redirect on its own.
9. After sign-in, open DevTools → Application → IndexedDB → `firebaseLocalStorageDb`.
   The Firebase user must still be present (this is the §2.4 regression test).
10. Sign in on a fourth device. Expect the device-limit panel, rebuilt with
    `Card`, with the swap button working.

Record what you tested and what you could not in the final commit message and
in your closing message.
