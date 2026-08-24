# Sri Lanka Online Tuition Platform — System Plan

## Context

The repo `ureshan2011/learningplatform` is **empty** (no commits). This is a greenfield build.

**Goal:** become the highest-earning ICT tuition teacher in Sri Lanka with the largest classes, by replacing the traditional mass-class model with a platform that is more interactive and more engaging than a normal LMS.

**Confirmed constraints (from you):**
- Live teaching happens on **Zoom**, but class links, access and the whole experience live **inside the platform**.
- You build it yourself with Claude Code.
- **Monthly subscription per subject**, Rs ~1,000–2,500/month.
- **Sinhala medium teaching, English UI.**
- Start on free tiers (Firebase, free AI), upgrade as revenue grows.
- Subject: O/L ICT and A/L ICT.

### The one hard truth to design around

Zoom's participant cap is a licence you buy, and Meeting SDK participants count against your Zoom plan. Approximate plan capacities: Pro ≈ 100, Business ≈ 300, Large Meeting add-on 500/1000, Zoom Webinars 500/1000/3000. So **Zoom alone will cap and then tax your "biggest class in Sri Lanka" goal** — a 3,000-seat Zoom is thousands of dollars a year.

**The fix is architectural, and it's cheap:** Zoom Pro and above can simulcast the meeting to a **custom RTMP destination**. So:

- **Zoom meeting = the interactive room** (capped by your licence — this is your paying "front row").
- **RTMP simulcast → YouTube Live (unlisted) → HLS player embedded in your app = unlimited overflow viewers at Rs 0.**
- **Your app supplies all the interactivity for everyone** — quizzes, leaderboard, chat, reactions, doubt-raising — so an overflow viewer still gets the full experience, not a lesser one.

This means class size is limited by your ambition, not by Zoom's invoice. It is also the single most important decision in this plan.

**Prerequisite (non-code):** register a sole proprietorship + business bank account. PayHere requires it, and you can't take card payments without it.

---

## 1. Product strategy — what actually makes this win

Three engines, all of which must exist in the platform:

| Engine | What it does | Why it serves your goal |
|---|---|---|
| **Acquisition** | Free public notes/past-paper pages (SEO), free recorded intro lessons, referral rewards | Free organic student flow. "Highest number of students" is won at top-of-funnel, not in the classroom |
| **Engagement** | Live Arena (quizzes/leaderboard/reactions), XP, streaks, badges, school & district rankings | Immersion + fun + habit. This is your differentiation vs Zoom-and-a-WhatsApp-group |
| **Retention** | AI doubt bot, weak-area detection, at-risk churn alerts, **parent dashboard** | Retention *is* revenue on a subscription model. Parents pay the fees — show them attendance and marks and they don't cancel |

**The parent dashboard is a sales weapon, not a nice-to-have.** In Sri Lanka the parent writes the cheque. Attendance, quiz marks and a progress trend sent to a parent every week is the cheapest churn reduction you can build.

---

## 2. Architecture

```
                    ┌──────────────── Next.js PWA (student / teacher / parent) ────────────────┐
                    │  Landing + SEO pages │ Live Arena │ Notes │ Practice │ Leaderboard │ Parent │
                    └────────────┬──────────────────────────────────────┬─────────────────────────┘
                                 │                                      │
                    ┌────────────▼───────────┐            ┌─────────────▼──────────────┐
                    │  Firebase (Blaze)      │            │  Live layer                │
                    │  Auth · Firestore      │            │  Realtime DB (chat,        │
                    │  Storage · FCM         │            │  presence, reactions,      │
                    │  Cloud Functions       │            │  live quiz state)          │
                    └────┬──────────┬────────┘            └────────────────────────────┘
                         │          │
          ┌──────────────▼──┐   ┌───▼────────────┐   ┌──────────────┐   ┌─────────────┐
          │ Zoom S2S OAuth  │   │ PayHere        │   │ Gemini API   │   │ Cloudflare  │
          │ API + webhooks  │   │ (checkout +    │   │ (free tier)  │   │ R2 (notes,  │
          │                 │   │  webhooks)     │   │              │   │ zero egress)│
          └────────┬────────┘   └────────────────┘   └──────────────┘   └─────────────┘
                   │
      ┌────────────▼─────────────┐
      │ Zoom meeting (paid seats)│──RTMP simulcast──► YouTube Live (unlisted) ──HLS──► overflow viewers
      └──────────────────────────┘                                                     (unlimited, free)
```

