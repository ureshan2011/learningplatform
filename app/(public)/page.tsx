import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { listSubjects, listUpcomingSessions } from "@/lib/queries";
import { formatLKR, formatSessionTime, relativeToNow } from "@/lib/format";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmailCaptureForm } from "@/components/marketing/EmailCaptureForm";
import type { ClassSession, Subject } from "@/lib/types";

export const metadata: Metadata = {
  title: "Free A/L ICT Notes, Articles & Video Lessons",
  description:
    "Free A/L ICT exam resources for Sri Lankan students — articles, video breakdowns of past papers and revision notes in Sinhala medium. New content published regularly, no payment required. Live interactive classes optional, with a free 7-day trial.",
};

// Placeholder entries for the content hub — real articles and video
// discussions replace these as they're published. Kept here rather than in
// Firestore until there's a reason to manage them outside a code change:
// a handful of hand-written cards need no CMS.
const PLACEHOLDER_ARTICLES = [
  {
    tag: "Past paper breakdown",
    title: "2024 A/L ICT Paper 1 — full walkthrough",
    blurb: "Question-by-question breakdown of where students lost the most marks, and how to avoid it.",
  },
  {
    tag: "Exam technique",
    title: "How to actually answer a \"distinguish between\" question",
    blurb: "The exact structure examiners are marking for — most students lose marks on format, not content.",
  },
  {
    tag: "Syllabus",
    title: "A/L ICT syllabus — what changed and what didn't",
    blurb: "A plain-language summary of the current topics and how much each one is worth.",
  },
] as const;

const PLACEHOLDER_VIDEOS = [
  { title: "Database normalisation, explained from scratch", duration: "18 min" },
  { title: "Networking topologies — the mistakes examiners see every year", duration: "22 min" },
  { title: "Tracing an algorithm step by step, on a real past paper", duration: "15 min" },
] as const;

const FEATURES: Array<{ title: string; body: string; icon: IconName }> = [
  { title: "Live classes", body: "Join from your phone the moment class starts.", icon: "videocam" },
  { title: "Instant quizzes", body: "Answer live, see the island-wide leaderboard right after.", icon: "quiz" },
  { title: "Mock exams", body: "Timed papers with negative marking and a live rank.", icon: "military_tech" },
] as const;

// Each one independently true and checkable — no platform-usage numbers
// invented for a service this new. The MOOC figure is the teacher's track
// record, not this platform's, so it is worded as an attribution, not a
// user count of ICT Class itself.
const TRUST_BADGES = [
  "🆓 Articles, videos and notes — 100% free, always",
  "🎓 Written and taught by a PhD educator",
  "🇱🇰 Built Sri Lanka's National MOOC — 150,000+ learners",
  "🔴 Real live Zoom classes too, not just content",
] as const;

const HOW_IT_WORKS = [
  { step: "1", title: "Sign up with your phone", body: "One-time SMS code — no password to forget." },
  { step: "2", title: "Start free — no card needed", body: "Every subject includes a free 7-day trial." },
  { step: "3", title: "Join live from your phone", body: "Zoom class, instant quizzes, island-wide leaderboard." },
  { step: "4", title: "Keep the notes", body: "Download the class notes and past papers straight after." },
] as const;

