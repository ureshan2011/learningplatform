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

Register a business (sole proprietorship is enough) **and** a business bank
account. PayHere will not approve a merchant account without one.

- `NEXT_PUBLIC_PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`
- Notify URL: `https://<your-domain>/api/payments/payhere/notify`
- Keep `NEXT_PUBLIC_PAYHERE_MODE=sandbox` until a full test payment has gone
  through end to end.

**Bank deposit slips already work without this**, and are how most Sri Lankan
parents pay tuition anyway. PayHere is an addition, not a prerequisite.

> **Auto-renewal is deliberately not wired up.** PayHere's Recurring API needs
> their PLUS plan (~Rs 3,990/month), which is not worth paying before there is
> revenue covering it. Students pay monthly from a reminder, and
> `grantAccess()` in `lib/payments/entitlements.ts` extends the period.
> Switching later changes `lib/payments/payhere.ts` and nothing else. Verify
> current fees before enabling live mode — PayHere changes them.

**Watch out:** `NEXT_PUBLIC_APP_URL` must be your real domain before enabling
this. PayHere's `notify_url` is built from it, and that notification is the only
thing that activates a paid enrollment — point it at a placeholder and students
pay but stay locked out.

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
