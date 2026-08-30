# Adding services

Reference for the three optional services. **You don't need any of these to go
live** — see `SETUP.md`. Add them one at a time, and just ask in chat rather
than working through this by hand.

Until a service is connected, the app says "not set up yet" where it would
appear (`lib/features.ts` decides this). Nothing breaks.

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

- `NEXT_PUBLIC_PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`
- Notify URL: `https://<your-domain>/api/payments/payhere/notify`
- Keep `NEXT_PUBLIC_PAYHERE_MODE=sandbox` until a full test payment has gone
  through end to end.

Sandbox and live are **separate accounts with separate credentials**. The
sandbox merchant id and secret come from sandbox.payhere.lk; the live ones
from the real dashboard. Swapping the mode without swapping the credentials
fails every signature check.

### Testing it

Everything is on **Teacher → Payments**, at the bottom: the mode it is running
in, the notify URL, and every notification PayHere has sent, with the reason
each was accepted or rejected.

The one thing that cannot be tested from a laptop is the notification itself:
PayHere calls the notify URL from their servers, so it has to be a real public
`https` address. In practice that means testing on the deployed site with the
mode still set to sandbox — the deployment is safe to test against, because in
sandbox mode no real card is ever charged.

A full pass looks like: sign in as a student on a second phone number → Pay
monthly → pay with PayHere's published sandbox test card → the class unlocks
and the payment shows as **Paid** with a receipt number → the notification is
listed as `accepted`. If it stays **Pending** with no notification listed, the
notify URL is not reachable and nothing else is wrong.

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

## Cloudflare R2 — notes, past papers, replays

Create a bucket and an API token:

- `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` — the bucket's public hostname, for free/SEO
  content served directly

**Why R2 rather than Firebase Storage:** egress. Firebase bills roughly $0.15/GB
out; R2 bills nothing. One 5MB notes PDF downloaded by 3,000 students is 15GB —
a few dollars a month on Firebase for a single document, free on R2. At the
scale this platform aims for, that difference decides whether the subscription
price works.

Paid content is never given a stable URL: `lib/content/r2.ts` mints a signed
link valid for ten minutes, long enough to download and useless to forward.

---

## Where the values go

**Locally:** `.env.local`.

**In production:** `apphosting.yaml`. Non-secret values go inline; secrets go
into Cloud Secret Manager and are referenced by name:

```bash
firebase apphosting:secrets:set zoom-sdk-secret
```

Each service has a commented-out block in `apphosting.yaml` ready to uncomment.
