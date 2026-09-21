import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { listSubjects, listSubjectSessions } from "@/lib/queries";
import { AL_ICT_UNITS } from "@/lib/content/al-ict-units";
import { formatLKR, formatSessionTime, relativeToNow } from "@/lib/format";
import { JsonLd } from "@/components/seo/JsonLd";
import { ScrollEffects } from "@/components/marketing/landing/ScrollEffects";
import { FaqAccordion } from "@/components/marketing/landing/FaqAccordion";
import { HowItWorksShowcase } from "@/components/marketing/landing/HowItWorksShowcase";
import { CrossPromoBand } from "@/components/marketing/landing/CrossPromoBand";
import { CampusReadyMark } from "@/components/marketing/CampusReadyLogo";
import { CAMPUS_READY } from "@/lib/content/campus-ready";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BoltIcon,
  CertificateIcon,
  CheckCircleIcon,
  ChecklistIcon,
  DownloadIcon,
  GraduationCapIcon,
  LanguageIcon,
  MedalIcon,
  PhoneIcon,
  VideoIcon,
  WalletIcon,
} from "@/components/marketing/landing/icons";
import { LAUNCH_NOTE, paymentsPaused } from "@/lib/payments/launch";
import { breadcrumbJsonLd, courseJsonLd, faqJsonLd, graphJsonLd } from "@/lib/seo/json-ld";
import {
  EXAM_STRUCTURE,
  SYLLABUS_AUTHORITY,
  TEACHER_CREDENTIALS,
  TEACHER_NAME,
} from "@/lib/seo/site";
import type { ClassSession, Subject } from "@/lib/types";

/**
 * The page for the query that actually converts: "A/L ICT class",
 * "A/L ICT online class", "AL ICT tuition", "උසස් පෙළ ICT පන්ති".
 *
 * Built on the same `.landing-ict` + `ScrollEffects` system as the home page
 * rather than the plainer `ds-cream` treatment most public pages use — this is
 * the second-highest-intent page on the site (someone comparing tuition
 * classes, ready to pay) and it earns the same hero, parallax and reveal
 * motion the home page gets. The H1, metadata, keywords, FAQ facts and Course
 * schema are unchanged from the version that already ranks; only the skin and
 * the amount of Sinhala changed.
 */

const TITLE = "A/L ICT Classes Online — Sinhala & English, Grades 12 & 13";
const DESCRIPTION =
  "Live online A/L ICT classes for Sri Lankan Grade 12 and 13 students, in Sinhala and English medium, following the full NIE syllabus (all 14 units). Past paper discussions, instant quizzes, downloadable notes, and a free 7-day trial with no card required. Taught by Dr. Yasas Sri Wickramasinghe, PhD.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/al-ict-classes" },
  keywords: [
    "A/L ICT class",
    "A/L ICT classes online",
    "AL ICT tuition",
    "A/L ICT online class Sinhala and English medium",
    "ICT tuition Sri Lanka",
    "Advanced Level ICT class",
    "grade 12 ICT class",
    "grade 13 ICT class",
    "උසස් පෙළ ICT පන්ති",
    "තොරතුරු තාක්ෂණය පන්ති",
  ],
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "/al-ict-classes",
  },
};

// Public and crawlable, so it renders from a cached guest pass rather than a
// per-visitor session read — same reasoning as /notes and /syllabus.
export const revalidate = 3600;

const SUBJECT_ID = "al-ict";
const CONTAINER = "mx-auto w-full max-w-[1180px] px-[clamp(20px,4vw,32px)]";
const EYEBROW = "text-[13px] font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase";

// `components/syllabus/motion.tsx`'s cssVars is a "use client" export and
// can't be called from this server component — same helper, defined locally.
function cssVars(vars: Record<string, string>): React.CSSProperties {
  return vars as React.CSSProperties;
}

const NAV_LINKS = [
  { href: "#classes", label: "Classes & fees" },
  { href: "#syllabus", label: "Syllabus" },
  { href: "#why", label: "Why live" },
  { href: "#faq", label: "FAQ" },
] as const;

const STEPS = [
  { step: "01", title: "Sign up with your phone", body: "One-time SMS code — no password to forget." },
  { step: "02", title: "Start free", body: "Every subject includes a free 7-day trial. No card needed." },
  { step: "03", title: "Join live from your phone", body: "Zoom class, instant quizzes, island-wide leaderboard." },
  { step: "04", title: "Keep the notes", body: "Download class notes and past papers straight after." },
] as const;

/**
 * Written against what a student or parent actually types before choosing a
 * class — medium, cost, whether a missed class is recoverable, whether the
 * phone is enough. Every answer is a fact about this platform, not a slogan,
 * because these are also what an AI assistant will quote back.
 */
