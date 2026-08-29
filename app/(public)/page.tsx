import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Manrope } from "next/font/google";
import { getSessionUser } from "@/lib/auth/session";
import { listSubjects, listUpcomingSessions } from "@/lib/queries";
import { formatLKR, formatSessionTime, relativeToNow } from "@/lib/format";
import { Icon, type IconName } from "@/components/ui/Icon";
import { EmailCaptureForm } from "@/components/marketing/EmailCaptureForm";
import { ScrollEffects } from "@/components/marketing/landing/ScrollEffects";
import { FaqAccordion } from "@/components/marketing/landing/FaqAccordion";
import type { ClassSession, Subject } from "@/lib/types";

// `components/syllabus/motion.tsx`'s cssVars is a "use client" export and
// can't be called from this server component — same helper, defined locally.
function cssVars(vars: Record<string, string>): React.CSSProperties {
  return vars as React.CSSProperties;
}

// Self-hosted at build time, scoped to this page only (via the .variable
// classes below) so the rest of the app keeps its own type system.
const displayFont = Manrope({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-lp-display" });
const bodyFont = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-lp-body" });
const monoFont = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-lp-mono" });

export const metadata: Metadata = {
  title: "Free A/L ICT Notes, Articles & Video Lessons",
  description:
    "Free A/L ICT exam resources for Sri Lankan students — articles, video breakdowns of past papers and revision notes in Sinhala medium, taught by Dr. Yasas Wickramasinghe. New content published regularly, no payment required. Live interactive classes optional, with a free 7-day trial.",
};

const CONTAINER = "mx-auto w-full max-w-[1180px] px-[clamp(20px,4vw,32px)]";
const EYEBROW = "text-[13px] font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase";

const STATS: Array<{ icon: IconName; value: string; label: string }> = [
  { icon: "group", value: "150,000+", label: "learners reached" },
  { icon: "school", value: "PhD", label: "Canterbury, NZ" },
  { icon: "co_present", value: "12+ yrs", label: "teaching ICT" },
  { icon: "description", value: "100%", label: "free notes" },
];

const OFFERS: Array<{ icon: IconName; title: string; body: string }> = [
  { icon: "videocam", title: "Live classes", body: "Join from your phone the moment class starts." },
  { icon: "bolt", title: "Instant quizzes", body: "Answer live, see the island-wide leaderboard right after." },
  { icon: "military_tech", title: "Mock exams", body: "Timed papers with negative marking and a live rank." },
  { icon: "download", title: "Notes to keep", body: "Download class notes and past papers straight after." },
];

const RESOURCES: Array<{ delay: number; badge: string; tag: string; title: string; icon: IconName }> = [
  { delay: 0, badge: "Free", tag: "Past paper breakdown", title: "2024 A/L ICT Paper 1 — full walkthrough", icon: "manage_search" },
  { delay: 90, badge: "Free", tag: "Exam technique", title: 'How to answer a "distinguish between" question', icon: "edit_note" },
  { delay: 180, badge: "Free", tag: "Syllabus", title: "A/L ICT syllabus — what changed and what didn't", icon: "fact_check" },
];

const STEPS = [
  { delay: 0, step: "01", title: "Sign up with your phone", body: "One-time SMS code — no password to forget." },
  { delay: 80, step: "02", title: "Start free", body: "Every subject includes a free 7-day trial. No card needed." },
  { delay: 160, step: "03", title: "Join live from your phone", body: "Zoom class, instant quizzes, island-wide leaderboard." },
  { delay: 240, step: "04", title: "Keep the notes", body: "Download class notes and past papers straight after." },
] as const;

const FAQS = [
  {
    q: "Do I have to pay to read the articles or watch the videos?",
    a: "No. Every article, video discussion and downloadable note is free, permanently. Live classes are the only paid part, and those start with a free 7-day trial.",
  },
  {
    q: "How often is new content published?",
    a: "Regularly — especially around exam season and whenever the syllabus changes. Sign up and you'll hear when something new goes up.",
  },
  {
    q: "Can I try live classes before I pay?",
    a: "Yes. Every subject includes a free 7-day trial with no card required, so you can sit in on a real class before deciding.",
  },
  {
    q: "Is this only for O/L, or A/L too?",
    a: "Both. Every subject is clearly tagged O/L or A/L so you always know which syllabus you're getting.",
  },
  {
    q: "What if I miss a live class?",
    a: "Ask for the replay — published class recordings stay downloadable from your subject page.",
  },
  {
    q: "Is paying for live classes safe?",
    a: "Payments go through PayHere, a licensed Sri Lankan payment gateway. You can also upload a bank deposit slip instead.",
  },
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
  // a brochure — shown only when a session genuinely exists.
  const [nextSession] = await listUpcomingSessions(
    subjects.map((s) => s.id),
    5,
  )
    .then((sessions) => sessions.filter((s) => s.state !== "cancelled"))
    .catch(() => [] as ClassSession[]);
  const nextSessionSubject = nextSession ? subjects.find((s) => s.id === nextSession.subjectId) : undefined;

  const startHref = user ? "/dashboard" : "/signin";
  const startLabel = user ? "Go to dashboard" : "Sign up with your phone";

  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <ScrollEffects>
        <div data-lp-progress className="fixed top-0 left-0 z-[60] h-[3px] w-0 bg-(--lp-orange-500)" />

        {/* Floating pill nav */}
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div
            data-lp-nav
            className="lp-nav pointer-events-auto flex max-w-full items-center gap-[clamp(8px,1.6vw,18px)] rounded-full bg-(--lp-ink-900) py-2 pr-2 pl-5"
          >
            <a
              href="#top"
              className="font-[family-name:var(--lp-font-display)] text-lg font-extrabold tracking-[-0.02em] whitespace-nowrap text-(--lp-paper-50)"
            >
              ICT<span className="text-(--lp-orange-500)">CLASS</span>
            </a>
            <nav className="hidden items-center gap-0.5 sm:flex">
              <a href="#teach" className="rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap text-(--lp-ink-300) hover:bg-(--lp-ink-700) hover:text-(--lp-paper-50)">
                Classes
              </a>
              <a href="#resources" className="rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap text-(--lp-ink-300) hover:bg-(--lp-ink-700) hover:text-(--lp-paper-50)">
                Free notes
              </a>
              <a href="#how" className="rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap text-(--lp-ink-300) hover:bg-(--lp-ink-700) hover:text-(--lp-paper-50)">
                How it works
              </a>
              <a href="#faq" className="rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap text-(--lp-ink-300) hover:bg-(--lp-ink-700) hover:text-(--lp-paper-50)">
                FAQ
              </a>
            </nav>
            <a
              href="#cta"
              className="flex items-center gap-2 rounded-full bg-(--lp-orange-500) py-2 pr-2 pl-4 text-xs font-semibold whitespace-nowrap text-(--lp-paper-0) shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600)"
            >
              Start free
              <span className="grid size-6 place-items-center rounded-full bg-(--lp-paper-0) text-(--lp-orange-500)">
                <Icon name="arrow_forward" className="!text-sm" />
              </span>
            </a>
          </div>
        </div>

        {/* Hero */}
        <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden py-[clamp(120px,14vh,180px)] pb-[clamp(48px,7vh,96px)]">
          <div
            data-lp-par="0.05"
            aria-hidden
            className="pointer-events-none absolute -top-[8%] -right-[6%] size-[min(60vw,760px)] rounded-full"
            style={{ background: "radial-gradient(circle at 50% 50%, rgba(244,85,30,0.20), rgba(244,85,30,0) 68%)" }}
          />

          <div className={`${CONTAINER} relative grid items-center gap-[clamp(32px,5vw,56px)]`} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(430px,100%), 1fr))" }}>
            <div className="lp-reveal">
              <div className="mb-[clamp(20px,3vw,28px)] inline-flex items-center gap-2.5 rounded-full border border-(--lp-border-subtle) bg-(--lp-paper-0) px-4 py-2 shadow-[var(--lp-shadow-xs)]">
                <span className="size-[7px] rounded-full bg-(--lp-orange-500)" />
                <span className="text-xs font-bold tracking-[0.14em] text-(--lp-ink-900) uppercase">Sinhala medium · O/L &amp; A/L ICT</span>
              </div>

              <h1 className="m-0 text-[clamp(40px,6.4vw,68px)] leading-[1.02] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) text-wrap-balance font-[family-name:var(--lp-font-display)]">
                ICT taught by
                <br />
                someone who <span className="text-(--lp-orange-500)">built it</span>
                <span className="text-(--lp-orange-500)">.</span>
              </h1>

              <p className="my-[clamp(18px,2.4vw,26px)] max-w-[520px] text-[clamp(15px,1.4vw,18px)] text-(--lp-ink-500) text-wrap-pretty">
                I&apos;m <strong className="font-bold text-(--lp-ink-900)">Dr. Yasas Wickramasinghe</strong> — PhD in Human
                Interface Technology, senior lecturer, and the person who built Sri Lanka&apos;s first national MOOC. Every
                note, video and live class here comes from me.
              </p>

              <div className="flex flex-wrap items-center gap-[clamp(12px,1.6vw,18px)]">
                <a
                  href="#cta"
                  className="flex h-12 items-center gap-3 rounded-full bg-(--lp-orange-500) py-2 pr-2 pl-6 text-base font-semibold text-(--lp-paper-0) shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600)"
                >
                  Start free
                  <span className="grid size-8 place-items-center rounded-full bg-(--lp-paper-0) text-(--lp-orange-500)">
                    <Icon name="arrow_forward" />
                  </span>
                </a>
                <a href="#resources" className="flex h-12 items-center gap-3 px-1 text-base font-semibold text-(--lp-ink-900) hover:text-(--lp-orange-600)">
                  Browse free notes
                  <span className="grid size-8 place-items-center rounded-full border-[1.5px] border-(--lp-ink-900) text-(--lp-ink-900)">
                    <Icon name="north_east" className="!text-sm" />
                  </span>
                </a>
              </div>

              <div className="mt-[clamp(28px,3.6vw,40px)] flex flex-wrap gap-2.5">
                <span className="rounded-full border border-(--lp-border-subtle) bg-(--lp-paper-0) px-3.5 py-1.5 text-xs text-(--lp-ink-500)">
                  PhD — University of Canterbury, NZ
                </span>
                <span className="rounded-full border border-(--lp-border-subtle) bg-(--lp-paper-0) px-3.5 py-1.5 text-xs text-(--lp-ink-500)">
                  Senior Lecturer — NZ
                </span>
                <span className="rounded-full border border-(--lp-border-subtle) bg-(--lp-paper-0) px-3.5 py-1.5 text-xs text-(--lp-ink-500)">
                  Ex-Lecturer — Univ. of Moratuwa
                </span>
              </div>

              {nextSession && nextSessionSubject ? (
                <p className="mt-5 flex items-center gap-2 text-sm text-(--lp-ink-500)">
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--lp-orange-500) opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-(--lp-orange-500)" />
                  </span>
                  Next live class: <span className="font-semibold text-(--lp-ink-900)">{nextSessionSubject.name}</span> ·{" "}
                  {formatSessionTime(nextSession.startsAt)} ({relativeToNow(nextSession.startsAt)})
                </p>
              ) : null}
            </div>

            <div className="relative grid min-h-[clamp(360px,52vh,560px)] place-items-end justify-items-center">
              <div
                data-lp-par="0.10"
                aria-hidden
                className="absolute bottom-[6%] left-1/2 aspect-square w-[min(80%,420px)] -translate-x-1/2 rounded-full bg-(--lp-orange-500)"
              />
              <Image
                data-lp-par="-0.06"
                src="/images/dr-yasas.png"
                alt="Dr. Yasas Wickramasinghe"
                width={881}
                height={1241}
                priority
                className="relative block h-auto w-[min(88%,440px)] drop-shadow-[0_24px_48px_rgba(14,12,11,0.22)]"
              />

              <div
                data-lp-par="-0.14"
                className="absolute top-[8%] left-0 flex items-center gap-2.5 rounded-full bg-(--lp-paper-0) py-[9px] pr-4 pl-[10px] shadow-[var(--lp-shadow-md)]"
              >
                <span className="grid size-[30px] place-items-center rounded-full bg-(--lp-orange-50) text-(--lp-orange-500)">
                  <Icon name="school" className="!text-lg" />
                </span>
                <span className="text-xs font-semibold whitespace-nowrap text-(--lp-ink-900)">PhD, Human Interface Tech</span>
              </div>

              <div data-lp-par="-0.20" className="absolute right-0 bottom-[14%] rounded-2xl bg-(--lp-ink-900) px-[18px] py-3.5 shadow-[var(--lp-shadow-lg)]">
                <div className="font-[family-name:var(--lp-font-display)] text-[26px] leading-none font-extrabold tracking-[-0.02em] text-(--lp-paper-50)">
                  150,000<span className="text-(--lp-orange-500)">+</span>
                </div>
                <div className="mt-1 text-[11px] text-(--lp-ink-300)">learners on the national MOOC</div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="w-full py-[clamp(16px,3vw,32px)]">
          <div className={CONTAINER}>
            <div
              className="lp-reveal grid gap-[clamp(16px,2.4vw,28px)] rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-[clamp(20px,3vw,28px)] shadow-[var(--lp-shadow-sm)]"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
            >
              {STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
                  <span className="grid size-[42px] place-items-center rounded-full bg-(--lp-orange-50) text-(--lp-orange-500)">
                    <Icon name={stat.icon} />
                  </span>
                  <div className="font-[family-name:var(--lp-font-display)] text-[clamp(24px,2.6vw,32px)] leading-none font-extrabold tracking-[-0.02em] text-(--lp-ink-900)">
                    {stat.value}
                  </div>
                  <div className="text-xs text-(--lp-ink-400)">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What you get */}
        <section id="teach" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className="lp-reveal relative overflow-hidden rounded-[var(--lp-radius-panel)] bg-(--lp-ink-900) p-[clamp(26px,4vw,44px)]">
              <div
                data-lp-par="0.06"
                aria-hidden
                className="pointer-events-none absolute -top-[30%] -left-[10%] size-[520px] rounded-full"
                style={{ background: "radial-gradient(circle, rgba(244,85,30,0.18), rgba(244,85,30,0) 70%)" }}
              />
              <div className="relative">
                <div className={EYEBROW}>What you get</div>
                <div className="my-2.5 mb-[clamp(24px,3vw,34px)] flex flex-wrap items-start gap-[clamp(20px,4vw,40px)]">
                  <h2 className="m-0 text-[clamp(30px,4.4vw,46px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-paper-50) font-[family-name:var(--lp-font-display)]">
                    Live classes,
                    <br />
                    real practice<span className="text-(--lp-orange-500)">.</span>
                  </h2>
                  <p className="mt-1.5 ml-auto max-w-[320px] text-sm text-(--lp-ink-300) text-wrap-pretty">
                    The free notes and video breakdowns stay free forever. Live classes add the parts you can&apos;t get
                    from a PDF.
                  </p>
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px,100%), 1fr))" }}>
                  {OFFERS.map((offer) => (
                    <div
                      key={offer.title}
                      className="flex min-h-[210px] flex-col rounded-[var(--lp-radius-md)] border border-(--lp-border-dark) bg-(--lp-ink-800) p-5 shadow-[var(--lp-shadow-inset-dark)] transition-colors hover:bg-(--lp-ink-700)"
                    >
                      <span className="grid size-[42px] place-items-center rounded-full bg-(--lp-orange-500) text-(--lp-paper-0)">
                        <Icon name={offer.icon} />
                      </span>
                      <div className="mt-[18px] mb-[7px] text-lg font-bold text-(--lp-paper-50)">{offer.title}</div>
                      <p className="m-0 text-xs text-(--lp-ink-300)">{offer.body}</p>
                      <span className="mt-auto ml-auto grid size-8 place-items-center rounded-full bg-(--lp-orange-500) text-(--lp-paper-0)">
                        <Icon name="north_east" className="!text-sm" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live classes — real subjects & pricing */}
        <section id="classes" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className={EYEBROW}>Live classes</div>
            <h2
              className="lp-reveal mt-2.5 mb-[clamp(24px,3vw,34px)] max-w-[18ch] text-[clamp(30px,4.6vw,48px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]"
              style={cssVars({ "--lp-reveal-delay": "60ms" })}
            >
              Pick a subject, start free<span className="text-(--lp-orange-500)">.</span>
            </h2>
            {subjects.length === 0 ? (
              <p className="text-sm text-(--lp-ink-400)">Classes are being set up. Check back shortly.</p>
            ) : (
              <div className="grid gap-[clamp(14px,2vw,20px)]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(280px,100%), 1fr))" }}>
                {subjects.map((subject, i) => (
                  <div
                    key={subject.id}
                    className="lp-reveal lp-lift rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-6 shadow-[var(--lp-shadow-sm)]"
                    style={cssVars({ "--lp-reveal-delay": `${i * 60}ms` })}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-lg font-bold text-(--lp-ink-900)">{subject.name}</h3>
                      <span className="shrink-0 rounded-full bg-(--lp-orange-50) px-2.5 py-0.5 text-xs font-semibold text-(--lp-orange-500)">
                        {subject.grade === "AL" ? "A/L" : "O/L"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-(--lp-ink-400)">{subject.description}</p>
                    <p className="mt-4 font-[family-name:var(--lp-font-display)] text-xl font-extrabold text-(--lp-ink-900)">
                      {formatLKR(subject.priceLKR)}
                      <span className="text-sm font-normal text-(--lp-ink-400)"> / month</span>
                    </p>
                    <p className="mt-1 text-xs font-semibold text-(--lp-green-500)">First 7 days free</p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-6 flex items-center gap-1.5 text-xs text-(--lp-ink-400)">
              <Icon name="check_circle" className="!text-sm text-(--lp-green-500)" />
              Secure payments via PayHere, or pay by bank deposit slip.
            </p>
          </div>
        </section>

        {/* Free resources */}
        <section id="resources" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className={`lp-reveal ${EYEBROW}`}>Free resources</div>
            <h2
              className="lp-reveal my-2.5 mb-[clamp(24px,3vw,34px)] max-w-[16ch] text-[clamp(30px,4.6vw,48px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]"
              style={cssVars({ "--lp-reveal-delay": "60ms" })}
            >
              Notes, papers, breakdowns<span className="text-(--lp-orange-500)">.</span>
            </h2>
            <div className="grid gap-[clamp(14px,2vw,20px)]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(280px,100%), 1fr))" }}>
              {RESOURCES.map((resource) => (
                <div
                  key={resource.title}
                  className="lp-reveal lp-lift flex flex-col rounded-[var(--lp-radius-card)] border-[1.5px] border-(--lp-ink-900) bg-(--lp-ink-900) p-2.5"
                  style={cssVars({ "--lp-reveal-delay": `${resource.delay}ms` })}
                >
                  <div className="relative grid h-[clamp(150px,17vw,190px)] place-items-center overflow-hidden rounded-[var(--lp-radius-md)] bg-(--lp-paper-200)">
                    <span className="text-(--lp-ink-900) opacity-55">
                      <Icon name={resource.icon} className="!text-5xl" />
                    </span>
                    <span className="absolute top-3 right-3 rounded-full bg-(--lp-paper-0) px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] text-(--lp-ink-900) uppercase">
                      {resource.badge}
                    </span>
                  </div>
                  <div className="flex items-end gap-3.5 px-2 pt-4 pb-2">
                    <div className="flex-1">
                      <div className="text-xs font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">{resource.tag}</div>
                      <div className="mt-2 text-lg font-bold text-(--lp-paper-50) text-wrap-pretty">{resource.title}</div>
                    </div>
                    <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-(--lp-orange-500) text-(--lp-paper-0)">
                      <Icon name="arrow_forward" className="!text-base" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col items-start gap-3 rounded-[var(--lp-radius-card)] border border-(--lp-orange-200) bg-(--lp-orange-50) p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="m-0 flex items-center gap-2 font-semibold text-(--lp-orange-600)">
                <Icon name="notifications_active" />
                Be the first to know when we publish
              </p>
              <EmailCaptureForm source="landing_resources" buttonLabel="Notify me" className="w-full sm:w-auto sm:min-w-[22rem]" />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className={`lp-reveal ${EYEBROW}`}>How it works</div>
            <h2
              className="lp-reveal my-2.5 mb-[clamp(24px,3vw,34px)] max-w-[18ch] text-[clamp(30px,4.6vw,48px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]"
              style={cssVars({ "--lp-reveal-delay": "60ms" })}
            >
              Four steps to your first class<span className="text-(--lp-orange-500)">.</span>
            </h2>
            <div className="grid gap-[clamp(14px,2vw,20px)]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(230px,100%), 1fr))" }}>
              {STEPS.map((step) => (
                <div
                  key={step.step}
                  className="lp-reveal lp-lift rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-6 shadow-[var(--lp-shadow-sm)]"
                  style={cssVars({ "--lp-reveal-delay": `${step.delay}ms` })}
                >
                  <div className="font-[family-name:var(--lp-font-mono)] text-xs text-(--lp-orange-500)">{step.step}</div>
                  <div className="mt-3 mb-2 text-lg font-bold text-(--lp-ink-900)">{step.title}</div>
                  <p className="m-0 text-sm text-(--lp-ink-400) text-wrap-pretty">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className="mx-auto w-full max-w-[900px] px-[clamp(20px,4vw,32px)]">
            <div className={`lp-reveal ${EYEBROW}`}>FAQ</div>
            <h2
              className="lp-reveal my-2.5 mb-[clamp(20px,3vw,30px)] max-w-[18ch] text-[clamp(30px,4.6vw,48px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]"
              style={cssVars({ "--lp-reveal-delay": "60ms" })}
            >
              Questions parents ask<span className="text-(--lp-orange-500)">.</span>
            </h2>
            <FaqAccordion items={FAQS} />
          </div>
        </section>

        {/* Final CTA */}
        <section id="cta" className="w-full pt-[clamp(32px,6vw,72px)]">
          <div className="lp-reveal relative w-full overflow-hidden bg-(--lp-orange-500)">
            <div
              data-lp-par="0.08"
              aria-hidden
              className="pointer-events-none absolute -top-[40%] -right-[5%] size-[520px] rounded-full bg-white/10"
            />
            <div className={`${CONTAINER} relative flex flex-wrap items-center gap-[clamp(24px,4vw,48px)] py-[clamp(40px,6vw,80px)]`}>
              <div className="flex-1 basis-[380px]">
                <div className="text-xs font-bold tracking-[0.14em] text-white/75 uppercase">Free 7-day trial</div>
                <h2 className="mt-3 text-[clamp(28px,4.4vw,46px)] leading-[1.06] font-extrabold tracking-[-0.03em] text-(--lp-paper-0) font-[family-name:var(--lp-font-display)]">
                  Start free. No card,
                  <br />
                  no catch<span className="text-(--lp-ink-900)">.</span>
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={startHref}
                  className="flex h-12 items-center gap-3 rounded-full bg-(--lp-ink-900) py-2 pr-2 pl-6 text-base font-semibold text-(--lp-paper-50) hover:bg-(--lp-ink-700)"
                >
                  {startLabel}
                  <span className="grid size-8 place-items-center rounded-full bg-(--lp-orange-500) text-(--lp-paper-0)">
                    <Icon name="arrow_forward" />
                  </span>
                </Link>
                <span className="text-xs text-white/85">One SMS code. No password.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-(--lp-ink-900) pt-[clamp(40px,6vw,72px)] pb-7">
          <div className={`${CONTAINER} grid gap-[clamp(24px,4vw,48px)]`} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(200px,100%), 1fr))" }}>
            <div>
              <div className="text-[22px] leading-none font-extrabold tracking-[-0.02em] text-(--lp-paper-50) font-[family-name:var(--lp-font-display)]">
                ICT<span className="text-(--lp-orange-500)">CLASS</span>
                <span className="text-(--lp-orange-500)">.</span>
              </div>
              <p className="mt-3.5 max-w-[240px] text-xs text-(--lp-ink-300)">
                O/L and A/L ICT in Sinhala medium, taught by Dr. Yasas Wickramasinghe.
              </p>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">Learn</div>
              <div className="flex flex-col gap-2.5">
                <a href="#resources" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">Free notes</a>
                <a href="#resources" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">Past papers</a>
                <a href="#teach" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">Live classes</a>
                <a href="#faq" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">Syllabus</a>
              </div>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">Teacher</div>
              <div className="flex flex-col gap-2.5">
                <span className="text-xs text-(--lp-ink-300)">PhD — Univ. of Canterbury</span>
                <span className="text-xs text-(--lp-ink-300)">Senior Lecturer — NZ</span>
                <a
                  href="https://www.linkedin.com/in/yasassri"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-(--lp-orange-500) hover:text-(--lp-orange-300)"
                >
                  LinkedIn / full CV
                </a>
              </div>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">Pay</div>
              <div className="flex flex-col gap-2.5">
                <span className="text-xs text-(--lp-ink-300)">PayHere card payments</span>
                <span className="text-xs text-(--lp-ink-300)">Bank deposit slip</span>
              </div>
            </div>
          </div>
          <div className={`${CONTAINER} mt-[clamp(32px,4vw,48px)] flex flex-wrap justify-between gap-3 border-t border-(--lp-border-dark) pt-5`}>
            <span className="text-[11px] text-(--lp-ink-400)">© 2026 ICT Class. All rights reserved.</span>
            <span className="text-[11px] text-(--lp-ink-400)">Articles, videos and notes — free, always.</span>
          </div>
        </footer>
      </ScrollEffects>
    </div>
  );
}