**Stack**
- **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** — SSR gives you the SEO acquisition channel; one codebase for student/teacher/parent via role-based routing.
- **PWA, mobile-first.** Most SL students are on mid-range Android with metered data. Installable, offline notes cache, low-data mode (audio-only / 360p toggle).
- **Firebase**: Auth, Firestore (durable), **Realtime Database (all live/ephemeral traffic)**, Storage, FCM, Cloud Functions.
- **Cloudflare R2** for notes/PDFs/recordings — zero egress fees, which matters enormously at Sri Lankan scale.
- Firebase **Blaze plan is mandatory** (Cloud Functions can't make outbound calls on Spark). Set a hard budget alert at Rs 5,000/month on day one.

---

## 3. The live class — core of the product

### 3.1 Session lifecycle

1. Teacher schedules a session in the teacher console → Cloud Function calls **Zoom Server-to-Server OAuth API** to create a meeting with **registration required**, stores `meetingId` on the session doc.
2. Student opens the session page → function verifies **active subscription + device limit + not already joined elsewhere** → creates a **Zoom registrant** for that student → returns their **unique join URL**.
   - Unique registrant links are your best anti-sharing measure: a shared link means two people fight over one seat, and Zoom logs exactly whose link it was.
3. **Join path depends on device:**
   - **Desktop:** Zoom **Meeting SDK (Component View)** embedded in the page, with `userName` forced to `Name | Phone`. Never leaves your app.
   - **Mobile:** the embedded Zoom web SDK is unreliable on mobile browsers. Serve the **HLS simulcast player inside the PWA** instead — lower data, no app switch, and the interactive panel sits right beside the video. This is the *better* mobile experience, not a fallback.
   - **Overflow (beyond Zoom licence):** same HLS player. Identical interactive experience.
4. Zoom **webhooks** (`participant_joined` / `participant_left` / `recording.completed`) → Cloud Function → attendance records, XP award, and replay ingestion.
5. Replay: Zoom cloud recording (or OBS local record) → upload to **YouTube unlisted** → gated behind auth in your app with watermark overlay. Free, unlimited storage, adaptive bitrate that survives Sri Lankan mobile data.

### 3.2 The Live Arena (the thing an LMS can't do)

A persistent side panel rendered next to the video for **every** student, driven by **Realtime Database**:

- **Speed quizzes** — teacher fires an MCQ from the console; countdown; points scale with speed; live answer-distribution bar the teacher can see and react to.
- **Live leaderboard** — top 10 during class, called out on air. Social status is the real motivator in Sri Lankan tuition culture.
- **Team battles** — split the class by district or school and race. Cheap to build, extremely sticky.
- **Reactions + slow-mode chat** — capped emoji/message rate so it stays readable and cheap.
- **Raise Hand tokens** — each student gets N per class; spending one queues a question the teacher sees ranked by upvotes. Scarcity makes questions better and stops chat spam.
- **Random attendance pings** — a "tap within 60s" prompt that proves live presence and feeds a genuine attendance score for parents.

**Stream-delay handling:** the HLS simulcast lags Zoom by ~20–30s. Never score a quiz on wall-clock. Score on **time elapsed since the quiz rendered on that client**, and keep the question open long enough to cover the worst-case lag. This must be in the quiz engine from day one.

---

## 4. Revenue protection (anti-piracy)

Class content leaking is the biggest revenue leak in Sri Lankan online tuition. Layer these:

1. **Phone OTP auth** (Firebase Auth) — one account per real number.
2. **Device binding** — max 2 devices per account, fingerprint stored, teacher-resettable.
3. **Single active session** — RTDB presence; joining on a new device kicks the old one.
4. **Unique Zoom registrant links** per student per session (see above).
5. **Dynamic watermark overlay** — the student's name + masked phone drifting semi-transparently over the player at random positions. Doesn't stop recording; makes the leaker identifiable, which is what actually deters it.
6. **Phase 3:** wrap the PWA with Capacitor/TWA for Play Store and set `FLAG_SECURE` to block Android screen recording. Not possible in a browser.

---

## 5. AI layer (free tier first)

**Google Gemini API free tier** is the right choice — it handles **Sinhala** far better than Whisper or open Llama models, and the free allowance (roughly 15 RPM / low-thousands of requests per day for Flash; verify your project's live quota in AI Studio) covers early scale. Route everything through **one server-side AI adapter module** so you can swap to a paid tier or another provider without touching feature code.

| Feature | Value | Notes |
|---|---|---|
| **24/7 Doubt Bot (RAG)** | The big one. Grounded on *your* notes and past papers, answering in Sinhala. Lets you serve 5,000 students without support collapsing | Embeddings in Firestore initially; move to a vector DB past ~10k chunks |
| **Auto-quiz from lesson transcript** | Every class instantly produces practice MCQs — content cost near zero | Teacher reviews before publishing. Never auto-publish |
| **Instant answer marking** | A/L ICT structured/essay answers marked against a rubric with Sinhala feedback | Human spot-check sample; publish an accuracy caveat to students |
| **Weak-area detection → revision plan** | Personalised, drives daily return visits | Pure Firestore aggregation + one AI summarisation call |
| **At-risk churn detection** | Flags students whose attendance/quiz trend is falling → nudge before they cancel | Directly protects MRR |
| **Auto notes + Sinhala subtitles** | Turns each live class into a sellable asset | Batch job, off-peak |

**Two rules:** free-tier Gemini may use your data for training — **never send student PII**; send content and anonymous IDs only. And **cache aggressively** (identical doubt questions get identical answers) — caching is what keeps you inside the free tier.

---

## 6. Gamification (engaging, not exploitative)

XP, levels, streaks, badges, school/district leaderboards, weekly Hall of Fame shoutouts on the live class, and an XP economy that unlocks real rewards (past-paper packs, 1-on-1 doubt slots, fee discounts — which also drives revenue). Referral: both students get XP + a discount, which is your cheapest growth channel.

**Because your users are minors, two guardrails that are also good business:** streaks get grace days (a broken streak from one sick day makes students quit, not try harder), and no loss-based mechanics that punish absence. Keep the parent dashboard honest — it's the trust asset that makes parents keep paying.

---

## 7. Payments & entitlements

**Verified constraint:** PayHere's **Recurring API requires their PLUS (≈Rs 3,990/mo) or PREMIUM (≈Rs 9,990/mo) plan**; the entry plan does one-time payments only. So:

- **Phase 1 (0–50 students):** one-time PayHere checkout per month + automated FCM/WhatsApp renewal reminders + **manual bank-slip upload with teacher approval** (culturally dominant in Sri Lanka — do not skip it).
- **Phase 2 (revenue > ~Rs 20k MRR):** upgrade to PayHere PLUS and switch to true auto-renewing subscriptions. Two or three students cover the plan fee.
- Verify current PayHere fees and plan tiers before integrating — they change.

**Entitlement model:** a single server-side `hasAccess(userId, subjectId, at)` check used by every gated resource (join link, notes, replay, quiz). One function, one source of truth — never scatter access logic across the UI.

---

## 8. Data model (Firestore unless noted)

```
users/{uid}                  role, name, phone, medium, school, district, devices[], parentUid
subjects/{subjectId}         O/L ICT | A/L ICT, medium, priceLKR, syllabus
enrollments/{uid}_{subject}  status, currentPeriodEnd, source
sessions/{sessionId}         subjectId, startsAt, zoomMeetingId, hlsUrl, replayUrl, state
attendance/{sessionId}/{uid} joinedAt, leftAt, minutes, pingsAnswered, score
quizzes/{quizId}             sessionId|standalone, questions[], mode(live|practice)
attempts/{uid}/{quizId}      answers[], score, msPerQuestion[]
progress/{uid}/{subjectId}   xp, level, streak, weakTopics[], riskScore
payments/{paymentId}         provider, amount, status, periodCovered, slipUrl
content/{contentId}          notes/pastPapers, r2Key, isPublic (SEO), embeddings ref

RTDB (ephemeral, hot):
  live/{sessionId}/chat       slow-mode capped
  live/{sessionId}/presence
  live/{sessionId}/quiz       current question + server-anchored open/close
  live/{sessionId}/leaderboard  aggregated every 10s (single node)
  live/{sessionId}/hands
```

### Cost-survival rules (non-negotiable — these decide whether you're profitable at 5,000 students)

1. **All live traffic goes to RTDB, never Firestore.** Firestore bills per operation; a live chat for 1,000 students would bankrupt the free tier in one class.
2. **Never subscribe a client to a collection.** Aggregate the leaderboard server-side into **one** node every 10s and let clients read that.
3. Slow-mode chat and rate-limit reactions — RTDB bills per GB downloaded, and unbounded fan-out is the only way to make that number large.
4. Serve all notes/PDFs/media from **R2** (zero egress), never Firebase Storage.
5. Denormalise aggressively; precompute anything read more than it's written.

---

## 9. Repo structure

```
/app                  Next.js App Router
  /(public)           landing, SEO notes & past-paper pages, pricing
  /(student)          dashboard, live, notes, practice, leaderboard
  /(teacher)          console: schedule, live control, quiz firing, approvals
  /(parent)           attendance, marks, progress
/components/arena     Live Arena panel (quiz, chat, leaderboard, hands)
/components/player    ZoomEmbed + HlsPlayer + Watermark
/lib/firebase         client + admin SDK
/lib/zoom             S2S OAuth, meeting/registrant CRUD, SDK signature, webhooks
/lib/payments         PayHere checkout, webhook verify, entitlements
/lib/ai               provider-agnostic adapter, RAG, prompts, cache
/lib/gamification     XP rules, streaks, badges, leaderboard aggregation
/functions            Cloud Functions (webhooks, schedulers, aggregation)
/firestore.rules  /database.rules.json  /storage.rules
```

---

## 10. Roadmap

**Phase 1 — Earn money (target ~4 weeks).** Auth + phone OTP, subject enrolment, PayHere one-time checkout + bank-slip upload, entitlement gate, session scheduling, Zoom S2S meeting creation, unique registrant join links, embedded Zoom on desktop, attendance via webhooks, notes delivery from R2. *Ship the moment fees can be collected and a class can be joined — everything after this is upside.*

**Phase 2 — Differentiate (~4 weeks).** Live Arena (live quizzes, leaderboard, chat, reactions, hands), XP/streaks/badges, HLS simulcast to YouTube Live + in-app player for mobile and overflow, replay library, watermark + device binding, parent dashboard.

**Phase 3 — Scale & AI (~6 weeks).** Gemini doubt bot with RAG over your notes, auto-quiz generation, answer marking, weak-area plans, at-risk detection, SEO content engine, referral system, PayHere PLUS auto-renewal, WhatsApp Cloud API reminders, Capacitor wrapper with `FLAG_SECURE`.

**Phase 4 — The real ceiling.** Multi-tenant so other teachers run classes on your platform for a revenue cut. You said single-subject subscription for now, so **Phase 1–3 will not build multi-tenancy** — but I'll namespace data by `tenantId` from day one so it stays cheap to add. This, not one big class, is where the largest earnings are.

---

## 11. Verification

Each phase is done when it survives these, not when the code compiles:

- **Payments:** PayHere sandbox → pay → webhook → `enrollments.status = active` → gated resource unlocks. Then a deliberately failed payment leaves it locked.
- **Access control:** an expired student, a shared registrant link, and a third device are each rejected. Test with real second/third devices, not incognito.
- **Zoom:** create a session, join from desktop (embedded) and Android (HLS), confirm attendance rows written from webhooks, confirm the recording lands and replays gated.
- **Live Arena load test:** script 200+ simulated RTDB clients against one session; watch the Firebase usage console **during** the test. If Firestore reads move at all, you've put live data in the wrong database.
- **Cost check:** after each pilot class, read actual Firebase billing for that day and divide by attendee count. Know your cost per student per class before you scale, not after.
- **Real pilot:** run one free class for ~30 students before charging anyone. Measure join success rate on mobile data specifically.

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| Zoom licence caps/costs your class size | RTMP simulcast overflow (Section 2) — the core design decision |
| Firebase bill spikes from a bad query | Budget alerts day one; live traffic on RTDB only; review usage after every class |
| Content piracy | Registrant links, device binding, watermark, `FLAG_SECURE` in Phase 3 |
| Gemini free-tier quota exhausted mid-class | Aggressive caching + provider-agnostic AI adapter to swap tiers instantly |
| Building the platform instead of teaching | Phase 1 is deliberately minimal — collect fees and hold a class, then iterate with real students |

**The honest one:** the platform is the moat, but the students come from your teaching and marketing. Phase 1 exists to get you earning in weeks; don't let Phase 2 delay your first cohort.