const FAQS = [
  {
    q: "Are the A/L ICT classes in Sinhala medium or English medium?",
    a: "Both — ICT Campus runs the same NIE A/L ICT syllabus live in Sinhala medium and in English medium, so pick whichever you actually think in.",
  },
  {
    q: "Which grades are covered?",
    a: "Grades 12 and 13, the full two-year syllabus. Grade 12 is units 1–6 (concepts, computer fundamentals, data representation, digital circuits, operating systems, networking); Grade 13 is units 7–14 (system analysis, databases, Python, web development, IoT, ICT in business, new trends, and the project).",
  },
  {
    q: "How much do the classes cost?",
    a: "A monthly fee per subject, shown below. Every subject starts with a free 7-day trial and no card is required to begin, so you sit in on a real class before paying anything, and there's no forced auto-renewal after.",
  },
  {
    q: "Can I join from a phone?",
    a: "Yes — that's how most students actually join. Classes run in the browser on any phone, tablet or laptop, nothing to install. Sign in with your Sri Lankan mobile number and a one-time SMS code; there's no password to forget.",
  },
  {
    q: "What happens if I miss a live class?",
    a: "The recording goes up on your subject page and you can download it — a missed class is caught up, not lost.",
  },
  {
    q: "Do the classes cover past papers?",
    a: "Yes, worked through in class. There's also a free 2026 Paper I MCQ practice paper and command-word guidance published openly on this site, whether or not you ever join a class.",
  },
  {
    q: "Who teaches the class?",
    a: `${TEACHER_NAME} — PhD in Human Interface Technology from the University of Canterbury, New Zealand, a senior lecturer, a former lecturer at the University of Moratuwa, and a former industry researcher and tech lead at Sony, 99X and Niantic. Every note, video and live class is taught by him, personally — there's no panel of assistant tutors.`,
  },
  {
    q: "How do I pay?",
    a: "By card through PayHere, by uploading a bank deposit slip, or by cash or bank transfer recorded directly by the teacher. All three get the same numbered receipt.",
  },
] as const;

type LandingIcon = (props: { className?: string }) => React.JSX.Element;

const WHY: Array<{ icon: LandingIcon; title: string; body: string }> = [
  {
    icon: VideoIcon,
    title: "Live, not recorded",
    body: "You ask a question and get the answer in the class, not in a comment thread three days later. Recordings exist for catch-up, but the class itself is live.",
  },
  {
    icon: BoltIcon,
    title: "Quizzes during the class",
    body: "A question drops mid-lesson, you answer on your phone, and the island-wide leaderboard shows up right after — you find out you misunderstood something in the same hour you learned it.",
  },
  {
    icon: CertificateIcon,
    title: "Marks, not just content",
    body: "Knowing the syllabus and scoring on it are two different skills. Command words, answer structure and where examiners actually give marks get taught alongside the content.",
  },
  {
    icon: DownloadIcon,
    title: "Notes you keep",
    body: "Class notes, past papers and marking schemes download straight after the class and stay yours — no re-typing from a whiteboard photo.",
  },
  {
    icon: MedalIcon,
    title: "Timed mock exams",
    body: "Full papers, real conditions, a live rank against everyone else sitting it — so the first timed paper of your life isn't the real one.",
  },
  {
    icon: PhoneIcon,
    title: "Built for a phone",
    body: "Sign in with an SMS code, join from the browser, no app and no password. This was built for a student on mobile data, not a desktop computer lab.",
  },
];

