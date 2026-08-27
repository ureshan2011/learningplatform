import Image from "next/image";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { listSubjects, listUpcomingSessions } from "@/lib/queries";
import { formatLKR, formatSessionTime, relativeToNow } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import type { ClassSession, Subject } from "@/lib/types";

const FEATURES = [
  {
    title: "Live classes",
    body: "Join from your phone the moment class starts.",
    icon: (
      <path
        d="M4 17V7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Zm13-7 4-3v10l-4-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Instant quizzes",
    body: "Answer live, see the island-wide leaderboard right after.",
    icon: (
      <path
        d="m5 13 4 4L19 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Past papers",
    body: "Download notes and papers the moment class ends.",
    icon: (
      <path
        d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
] as const;

// Each one independently true and checkable — no platform-usage numbers
// invented for a service this new. The MOOC figure is the teacher's track
// record, not this platform's, so it is worded as an attribution, not a
// user count of ICT Class itself.
const TRUST_BADGES = [
  "🎓 Taught by a PhD educator",
  "🇱🇰 Built Sri Lanka's National MOOC — 150,000+ learners",
  "🔴 Real live Zoom classes, not pre-recorded videos",
  "🔒 Secure payments via PayHere",
] as const;

const HOW_IT_WORKS = [
  { step: "1", title: "Sign up with your phone", body: "One-time SMS code — no password to forget." },
  { step: "2", title: "Start free — no card needed", body: "Every subject includes a free 7-day trial." },
  { step: "3", title: "Join live from your phone", body: "Zoom class, instant quizzes, island-wide leaderboard." },
  { step: "4", title: "Keep the notes", body: "Download the class notes and past papers straight after." },
] as const;

const FAQ = [
  {
    q: "Can I try before I pay?",
    a: "Yes — every subject includes a free 7-day trial with no card required, so you can sit in on a real live class before deciding.",
  },
  {
    q: "Is this only for O/L, or A/L too?",
    a: "Both. Every subject is clearly tagged O/L or A/L so you always know which syllabus you're getting.",
  },
  {
    q: "What do I need to join a class?",
    a: "A phone or laptop with a browser and the Zoom app. Classes are live and interactive, not pre-recorded videos.",
  },
  {
    q: "What if I miss a live class?",
    a: "Ask your teacher for the replay — published class recordings stay downloadable from your subject page.",
  },
  {
    q: "Is paying online safe?",
    a: "Payments go through PayHere, a licensed Sri Lankan payment gateway. If you'd rather not pay by card, you can upload a bank deposit slip instead.",
  },
] as const;

const CREDENTIALS = [
  "PhD — University of Canterbury, NZ",
  "Former Lecturer — University of Moratuwa",
  "Built Sri Lanka's National MOOC — 150,000+ learners",
  "Senior Lecturer — NZ (current)",
] as const;

// The landing page is the top of the acquisition funnel and must be indexable,
// so it renders on the server with no auth requirement.
export const revalidate = 300;

export default async function LandingPage() {
  const [user, subjects] = await Promise.all([
    getSessionUser().catch(() => null),
    listSubjects().catch(() => [] as Subject[]),
  ]);

  // Real, live-data proof the platform is actually running classes, not just
  // a brochure — shown only when a session genuinely exists, same as the
  // "Classes are being set up" fallback below when there is nothing yet.
  const [nextSession] = await listUpcomingSessions(
    subjects.map((s) => s.id),
    5,
  )
    .then((sessions) => sessions.filter((s) => s.state !== "cancelled"))
    .catch(() => [] as ClassSession[]);
  const nextSessionSubject = nextSession
    ? subjects.find((s) => s.id === nextSession.subjectId)
    : undefined;

  return (
    <main className="relative min-h-screen overflow-hidden bg-(--color-awaken-bg) text-(--color-awaken-ink)">
      {/* Decorative gradient blobs. Pure CSS, no images — cheap on slow links. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="awaken-blob absolute -top-24 -right-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-awaken-accent), transparent 70%)" }}
        />
        <div
          className="awaken-blob absolute top-40 -left-32 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--color-awaken-rose), transparent 70%)",
            animationDelay: "-7s",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 py-14">
        <header className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-(--color-awaken-accent) to-(--color-awaken-rose) text-white">
              <Icon name="school" className="!text-lg" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight">
              ICT<span className="text-(--color-awaken-accent)">Class</span>
            </span>
          </span>
          <Link
            href={user ? "/dashboard" : "/signin"}
            className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) px-4 py-2 text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors hover:border-(--color-awaken-accent)/40"
          >
            {user ? "My dashboard" : "Sign in"}
          </Link>
        </header>

        <section className="awaken-rise mt-16 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-(--color-awaken-accent-soft) px-3 py-1 text-xs font-semibold text-(--color-awaken-accent)">
            🎁 Free 7-day trial — no card required
          </span>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            O/L &amp; A/L ICT, taught live.
            <span className="block bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) bg-clip-text text-transparent">
              <span className="si" lang="si">
                සිංහල
              </span>{" "}
              medium.
            </span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-(--color-awaken-ink-soft)">
            Live classes you join from your phone, instant quizzes during the lesson, a
            leaderboard against the whole island, and past papers you can download the
            moment class ends.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signin"
              className="rounded-xl bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-6 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(234,88,12,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Start free trial
            </Link>
            <Link
              href="/notes"
              className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) px-6 py-3 font-medium transition-colors hover:border-(--color-awaken-accent)/40"
            >
              Free notes &amp; past papers
            </Link>
          </div>

          {nextSession && nextSessionSubject ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-(--color-awaken-ink-soft)">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-awaken-danger) opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-awaken-danger)" />
              </span>
              Next live class: <span className="font-semibold text-(--color-awaken-ink)">{nextSessionSubject.name}</span>{" "}
              · {formatSessionTime(nextSession.startsAt)} ({relativeToNow(nextSession.startsAt)})
            </p>
          ) : null}
        </section>

        <section
          className="awaken-rise mt-10 flex flex-wrap gap-2"
          style={{ animationDelay: "0.05s" }}
        >
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-1.5 text-xs font-medium text-(--color-awaken-ink-soft)"
            >
              {badge}
            </span>
          ))}
        </section>

        <section
          className="awaken-rise mt-10 grid gap-4 sm:grid-cols-3"
          style={{ animationDelay: "0.1s" }}
        >
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6 text-(--color-awaken-accent)"
              >
                {feature.icon}
              </svg>
              <p className="mt-3 font-semibold">{feature.title}</p>
              <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">{feature.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-20">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            How it works
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <li key={item.step} className="relative rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) text-sm font-bold text-white">
                  {item.step}
                </span>
                <p className="mt-3 font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/*
          Teacher credibility card. A solo tuition platform is trusted through
          the one person running it, not a brand — so the teacher's face and
          real credentials go on the landing page itself, not a buried /about
          route. Sri-Lanka-relevant lines (Moratuwa, the national MOOC) are
          ordered ahead of the NZ postdoc line: parents recognise those first.
        */}
        <section className="awaken-rise mt-16" style={{ animationDelay: "0.15s" }}>
          <div className="rounded-3xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-8">
            <div className="grid gap-6 sm:grid-cols-[11rem_1fr] sm:items-start">
              <div className="mx-auto w-32 shrink-0 sm:mx-0 sm:w-full">
                <Image
                  src="/images/dr-yasas.png"
                  alt="Dr. Yasas Wickramasinghe"
                  width={881}
                  height={1241}
                  className="h-auto w-full rounded-2xl"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-(--color-awaken-accent)">
                  Your teacher
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight">
                  Dr. Yasas Wickramasinghe
                </h2>
                <p className="mt-0.5 text-sm text-(--color-awaken-ink-soft)">
                  PhD, Human Interface Technology — University of Canterbury, NZ
                </p>
                <p className="mt-4 leading-relaxed text-(--color-awaken-ink-soft)">
                  Dr. Wickramasinghe was previously a Software Engineering lecturer at
                  the University of Moratuwa and led Sri Lanka&apos;s first national MOOC
                  platform (open.uom.lk), scaling it to 150,000+ learners. He is
                  currently a postdoctoral researcher at the University of Canterbury,
                  New Zealand, and a Senior Lecturer at Yoobee Colleges.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {CREDENTIALS.map((credential) => (
                    <span
                      key={credential}
                      className="rounded-full bg-(--color-awaken-accent-soft) px-3 py-1 text-xs font-semibold text-(--color-awaken-accent)"
                    >
                      {credential}
                    </span>
                  ))}
                </div>
                <a
                  href="https://www.linkedin.com/in/yasassri"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-block text-sm font-semibold text-(--color-awaken-accent) hover:underline"
                >
                  Full CV / LinkedIn →
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            Classes
          </h2>
          {subjects.length === 0 ? (
            <p className="mt-4 text-sm text-(--color-awaken-ink-soft)">
              Classes are being set up. Check back shortly.
            </p>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {subjects.map((subject) => (
                <li
                  key={subject.id}
                  className="rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold">{subject.name}</h3>
                    <span className="shrink-0 rounded-full bg-(--color-awaken-accent-soft) px-2.5 py-0.5 text-xs font-semibold text-(--color-awaken-accent)">
                      {subject.grade === "AL" ? "A/L" : "O/L"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
                    {subject.description}
                  </p>
                  <p className="mt-4 font-semibold text-(--color-awaken-accent)">
                    {formatLKR(subject.priceLKR)}
                    <span className="text-sm font-normal text-(--color-awaken-ink-soft)">
                      {" "}
                      / month
                    </span>
                  </p>
                  <p className="mt-1 text-xs font-medium text-(--color-awaken-success)">
                    First 7 days free
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-20">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            Questions parents ask
          </h2>
          <div className="mt-5 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 open:shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <summary className="cursor-pointer list-none font-semibold marker:content-none">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <span className="shrink-0 text-(--color-awaken-ink-soft) transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-(--color-awaken-ink-soft)">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="awaken-rise mt-20 rounded-3xl bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) p-8 text-center text-white sm:p-12">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight sm:text-3xl">
            See a real class for yourself.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/90">
            Start your free 7-day trial — no card required, no obligation to continue.
          </p>
          <Link
            href="/signin"
            className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-(--color-awaken-accent) shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Start free trial
          </Link>
        </section>
      </div>
    </main>
  );
}