const FAQ = [
  {
    q: "Do I have to pay to read the articles or watch the video discussions?",
    a: "No. Every article, video discussion and downloadable note on this site is free, permanently. Live classes are the only paid part of ICT Class, and even those start with a free 7-day trial.",
  },
  {
    q: "How often is new content published?",
    a: "New articles and video discussions are added regularly, especially around exam season and whenever the syllabus changes. Sign up with your email and we'll let you know when something new goes up.",
  },
  {
    q: "Can I try live classes before I pay?",
    a: "Yes — every subject includes a free 7-day trial with no card required, so you can sit in on a real live class before deciding.",
  },
  {
    q: "Is this only for O/L, or A/L too?",
    a: "Both. Every subject is clearly tagged O/L or A/L so you always know which syllabus you're getting.",
  },
  {
    q: "What if I miss a live class?",
    a: "Ask your teacher for the replay — published class recordings stay downloadable from your subject page.",
  },
  {
    q: "Is paying for live classes safe?",
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
          <nav className="flex items-center gap-4">
            <div className="hidden items-center gap-4 text-sm font-medium text-(--color-awaken-ink-soft) sm:flex">
              <a href="#resources" className="hover:text-(--color-awaken-ink)">
                Free resources
              </a>
              <a href="#classes" className="hover:text-(--color-awaken-ink)">
                Live classes
              </a>
              <a href="#faq" className="hover:text-(--color-awaken-ink)">
                FAQ
              </a>
            </div>
            <Link
              href={user ? "/dashboard" : "/signin"}
              className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) px-4 py-2 text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors hover:border-(--color-awaken-accent)/40"
            >
              {user ? "My dashboard" : "Sign in"}
            </Link>
          </nav>
        </header>

        <section className="awaken-rise mt-16 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-(--color-awaken-accent-soft) px-3 py-1 text-xs font-semibold text-(--color-awaken-accent)">
            🇱🇰 Free for Sri Lankan A/L ICT students — no payment, ever
          </span>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            Free A/L ICT resources,
            <span className="block bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) bg-clip-text text-transparent">
              built for{" "}
              <span className="si" lang="si">
                සිංහල
              </span>{" "}
              medium.
            </span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-(--color-awaken-ink-soft)">
            Exam-focused articles, video breakdowns of past papers, and revision notes —
            published regularly, free to read, no sign-up required. Want live interactive
            classes too? Every subject includes a free 7-day trial.
          </p>

          <EmailCaptureForm source="landing_hero" className="mt-7 max-w-md" />

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
            <Link href="/notes" className="text-(--color-awaken-accent) hover:underline">
              Browse free notes →
            </Link>
            <a href="#classes" className="text-(--color-awaken-ink-soft) hover:text-(--color-awaken-ink)">
              See live classes ↓
            </a>
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

        {/*
          The content hub — the whole reason for this redesign. Real articles
          and video discussions replace PLACEHOLDER_ARTICLES /
          PLACEHOLDER_VIDEOS above as they're written; the "Coming soon" pill
          is there so nothing here looks clickable before it actually is.
        */}
        <section id="resources" className="mt-20 scroll-mt-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            Free articles &amp; video discussions
          </h2>
          <p className="mt-2 max-w-2xl text-(--color-awaken-ink-soft)">
            Exam-focused breakdowns of past papers, syllabus changes and the mistakes students
            make most — published regularly, free to read.
          </p>

          <h3 className="mt-8 text-sm font-semibold tracking-wide text-(--color-awaken-ink-soft) uppercase">
            Articles
          </h3>
          <ul className="mt-3 grid gap-4 sm:grid-cols-3">
            {PLACEHOLDER_ARTICLES.map((article) => (
              <li
                key={article.title}
                className="rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)">
                    <Icon name="description" />
                  </span>
                  <StatusPill tone="neutral">Coming soon</StatusPill>
                </div>
                <p className="mt-3 text-xs font-semibold tracking-wide text-(--color-awaken-accent) uppercase">
                  {article.tag}
                </p>
                <p className="mt-1 font-semibold">{article.title}</p>
                <p className="mt-1.5 text-sm text-(--color-awaken-ink-soft)">{article.blurb}</p>
              </li>
            ))}
          </ul>

          <h3 className="mt-10 text-sm font-semibold tracking-wide text-(--color-awaken-ink-soft) uppercase">
            Video discussions
          </h3>
          <ul className="mt-3 grid gap-4 sm:grid-cols-3">
            {PLACEHOLDER_VIDEOS.map((video) => (
              <li
                key={video.title}
                className="rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--color-awaken-indigo-soft) text-(--color-awaken-indigo)">
                    <Icon name="play_circle" />
                  </span>
                  <StatusPill tone="neutral">Coming soon</StatusPill>
                </div>
                <p className="mt-3 text-xs font-semibold tracking-wide text-(--color-awaken-indigo) uppercase">
                  Video discussion · {video.duration}
                </p>
                <p className="mt-1 font-semibold">{video.title}</p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 font-semibold text-(--color-awaken-accent)">
              <Icon name="notifications_active" />
              Be the first to know when we publish
            </p>
            <EmailCaptureForm source="landing_resources" buttonLabel="Notify me" className="w-full sm:w-auto sm:min-w-[22rem]" />
          </div>
        </section>

        {/*
          Teacher credibility card. A solo tuition platform is trusted through
          the one person running it, not a brand — so the teacher's face and
          real credentials go on the landing page itself, not a buried /about
          route. Sri-Lanka-relevant lines (Moratuwa, the national MOOC) are
          ordered ahead of the NZ postdoc line: parents recognise those first.
        */}
        <section className="awaken-rise mt-20" style={{ animationDelay: "0.15s" }}>
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
                  Who&apos;s behind this
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
                  New Zealand, and a Senior Lecturer at Yoobee Colleges. Every article,
                  video and live class on ICT Class comes from the same person.
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

        {/*
          The paid product, deliberately positioned after the free content
          has made its case rather than as the opening pitch — see the
          landing-page redesign discussion: cold SEO traffic converts on free
          value first, live classes are the upsell once someone is engaged.
        */}
        <section id="classes" className="mt-20 scroll-mt-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            Want live classes too?
          </h2>
          <p className="mt-2 max-w-2xl text-(--color-awaken-ink-soft)">
            Everything above is free, permanently. If you also want live interactive
            lessons, instant quizzes and a leaderboard against the whole island, here&apos;s
            how that works.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              >
                <Icon name={feature.icon} className="!text-2xl text-(--color-awaken-accent)" />
                <p className="mt-3 font-semibold">{feature.title}</p>
                <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">{feature.body}</p>
              </div>
            ))}
          </div>

          <ol className="mt-10 grid gap-4 sm:grid-cols-4">
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

          {subjects.length === 0 ? (
            <p className="mt-10 text-sm text-(--color-awaken-ink-soft)">
              Classes are being set up. Check back shortly.
            </p>
          ) : (
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
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

          <p className="mt-6 flex items-center gap-1.5 text-xs text-(--color-awaken-ink-soft)">
            <Icon name="check_circle" className="!text-sm text-(--color-awaken-success)" />
            Secure payments via PayHere, or pay by bank deposit slip.
          </p>
        </section>

        <section id="faq" className="mt-20 scroll-mt-6">
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

        <section className="awaken-rise mt-20 rounded-3xl bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) p-8 text-white sm:p-12">
          <div className="mx-auto max-w-md text-center">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight sm:text-3xl">
              Get every new article, free.
            </h2>
            <p className="mt-3 text-white/90">
              We&apos;ll email you when a new article or video discussion goes up. No spam,
              unsubscribe anytime.
            </p>
            <div className="mx-auto mt-6 max-w-sm">
              {/* Styled inline rather than reusing EmailCaptureForm's own
                  colours, since this sits on a gradient background rather
                  than the page's card surface. */}
              <FinalCtaEmailForm />
            </div>
            <p className="mt-5 text-sm text-white/80">
              Or{" "}
              <Link href="/signin" className="font-semibold underline">
                start a free live-class trial
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FinalCtaEmailForm() {
  return (
    <div className="[&_input]:border-white/30 [&_input]:bg-white/10 [&_input]:text-white [&_input]:placeholder:text-white/60 [&_input]:focus:border-white [&_button]:bg-white [&_button]:bg-none [&_button]:text-(--color-awaken-accent) [&_button]:shadow-none [&_p]:text-white/70">
      <EmailCaptureForm source="landing_final" buttonLabel="Notify me" />
    </div>
  );
}