export default async function AlIctClassesPage() {
  const [subjects, sessions] = await Promise.all([
    listSubjects().catch(() => [] as Subject[]),
    listSubjectSessions(SUBJECT_ID).catch(() => [] as ClassSession[]),
  ]);

  const grade12 = AL_ICT_UNITS.filter((u) => u.gradeYear === 12);
  const grade13 = AL_ICT_UNITS.filter((u) => u.gradeYear === 13);
  const totalPeriods = AL_ICT_UNITS.reduce((n, u) => n + u.periods, 0);

  // The cheapest published subject is what the page quotes as "from", and what
  // the Offer in the structured data carries. With nothing published yet the
  // price is omitted entirely rather than invented — a wrong price in schema
  // is a manual action, not a small mistake.
  const priceLKR = subjects.length > 0 ? Math.min(...subjects.map((s) => s.priceLKR)) : undefined;
  const upcoming = sessions.slice(0, 3);
  const nextSession = upcoming[0];
  // Trial-only launch — see `lib/payments/launch.ts`. The fees below stay on
  // the page, because they are what the class will cost; what changes is that
  // the page stops implying a student can pay one today.
  const paused = paymentsPaused();

  // Only the page-specific node. The root layout already ships the
  // organisation, the site and the teacher on every page, and the `@id`
  // references inside `courseJsonLd` resolve against those — repeating them
  // here would just be the same three entities twice on the wire.
  const schema = graphJsonLd([
    courseJsonLd({
      name: "A/L ICT — Live Online Classes (Grades 12 & 13, Sinhala & English Medium)",
      description: DESCRIPTION,
      priceLKR,
      path: "/al-ict-classes",
    }),
  ]);

  const glance: Array<{ icon: LandingIcon; label: string; value: string }> = [
    { icon: GraduationCapIcon, label: "Subject", value: "A/L ICT" },
    { icon: ChecklistIcon, label: "Grades", value: "12 and 13" },
    { icon: LanguageIcon, label: "Medium", value: "Sinhala & English" },
    { icon: PhoneIcon, label: "Format", value: "Live online" },
    { icon: CertificateIcon, label: "Syllabus", value: `${AL_ICT_UNITS.length} units · ${totalPeriods} periods` },
    {
      icon: WalletIcon,
      label: "Fee",
      value: paused ? "Free during launch" : priceLKR ? `From ${formatLKR(priceLKR)} / mo` : "See below",
    },
  ];

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd data={faqJsonLd(FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "A/L ICT classes", path: "/al-ict-classes" },
        ])}
      />

      <ScrollEffects>
        <div data-lp-progress className="fixed top-0 left-0 z-[60] h-[3px] w-0 bg-(--lp-orange-500)" />

        {/* Floating pill nav */}
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div
            data-lp-nav
            className="lp-nav pointer-events-auto flex max-w-full items-center gap-[clamp(8px,1.6vw,18px)] rounded-full bg-(--lp-ink-900) py-2 pr-2 pl-5"
          >
            <Link
              href="/"
              className="font-[family-name:var(--lp-font-display)] text-lg font-extrabold tracking-[-0.02em] whitespace-nowrap text-white"
            >
              ICT<span className="text-(--lp-orange-500)">CAMPUS</span>
            </Link>
            <nav className="hidden items-center gap-0.5 sm:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap text-white hover:bg-(--lp-ink-700) hover:text-(--lp-orange-300)"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <Link
              href="/go?do=trial&subject=al-ict"
              className="flex items-center gap-2 rounded-full bg-(--lp-orange-500) py-2 pr-2 pl-4 text-xs font-semibold whitespace-nowrap text-white shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600) hover:text-white"
            >
              Start free
              <span className="grid size-6 place-items-center overflow-hidden rounded-full bg-white text-(--lp-orange-500)">
                <ArrowRightIcon className="size-3.5" />
              </span>
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* Hero                                                          */}
        {/* ------------------------------------------------------------ */}
        <section className="relative flex min-h-[92svh] items-center overflow-hidden py-[clamp(120px,14vh,180px)] pb-[clamp(48px,7vh,96px)]">
          <div
            data-lp-par="0.05"
            aria-hidden
            className="pointer-events-none absolute -top-[8%] -right-[6%] size-[min(60vw,760px)] rounded-full"
            style={{ background: "radial-gradient(circle at 50% 50%, rgba(244,85,30,0.20), rgba(244,85,30,0) 68%)" }}
          />

          <div
            className={`${CONTAINER} relative grid items-center gap-[clamp(32px,5vw,56px)]`}
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(430px,100%), 1fr))" }}
          >
            <div className="lp-reveal">
              {/* The eyebrow carries the four qualifiers that decide whether a
                  student searching for a class has landed on the right one:
                  level, grades, medium, country. */}
              <p className="mb-2 text-xs font-semibold text-(--lp-ink-400)">
                A/L ICT · Grades 12 &amp; 13 · Sinhala &amp; English · Sri Lanka
              </p>

              {/* The H1 carries the query verbatim, exact text unchanged from
                  the version that already ranks — no <br>, so the wording a
                  crawler extracts has no missing word-boundary either. Only
                  the closing full stop is new, per the design system's one
                  orange period per screen. */}
              <h1 className="m-0 text-[clamp(34px,5.2vw,54px)] leading-[1.08] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) text-wrap-balance font-[family-name:var(--lp-font-display)]">
                A/L ICT classes online — Sinhala &amp; English, Grades 12 &amp; 13
                <span className="text-(--lp-orange-500)">.</span>
              </h1>

              <p className="my-[clamp(18px,2.4vw,26px)] max-w-[540px] text-[clamp(15px,1.4vw,18px)] text-(--lp-ink-500) text-wrap-pretty">
                Live A/L ICT tuition covering the complete {SYLLABUS_AUTHORITY} syllabus — all{" "}
                {AL_ICT_UNITS.length} units, Grade 12 and Grade 13 — taught by{" "}
                <Link
                  href="/dr-yasas"
                  className="font-bold text-(--lp-ink-900) underline decoration-(--lp-orange-500) underline-offset-2"
                >
                  {TEACHER_NAME}
                </Link>
                . First 7 days free, no card needed.
              </p>

              <p lang="si" className="si mb-[clamp(18px,2.4vw,26px)] max-w-[540px] text-sm text-(--lp-ink-500)">
                සිංහල මාධ්‍යයෙන් සහ ඉංග්‍රීසි මාධ්‍යයෙන් දෙකෙන්ම පන්ති තියෙනවා — ඔබේ දුරකථනයෙන්ම සම්බන්ධ විය හැක.
              </p>

              <div className="flex flex-wrap items-center gap-[clamp(12px,1.6vw,18px)]">
                <Link
                  href="/go?do=trial&subject=al-ict"
                  className="flex h-12 items-center gap-3 rounded-full bg-(--lp-orange-500) py-2 pr-2 pl-6 text-base font-semibold text-white shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600) hover:text-white"
                >
                  Start the free 7-day trial
                  <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-white text-(--lp-orange-500)">
                    <ArrowRightIcon className="size-4" />
                  </span>
                </Link>
                <Link
                  href="/syllabus"
                  className="flex h-12 items-center gap-3 px-1 text-base font-semibold text-(--lp-ink-900) hover:text-(--lp-orange-600)"
                >
                  Browse the syllabus first
                  <span className="grid size-8 place-items-center overflow-hidden rounded-full border-[1.5px] border-(--lp-ink-900) text-(--lp-ink-900)">
                    <ArrowUpRightIcon className="size-3.5" />
                  </span>
                </Link>
              </div>

              <div className="mt-[clamp(28px,3.6vw,40px)] flex flex-wrap gap-2.5">
                <span className="rounded-full border border-(--lp-border-subtle) bg-(--lp-paper-0) px-3.5 py-1.5 text-xs text-(--lp-ink-500)">
                  PhD — University of Canterbury, NZ
                </span>
                <span className="rounded-full border border-(--lp-border-subtle) bg-(--lp-paper-0) px-3.5 py-1.5 text-xs text-(--lp-ink-500)">
                  No card for the trial
                </span>
                <span className="rounded-full border border-(--lp-border-subtle) bg-(--lp-paper-0) px-3.5 py-1.5 text-xs text-(--lp-ink-500)">
                  Cancel any time
                </span>
              </div>

              {nextSession ? (
                <p className="mt-5 flex items-center gap-2 text-sm text-(--lp-ink-500)">
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--lp-orange-500) opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-(--lp-orange-500)" />
                  </span>
                  Next live class: <span className="font-semibold text-(--lp-ink-900)">{nextSession.title}</span> ·{" "}
                  {formatSessionTime(nextSession.startsAt)} ({relativeToNow(nextSession.startsAt)})
                </p>
              ) : null}
            </div>

            <div className="relative grid min-h-[clamp(340px,50vh,540px)] place-items-end justify-items-center">
              <div
                data-lp-par="0.10"
                aria-hidden
                className="absolute bottom-[6%] left-1/2 aspect-square w-[min(80%,420px)] -translate-x-1/2 rounded-full bg-(--lp-orange-500)"
              />
              <Image
                data-lp-par="-0.06"
                src="/images/dr-yasas.png"
                alt={TEACHER_NAME}
                width={881}
                height={1241}
                priority
                className="relative block h-auto w-[min(88%,420px)] drop-shadow-[0_24px_48px_rgba(14,12,11,0.22)]"
              />

              <div
                data-lp-par="-0.14"
                className="absolute top-[8%] left-0 flex items-center gap-2.5 rounded-full bg-(--lp-paper-0) py-[9px] pr-4 pl-[10px] shadow-[var(--lp-shadow-md)]"
              >
                <span className="grid size-[30px] place-items-center overflow-hidden rounded-full bg-(--lp-orange-50) text-(--lp-orange-500)">
                  <GraduationCapIcon className="size-[18px]" />
                </span>
                <span className="text-xs font-semibold whitespace-nowrap text-(--lp-ink-900)">PhD, Human Interface Tech</span>
              </div>

              <div data-lp-par="-0.20" className="absolute right-0 bottom-[14%] rounded-2xl bg-(--lp-ink-900) px-[18px] py-3.5 shadow-[var(--lp-shadow-lg)]">
                <div className="font-[family-name:var(--lp-font-display)] text-lg leading-tight font-extrabold tracking-[-0.02em] whitespace-nowrap text-(--lp-paper-50)">
                  {AL_ICT_UNITS.length}/{AL_ICT_UNITS.length} <span className="text-(--lp-orange-500)">·</span> units covered
                </div>
                <div className="mt-1 text-[11px] text-(--lp-ink-300)">Grade 12 &amp; 13, nothing skipped</div>
              </div>
            </div>
          </div>
        </section>

        {/* At a glance */}
        <section className="w-full py-[clamp(16px,3vw,32px)]">
          <div className={CONTAINER}>
            <div
              className="lp-reveal grid gap-[clamp(14px,2.2vw,24px)] rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-[clamp(20px,3vw,28px)] shadow-[var(--lp-shadow-sm)]"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
            >
              {glance.map((row) => (
                <div key={row.label} className="flex flex-col items-center gap-2 text-center">
                  <span className="grid size-[38px] place-items-center overflow-hidden rounded-full bg-(--lp-orange-50) text-(--lp-orange-500)">
                    <row.icon className="size-[18px]" />
                  </span>
                  <div className="font-[family-name:var(--lp-font-display)] text-sm leading-none font-extrabold tracking-[-0.01em] text-(--lp-ink-900)">
                    {row.value}
                  </div>
                  <div className="text-[11px] text-(--lp-ink-400)">{row.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Classes and fees                                              */}
        {/* ------------------------------------------------------------ */}
        <section id="classes" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className={`lp-reveal ${EYEBROW}`}>Classes and fees</div>
            <h2
              className="lp-reveal mt-2.5 mb-[clamp(24px,3vw,34px)] max-w-[18ch] text-[clamp(28px,4vw,42px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]"
              style={cssVars({ "--lp-reveal-delay": "60ms" })}
            >
              Pick a subject, start free<span className="text-(--lp-orange-500)">.</span>
            </h2>

            {subjects.length === 0 ? (
              <div className="rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-6 text-center">
                <p className="font-[family-name:var(--lp-font-display)] text-lg font-extrabold text-(--lp-ink-900)">
                  Classes are being set up for the new intake
                </p>
                <p className="mt-1.5 text-sm text-(--lp-ink-400)">Message us and we&apos;ll tell you the moment enrolment opens.</p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex h-10 items-center gap-2.5 rounded-full bg-(--lp-orange-500) px-5 text-sm font-semibold text-white hover:bg-(--lp-orange-600) hover:text-white"
                >
                  Message us
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              </div>
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
                        A/L
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-(--lp-ink-400)">{subject.description}</p>
                    <p className="mt-4 font-[family-name:var(--lp-font-display)] text-xl font-extrabold text-(--lp-ink-900)">
                      {paused ? "Free during launch" : formatLKR(subject.priceLKR)}
                      {paused ? null : <span className="text-sm font-normal text-(--lp-ink-400)"> / month</span>}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-(--lp-green-500)">
                      {paused
                        ? `No payment required · ${formatLKR(subject.priceLKR)} / month after launch`
                        : "First 7 days free · no card required"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {upcoming.length > 0 ? (
              <div className="lp-reveal mt-5 rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-5">
                <h3 className="flex items-center gap-2 font-bold text-(--lp-ink-900)">
                  <span className="grid size-7 place-items-center overflow-hidden rounded-full bg-(--lp-orange-50) text-(--lp-orange-500)">
                    <VideoIcon className="size-3.5" />
                  </span>
                  Next live classes
                </h3>
                <ul className="mt-3 space-y-1.5 text-sm text-(--lp-ink-400)">
                  {upcoming.map((s) => (
                    <li key={s.id}>
                      <span className="font-semibold text-(--lp-ink-900)">{s.title}</span> · {formatSessionTime(s.startsAt)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {paused ? (
              <div className="lp-reveal mt-5 rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-5">
                <div className={EYEBROW}>{LAUNCH_NOTE.eyebrow}</div>
                <p className="mt-2 font-[family-name:var(--lp-font-display)] text-lg font-extrabold text-(--lp-ink-900)">
                  {LAUNCH_NOTE.title}
                </p>
                <p className="mt-2 max-w-[62ch] text-sm text-(--lp-ink-400)">{LAUNCH_NOTE.body}</p>
                <Link
                  href="/go?do=trial&subject=al-ict"
                  className="mt-4 inline-flex h-11 items-center gap-3 rounded-full bg-(--lp-orange-500) py-2 pr-2 pl-5 text-sm font-semibold text-white shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600) hover:text-white"
                >
                  {LAUNCH_NOTE.cta}
                  <span className="grid size-7 place-items-center overflow-hidden rounded-full bg-white text-(--lp-orange-500)">
                    <ArrowRightIcon className="size-3.5" />
                  </span>
                </Link>
              </div>
            ) : (
              <p className="mt-6 flex items-center gap-1.5 text-xs text-(--lp-ink-400)">
                <CheckCircleIcon className="size-4 text-(--lp-green-500)" />
                Secure payments via PayHere, or pay by bank deposit slip.
              </p>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Why live beats recorded                                      */}
        {/* ------------------------------------------------------------ */}
        <section id="why" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className="lp-reveal relative overflow-hidden rounded-[var(--lp-radius-panel)] bg-(--lp-ink-900) p-[clamp(26px,4vw,44px)]">
              <div
                data-lp-par="0.06"
                aria-hidden
                className="pointer-events-none absolute -top-[30%] -left-[10%] size-[520px] rounded-full"
                style={{ background: "radial-gradient(circle, rgba(244,85,30,0.18), rgba(244,85,30,0) 70%)" }}
              />
              <div className="relative">
                <div className={EYEBROW}>Why this beats a recorded course</div>
                <h2 className="my-2.5 mb-[clamp(24px,3vw,34px)] max-w-[20ch] text-[clamp(28px,4vw,42px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-paper-50) font-[family-name:var(--lp-font-display)]">
                  What makes it different<span className="text-(--lp-orange-500)">.</span>
                </h2>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(230px,100%), 1fr))" }}>
                  {WHY.map((item) => (
                    <div
                      key={item.title}
                      className="flex min-h-[190px] flex-col rounded-[var(--lp-radius-md)] border border-(--lp-border-dark) bg-(--lp-ink-800) p-5 shadow-[var(--lp-shadow-inset-dark)] transition-colors hover:bg-(--lp-ink-700)"
                    >
                      <span className="grid size-[42px] place-items-center overflow-hidden rounded-full bg-(--lp-orange-500) text-(--lp-paper-0)">
                        <item.icon className="size-5" />
                      </span>
                      <div className="mt-[18px] mb-[7px] text-base font-bold text-(--lp-paper-50)">{item.title}</div>
                      <p className="m-0 text-xs text-(--lp-ink-300)">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className={`lp-reveal ${EYEBROW}`}>How it works</div>
            <h2
              className="lp-reveal my-2.5 mb-[clamp(24px,3vw,34px)] max-w-[18ch] text-[clamp(28px,4vw,42px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]"
              style={cssVars({ "--lp-reveal-delay": "60ms" })}
            >
              Four steps to your first class<span className="text-(--lp-orange-500)">.</span>
            </h2>
            <div className="lp-reveal" style={cssVars({ "--lp-reveal-delay": "120ms" })}>
              <HowItWorksShowcase steps={STEPS} />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Sinhala                                                       */}
        {/* ------------------------------------------------------------ */}
        <section className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div
              lang="si"
              className="si lp-reveal rounded-[var(--lp-radius-panel)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-[clamp(24px,4vw,44px)] shadow-[var(--lp-shadow-sm)]"
            >
              <div className={EYEBROW}>සිංහල මාධ්‍යය</div>
              <h2 className="mt-3 text-[clamp(22px,3vw,32px)] leading-[1.18] font-extrabold tracking-[-0.02em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]">
                උසස් පෙළ ICT පන්ති — 12 සහ 13 ශ්‍රේණි, සිංහල මාධ්‍යයෙන්
              </h2>
              <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-(--lp-ink-500)">
                මාර්ගගත (online) සජීවී ICT පන්ති, සම්පූර්ණයෙන්ම {SYLLABUS_AUTHORITY} විෂය නිර්දේශයට අනුව —
                ඒකක {AL_ICT_UNITS.length}ම ආවරණය කරමින්. ලියාපදිංචිය ඔබේ ජංගම දුරකථන අංකයෙන් සහ SMS
                කේතයකින් — මුරපදයක් අවශ්‍ය නොවේ. පළමු දින 7 නොමිලේ, ණයපත් අවශ්‍ය නොවේ.
              </p>
              <ul className="mt-5 grid gap-2.5 text-sm text-(--lp-ink-500)" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(260px,100%), 1fr))" }}>
                <li>· ඔබේ දුරකථනයෙන්ම පන්තියට සම්බන්ධ විය හැක — යෙදුමක් අවශ්‍ය නොවේ.</li>
                <li>· පන්තියේදීම ක්ෂණික ප්‍රශ්නාවලි සහ ලංකාව පුරාම leaderboard එකක්.</li>
                <li>· පසුගිය විභාග ප්‍රශ්න පත්‍ර සාකච්ඡා සහ ආදර්ශ (mock) විභාග.</li>
                <li>· පංතියෙන් පස්සේම බාගත කළ හැකි සටහන් සහ past papers.</li>
                <li>· ඉංග්‍රීසි මාධ්‍යයෙන් ද පන්ති පවත්වනු ලැබේ.</li>
                <li>· උගන්වන්නේ ආචාර්ය යසස් ශ්‍රී වික්‍රමසිංහ — Canterbury විශ්වවිද්‍යාලයේ (NZ) PhD, ජ්‍යෙෂ්ඨ කථිකාචාර්යවරයෙකි.</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/go?do=trial&subject=al-ict"
                  className="flex h-11 items-center rounded-full bg-(--lp-orange-500) px-5 text-sm font-semibold text-white hover:bg-(--lp-orange-600) hover:text-white"
                >
                  නොමිලේ දින 7ක් අත්හදා බලන්න
                </Link>
                <a
                  href="#classes"
                  className="flex h-11 items-center rounded-full border-[1.5px] border-(--lp-ink-900) px-5 text-sm font-semibold text-(--lp-ink-900) hover:text-(--lp-orange-600)"
                >
                  ගාස්තු බලන්න
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* The full unit list — the page's substance                    */}
        {/* ------------------------------------------------------------ */}
        <section id="syllabus" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className={`lp-reveal ${EYEBROW}`}>The full syllabus</div>
            <h2
              className="lp-reveal mt-2.5 mb-2 max-w-[22ch] text-[clamp(28px,4vw,42px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]"
              style={cssVars({ "--lp-reveal-delay": "60ms" })}
            >
              Every unit covered, Grade 12 and Grade 13<span className="text-(--lp-orange-500)">.</span>
            </h2>
            <p className="lp-reveal mb-[clamp(24px,3vw,34px)] max-w-[62ch] text-sm text-(--lp-ink-400)" style={cssVars({ "--lp-reveal-delay": "100ms" })}>
              The {SYLLABUS_AUTHORITY} A/L ICT syllabus, unit by unit, with the syllabus&apos;s own numbering and
              period counts — nothing renumbered, nothing skipped.
            </p>

            {[
              { year: 12 as const, units: grade12 },
              { year: 13 as const, units: grade13 },
            ].map(({ year, units }, groupIdx) => (
              <div key={year} className="mt-8 first:mt-0">
                <h3 className="font-[family-name:var(--lp-font-display)] text-lg font-extrabold text-(--lp-ink-900)">
                  Grade {year}
                  <span className="ml-2 text-sm font-normal text-(--lp-ink-400)">
                    units {units[0]?.competencyNumber}–{units[units.length - 1]?.competencyNumber}
                  </span>
                </h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {units.map((u, i) => (
                    <li key={u.id} className="lp-reveal lp-lift" style={cssVars({ "--lp-reveal-delay": `${(groupIdx * units.length + i) * 30}ms` })}>
                      <Link
                        href={`/syllabus/${SUBJECT_ID}/${u.id}`}
                        className="flex flex-wrap items-baseline justify-between gap-2 rounded-[var(--lp-radius-md)] border border-(--lp-border-subtle) bg-(--lp-paper-0) px-4 py-3 hover:border-(--lp-orange-500)"
                      >
                        <span className="text-sm font-semibold text-(--lp-ink-900)">
                          <span className="text-(--lp-orange-500)">{u.competencyNumber}.</span> {u.title}
                        </span>
                        <span className="text-xs text-(--lp-ink-400)">
                          {u.lessons.length} lessons · {u.periods} periods
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Exam structure */}
        <section className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className={`lp-reveal ${EYEBROW}`}>The exam</div>
            <h2
              className="lp-reveal mt-2.5 mb-[clamp(24px,3vw,34px)] max-w-[22ch] text-[clamp(28px,4vw,42px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]"
              style={cssVars({ "--lp-reveal-delay": "60ms" })}
            >
              How the A/L ICT exam is structured<span className="text-(--lp-orange-500)">.</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[EXAM_STRUCTURE.paper1, EXAM_STRUCTURE.paper2].map((paper, i) => (
                <div
                  key={paper.name}
                  className="lp-reveal rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-5"
                  style={cssVars({ "--lp-reveal-delay": `${i * 60}ms` })}
                >
                  <h3 className="font-bold text-(--lp-ink-900)">{paper.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-(--lp-orange-500)">
                    {paper.durationMinutes / 60} hours
                    {"questions" in paper ? ` · ${paper.questions} questions` : ""}
                  </p>
                  <p className="mt-2 text-sm text-(--lp-ink-400)">{paper.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-(--lp-ink-400)">
              Free and open to everyone:{" "}
              <Link href="/past-papers" className="text-(--lp-orange-600) underline decoration-(--lp-orange-500) underline-offset-2">
                the past papers guide
              </Link>
              ,{" "}
              <Link
                href="/papers/al-ict-2026-paper-1-mcq"
                className="text-(--lp-orange-600) underline decoration-(--lp-orange-500) underline-offset-2"
              >
                a full 2026 Paper I MCQ practice paper
              </Link>{" "}
              and{" "}
              <Link href="/command-words" className="text-(--lp-orange-600) underline decoration-(--lp-orange-500) underline-offset-2">
                what every exam command word requires
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Who teaches this */}
        <section className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className="lp-reveal flex flex-wrap items-center gap-[clamp(20px,4vw,36px)] rounded-[var(--lp-radius-panel)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-[clamp(24px,4vw,40px)]">
              <Image
                src="/images/dr-yasas.png"
                alt={TEACHER_NAME}
                width={160}
                height={225}
                className="hidden h-[140px] w-auto shrink-0 rounded-[var(--lp-radius-md)] object-cover sm:block"
              />
              <div className="min-w-0 flex-1">
                <div className={EYEBROW}>Who teaches these classes</div>
                <p className="mt-2 max-w-[62ch] text-(--lp-ink-500)">
                  <Link
                    href="/dr-yasas"
                    className="font-bold text-(--lp-ink-900) underline decoration-(--lp-orange-500) underline-offset-2"
                  >
                    {TEACHER_NAME}
                  </Link>{" "}
                  teaches every class, writes every note and records every video on this site personally — there
                  is no panel of assistant tutors.
                </p>
                <ul className="mt-4 grid gap-1.5 text-sm text-(--lp-ink-500) sm:grid-cols-2">
                  {TEACHER_CREDENTIALS.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-(--lp-green-500)" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* The one pointer to the other product. After the class argument is
            finished and before the FAQ, so the closing CTA still closes rather
            than following a second offer — same placement as the home page. */}
        <CrossPromoBand
          eyebrow="After your A/Ls"
          title="Campus Ready"
          body={`You'll wait about a year for university. ${CAMPUS_READY.weeks} weeks of Excel, Python, Power BI and referencing — the skills every degree assumes you already have.`}
          href="/campus-ready"
          cta="See the programme"
          mark={<CampusReadyMark size={24} />}
        />

        {/* FAQ */}
        <section id="faq" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className="mx-auto w-full max-w-[900px] px-[clamp(20px,4vw,32px)]">
            <div className={`lp-reveal ${EYEBROW}`}>FAQ</div>
            <h2
              className="lp-reveal my-2.5 mb-[clamp(20px,3vw,30px)] max-w-[18ch] text-[clamp(28px,4.2vw,42px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]"
              style={cssVars({ "--lp-reveal-delay": "60ms" })}
            >
              Questions students and parents ask<span className="text-(--lp-orange-500)">.</span>
            </h2>
            <FaqAccordion items={FAQS} />
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full pt-[clamp(32px,6vw,72px)]">
          <div className="lp-reveal relative w-full overflow-hidden bg-(--lp-orange-500)">
            <div
              data-lp-par="0.08"
              aria-hidden
              className="pointer-events-none absolute -top-[40%] -right-[5%] size-[520px] rounded-full bg-white/10"
            />
            <div className={`${CONTAINER} relative flex flex-wrap items-center gap-[clamp(24px,4vw,48px)] py-[clamp(40px,6vw,72px)]`}>
              <div className="flex-1 basis-[380px]">
                <div className="text-xs font-bold tracking-[0.14em] text-white/75 uppercase">Free 7-day trial</div>
                <h2 className="mt-3 text-[clamp(26px,4vw,42px)] leading-[1.08] font-extrabold tracking-[-0.03em] text-(--lp-paper-0) font-[family-name:var(--lp-font-display)]">
                  Sit in on a real class
                  <br />
                  before you pay<span className="text-(--lp-ink-900)">.</span>
                </h2>
                <p className="mt-2 max-w-[46ch] text-sm text-white/85">
                  Seven days free, no card, no auto-renewal. Sign in with your mobile number and one SMS code.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/go?do=trial&subject=al-ict"
                  className="flex h-12 items-center gap-3 rounded-full bg-(--lp-ink-900) py-2 pr-2 pl-6 text-base font-semibold text-white hover:bg-(--lp-ink-700) hover:text-white"
                >
                  Start free
                  <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-(--lp-orange-500) text-white">
                    <ArrowRightIcon className="size-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-(--lp-ink-900) pt-[clamp(32px,5vw,56px)] pb-7">
          <div className={`${CONTAINER} grid gap-[clamp(20px,4vw,40px)]`} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(200px,100%), 1fr))" }}>
            <div>
              <div className="text-[20px] leading-none font-extrabold tracking-[-0.02em] text-(--lp-paper-50) font-[family-name:var(--lp-font-display)]">
                ICT<span className="text-(--lp-orange-500)">CAMPUS</span>
                <span className="text-(--lp-orange-500)">.</span>
              </div>
              <p className="mt-3.5 max-w-[240px] text-xs text-(--lp-ink-300)">
                A/L ICT (Grades 12 &amp; 13) in Sinhala and English medium, taught by {TEACHER_NAME}.
              </p>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">Learn</div>
              <div className="flex flex-col gap-2.5">
                <Link href="/" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">ICT Campus home</Link>
                <Link href="/syllabus" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">A/L ICT syllabus</Link>
                <Link href="/notes" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">Free A/L ICT notes</Link>
                <Link href="/past-papers" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">A/L ICT past papers</Link>
                <Link href="/dr-yasas" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">{TEACHER_NAME}</Link>
                <Link href="/campus-ready" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">Campus Ready — after A/L course</Link>
              </div>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">Legal</div>
              <div className="flex flex-col gap-2.5">
                <Link href="/terms" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">Terms of service</Link>
                <Link href="/privacy" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">Privacy policy</Link>
                <Link href="/refund-policy" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">Refunds &amp; cancellation</Link>
                <Link href="/contact" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">Contact us</Link>
              </div>
            </div>
          </div>
          <div className={`${CONTAINER} mt-[clamp(24px,4vw,40px)] flex flex-wrap justify-between gap-3 border-t border-(--lp-border-dark) pt-5`}>
            <span className="text-[11px] text-(--lp-ink-400)">© 2026 ICT Campus. All rights reserved.</span>
            <span className="text-[11px] text-(--lp-ink-400)">Live classes, real practice, notes you keep.</span>
          </div>
        </footer>
      </ScrollEffects>
    </>
  );
}
