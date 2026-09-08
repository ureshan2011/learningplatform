import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { listCohorts, isEnrolmentOpen } from "@/lib/queries";
import { CAMPUS_READY } from "@/lib/content/campus-ready";
import { formatDate, formatLKR } from "@/lib/format";
import { JsonLd } from "@/components/seo/JsonLd";
import { EmailCaptureForm } from "@/components/marketing/EmailCaptureForm";
import { CampusReadyMark } from "@/components/marketing/CampusReadyLogo";
import { ScrollEffects } from "@/components/marketing/landing/ScrollEffects";
import { FaqAccordion } from "@/components/marketing/landing/FaqAccordion";
import { CurriculumShowcase } from "@/components/marketing/landing/CurriculumShowcase";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BoltIcon,
  CertificateIcon,
  ChecklistIcon,
  ClockIcon,
  DownloadIcon,
  GraduationCapIcon,
  LayersIcon,
  MapIcon,
  MedalIcon,
  PeopleIcon,
  PresenterIcon,
  SearchIcon,
  TargetIcon,
} from "@/components/marketing/landing/icons";
import { breadcrumbJsonLd, courseJsonLd, faqJsonLd, graphJsonLd } from "@/lib/seo/json-ld";
import { COUNTRY, TEACHER_NAME } from "@/lib/seo/site";
import type { Subject } from "@/lib/types";

type LandingIcon = (props: { className?: string }) => React.JSX.Element;

/**
 * The Campus Ready landing page.
 *
 * ## Why it is built like the home page and not like /al-ict-classes
 *
 * `/al-ict-classes` is a document: one column, answers a comparison query, gets
 * read top to bottom by someone who already decided to look. This page has the
 * harder job — nobody wakes up wanting a "post-A/L data course", so it has to
 * create the want. That needs the full landing treatment: a hero that states the
 * problem, a syllabus you can play with, and dark panels that break the scroll
 * into arguments instead of paragraphs.
 *
 * ## What it is for
 *
 * Two intakes a year means this page spends most of the year with nothing to
 * sell. So its primary job is **lead capture**, not checkout: the CTA is "tell
 * me when the next intake opens" whenever enrolment is shut, and only becomes
 * "enrol" while a cohort is actually taking students. A landing page whose main
 * button is dead for ten months of the year converts nobody.
 *
 * ## The search intent it serves
 *
 * Not "data analytics course", which the state universities own and almost
 * nobody types. The volume in this window is in the question a student actually
 * asks after their last paper — "after A/L, what now" — and ICT Campus already
 * has topical authority with Google in the A/L space for that to carry.
 *
 * So the H1 leads with the moment rather than the subject. An Arts student who
 * reads "data analytics course" self-excludes; one who reads "the skills your
 * degree expects" does not.
 *
 * ## Honesty
 *
 * The laptop requirement, the absence of mentoring and the fact that the
 * certificate carries no external accreditation each appear twice — in their own
 * section and in the FAQ. Every one is cheaper to say here than to argue about
 * after a student has paid Rs 30,000.
 */

const TITLE = "After A/L: Data, Python & Research Skills for University";
const DESCRIPTION =
  "Campus Ready is a 12-week online course for Sri Lankan students waiting to enter university after their A/Ls. Learn Excel, Python, statistics, Power BI, Zotero referencing and how to use AI honestly in your assignments — in Sinhala, from Dr. Yasas Sri Wickramasinghe, PhD, former lecturer at the University of Moratuwa. One payment, certificate on completion.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/campus-ready" },
  keywords: [
    "after A/L courses",
    "after A/L what to do",
    "after A/L courses Sri Lanka",
    "courses after A/L results",
    "data analytics course Sri Lanka",
    "IT course after A/L",
    "Python course Sri Lanka Sinhala",
    "Power BI course Sri Lanka",
    "university skills course Sri Lanka",
    "research methods course Sri Lanka",
    "APA referencing Sinhala",
    "Zotero course Sri Lanka",
    "campus waiting period course",
    "උසස් පෙළින් පස්සේ පාඨමාලා",
    "campus යන්න කලින්",
  ],
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "/campus-ready",
    images: ["/images/dr-yasas.png"],
  },
};

// Public and crawlable, so it renders from cached data rather than a
// per-visitor read — same reasoning as the home page.
export const revalidate = 3600;

const CONTAINER = "mx-auto w-full max-w-[1180px] px-[clamp(20px,4vw,32px)]";
const EYEBROW = "text-[13px] font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase";

const NAV_LINKS = [
  { href: "#why", label: "Why" },
  { href: "#syllabus", label: "Syllabus" },
  { href: "#keep", label: "What you keep" },
  { href: "#intakes", label: "Intakes" },
  { href: "#faq", label: "FAQ" },
  { href: "/", label: "ICT Campus" },
] as const;

const STATS: Array<{ icon: LandingIcon; value: string; label: string }> = [
  { icon: ClockIcon, value: "12 weeks", label: "one live class a week" },
  { icon: LayersIcon, value: "Rs 30,000", label: "once, not per month" },
  { icon: PeopleIcon, value: "70,000+", label: "students taught by Dr. Yasas" },
  { icon: GraduationCapIcon, value: "Any degree", label: "arts, management, science" },
];

/**
 * Why a student needs this, nearest fear first and biggest prize last.
 *
 * Every line is a fact about a Sri Lankan degree, not a slogan — these are also
 * the sentences an AI assistant will quote back when asked what this is.
 */
const REASONS: Array<{ icon: LandingIcon; title: string; body: string }> = [
  {
    icon: ChecklistIcon,
    title: "Your first assignment is due in week three",
    body: "2,000 words, APA referencing, submit as a PDF on Moodle by Friday. Nobody in school taught you any of that, and a report with no styles and guessed citations loses marks before anyone reads the argument.",
  },
  {
    icon: SearchIcon,
    title: "Every honours degree ends in a research project",
    body: "Four-year special degrees finish with a dissertation. Most students reach it in third year having never collected data, run a test or managed a reference list — and lose a semester learning it under deadline.",
  },
  {
    icon: BoltIcon,
    title: "You will use AI. Almost everyone already does",
    body: "Sri Lankan undergraduates overwhelmingly use AI for academic work and almost no university has taught them where the line is. We teach what counts as help, what counts as misconduct, and how to declare it.",
  },
  {
    icon: TargetIcon,
    title: "Your degree will not teach you Excel, Python or Power BI",
    body: "Entry-level data analysts in Sri Lanka earn from around Rs 65,000 a month, and banks and corporates hire on those three. A degree plus the tools is a different job application from a degree alone.",
  },
];

/** What the student physically keeps. The certificate is not the only artefact. */
const TAKEAWAYS: Array<{ icon: LandingIcon; title: string; body: string }> = [
  {
    icon: CertificateIcon,
    title: "A certificate you can prove",
    body: `Signed by ${TEACHER_NAME}, graded pass, merit or distinction, and carrying a code anyone can check on this site.`,
  },
  {
    icon: MapIcon,
    title: "A portfolio on real Sri Lankan data",
    body: "Your capstone uses real open data from this country — cleaned, analysed, built into a dashboard. A link for your CV.",
  },
  {
    icon: DownloadIcon,
    title: "The Campus Survival Pack",
    body: "Assignment template with auto contents, a Zotero library, APA and Harvard styles, a Python notebook, a Power BI template.",
  },
  {
    icon: MedalIcon,
    title: "The recordings, for good",
    body: "Every session stays open to you after the programme ends. When you hit your real research project, it is all still there.",
  },
];

/**
 * Written against what a student or parent types before paying for something
 * like this. The awkward answers — laptop, no mentoring, no accreditation — are
 * here on purpose: they are the questions that cause refunds when found late.
 */
const FAQS = [
  {
    q: "What can I do after my A/Ls while waiting for university?",
    a: "Most Sri Lankan students wait roughly ten to fourteen months between sitting the A/L exam and starting a degree, and often longer. Campus Ready uses that window to teach the computer and academic skills a degree assumes you already have — Word and Excel properly, Python, statistics, Power BI, referencing with Zotero, and honest use of AI — over 12 weeks, online, in Sinhala.",
  },
  {
    q: "Who is this for?",
    a: "Anyone going on to a degree, in any faculty — management, arts, science, agriculture, health sciences, education or IT. It is built to serve the widest possible set of degrees rather than one. It is not aimed at engineering design, architecture or fine arts students, whose first-year tools are different.",
  },
  {
    q: "Do I need a laptop?",
    a: "Yes. This is the one hard requirement. Power BI runs on Windows only, and Python work is impractical on a phone. Unlike the A/L ICT classes, a phone alone is not enough for this programme — please do not enrol without access to a laptop.",
  },
  {
    q: "How much does it cost and how do I pay?",
    a: `${formatLKR(CAMPUS_READY.feeLKR)} for the whole ${CAMPUS_READY.weeks}-week programme — one payment, not a monthly fee. Pay by card through PayHere, by uploading a bank deposit slip, or in cash recorded by the teacher. All three issue the same numbered receipt.`,
  },
  {
    q: "Is there one-to-one mentoring?",
    a: "No, and that is a design decision rather than an omission. Marking is automatic where a computer can do it fairly — coding tasks, quizzes — and structured peer review where judgement is needed. That is what keeps one payment at this price instead of several times it.",
  },
  {
    q: "Is the certificate recognised or accredited?",
    a: `It is issued by ICT Campus and signed by ${TEACHER_NAME}. It is not accredited by any university or awarding body, and we will not pretend otherwise. What makes it worth having is that it is earned by assessment rather than attendance, it is verifiable by anyone with the code, and it comes with a portfolio project you can show.`,
  },
  {
    q: "What language is it taught in?",
    a: "Sinhala, with technical terms kept in English — Python, Power BI, Zotero, dataset — because that is what the tools, the textbooks and employers use. Slides and materials are in English so you build the vocabulary your degree will examine you in.",
  },
  {
    q: "Who teaches it?",
    a: `${TEACHER_NAME} — PhD in Human Interface Technology from the University of Canterbury, New Zealand, a senior lecturer, a former lecturer at the University of Moratuwa, and a former industry researcher and tech lead at Sony, 99X and Niantic. He has taught over 70,000 students online.`,
  },
  {
    q: "When does the next intake start?",
    a: "There are two intakes a year, in January and July, and everyone in a cohort starts and finishes together. Enrolment closes on the start date, because the whole design is a shared pace. Join the notify list on this page and you will hear the day the next one opens.",
  },
] as const;

export default async function CampusReadyPage() {
  // Never let a Firestore hiccup take down a public marketing page — same
  // posture as the home page.
  const cohorts = await listCohorts().catch(() => [] as Subject[]);

  // Server Component: this renders once per request (or once per revalidation
  // window), so reading the clock here is deterministic for that render. The
  // purity rule targets client renders.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const open = cohorts.filter((c) => isEnrolmentOpen(c, now));
  const nextOpen = open[open.length - 1];
  const enrolling = nextOpen?.cohort;
  const feeLKR = enrolling?.feeLKR ?? CAMPUS_READY.feeLKR;

  const schema = graphJsonLd([
    courseJsonLd({
      name: `Campus Ready — ${CAMPUS_READY.certificateTitle}`,
      description: DESCRIPTION,
      path: "/campus-ready",
      priceLKR: feeLKR,
      priceCategory: "Fee",
      educationalLevel: "Post-secondary",
      teaches:
        "Data analysis, spreadsheets, Python, statistics, Power BI, academic referencing and research skills",
      audienceType: `${COUNTRY} students preparing to enter university`,
      workload: `P${CAMPUS_READY.weeks}W`,
    }),
  ]);

  return (
    <div>
      <JsonLd data={schema} />
      <JsonLd data={faqJsonLd(FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Campus Ready", path: "/campus-ready" },
        ])}
      />

      <ScrollEffects>
        <div data-lp-progress className="fixed top-0 left-0 z-[60] h-[3px] w-0 bg-(--lp-orange-500)" />

        {/* Floating pill nav. Campus Ready is a sub-brand, so the last link
            goes back to ICT Campus rather than pretending to be a separate
            company. */}
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div
            data-lp-nav
            className="lp-nav pointer-events-auto flex max-w-full items-center gap-[clamp(8px,1.6vw,18px)] rounded-full bg-(--lp-ink-900) py-2 pr-2 pl-4"
          >
            <a href="#top" className="flex items-center gap-2 whitespace-nowrap text-white">
              <CampusReadyMark size={22} />
              <span className="font-[family-name:var(--lp-font-display)] text-lg font-extrabold tracking-[-0.02em]">
                Campus<span className="text-(--lp-orange-500)">Ready</span>
              </span>
            </a>
            <nav className="hidden items-center gap-0.5 sm:flex">
              {NAV_LINKS.map((link) => {
                const className =
                  "rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap text-white hover:bg-(--lp-ink-700) hover:text-(--lp-orange-300)";
                return link.href.startsWith("#") ? (
                  <a key={link.href} href={link.href} className={className}>
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.href} href={link.href} className={className}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <a
              href="#intakes"
              className="flex items-center gap-2 rounded-full bg-(--lp-orange-500) py-2 pr-2 pl-4 text-xs font-semibold whitespace-nowrap text-white shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600) hover:text-white"
            >
              {enrolling ? "Enrol" : "Get notified"}
              <span className="grid size-6 place-items-center overflow-hidden rounded-full bg-white text-(--lp-orange-500)">
                <ArrowRightIcon className="size-3.5" />
              </span>
            </a>
          </div>
        </div>

        {/* Hero */}
        <section
          id="top"
          className="relative flex min-h-[100svh] items-center overflow-hidden py-[clamp(120px,14vh,180px)] pb-[clamp(48px,7vh,96px)]"
        >
          <div
            data-lp-par="0.05"
            aria-hidden
            className="pointer-events-none absolute -top-[8%] -right-[6%] size-[min(60vw,760px)] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(244,85,30,0.20), rgba(244,85,30,0) 68%)",
            }}
          />

          <div
            className={`${CONTAINER} relative grid items-center gap-[clamp(32px,5vw,56px)]`}
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(430px,100%), 1fr))" }}
          >
            <div className="lp-reveal">
              <p className="mb-2 text-xs font-semibold text-(--lp-ink-400)">
                After A/L · Before campus · Sinhala · Sri Lanka
              </p>

              {/* The H1 leads with the moment a student is in, not the subject.
                  "After A/L" is the query; the rest is the promise. */}
              <h1 className="m-0 text-[clamp(38px,6.2vw,66px)] leading-[1.02] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) text-wrap-balance font-[family-name:var(--lp-font-display)]">
                You have a year.
                <br />
                Campus starts <span className="text-(--lp-orange-500)">ready</span>
                <span className="text-(--lp-orange-500)">.</span>
              </h1>

              <p className="my-[clamp(18px,2.4vw,26px)] max-w-[520px] text-[clamp(15px,1.4vw,18px)] text-(--lp-ink-500) text-wrap-pretty">
                Between your last A/L paper and your first lecture you will wait about{" "}
                <strong className="font-semibold text-(--lp-ink-900)">
                  ten to fourteen months
                </strong>
                . Campus Ready turns that into Word, Excel, Python, statistics, Power BI,
                referencing and honest AI use — the things every degree assumes you can already do.
              </p>

              <p className="mb-[clamp(18px,2.4vw,26px)] max-w-[520px] text-[clamp(14px,1.3vw,16px)] text-(--lp-ink-500) text-wrap-pretty">
                {CAMPUS_READY.weeks} weeks, fully online, taught in Sinhala by{" "}
                <Link
                  href="/dr-yasas"
                  className="font-bold text-(--lp-ink-900) underline decoration-(--lp-orange-500) underline-offset-2"
                >
                  {TEACHER_NAME}
                </Link>{" "}
                — former lecturer at the University of Moratuwa. One payment of{" "}
                {formatLKR(feeLKR)}.
              </p>

              <div className="flex flex-wrap items-center gap-[clamp(12px,1.6vw,18px)]">
                {enrolling && nextOpen ? (
                  <Link
                    href={`/campus/${nextOpen.id}`}
                    className="flex h-12 items-center gap-3 rounded-full bg-(--lp-orange-500) py-2 pr-2 pl-6 text-base font-semibold text-white shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600) hover:text-white"
                  >
                    Enrol — {formatLKR(enrolling.feeLKR)}
                    <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-white text-(--lp-orange-500)">
                      <ArrowRightIcon className="size-4" />
                    </span>
                  </Link>
                ) : (
                  <a
                    href="#intakes"
                    className="flex h-12 items-center gap-3 rounded-full bg-(--lp-orange-500) py-2 pr-2 pl-6 text-base font-semibold text-white shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600) hover:text-white"
                  >
                    Tell me when it opens
                    <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-white text-(--lp-orange-500)">
                      <ArrowRightIcon className="size-4" />
                    </span>
                  </a>
                )}
                <a
                  href="#syllabus"
                  className="flex h-12 items-center gap-3 px-1 text-base font-semibold text-(--lp-ink-900) hover:text-(--lp-orange-600)"
                >
                  See all 12 weeks
                  <span className="grid size-8 place-items-center overflow-hidden rounded-full border-[1.5px] border-(--lp-ink-900) text-(--lp-ink-900)">
                    <ArrowUpRightIcon className="size-3.5" />
                  </span>
                </a>
              </div>

              <div className="mt-[clamp(28px,3.6vw,40px)] flex flex-wrap gap-2.5">
                {["Python", "Power BI", "Excel", "Statistics", "Zotero", "AI, honestly"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-(--lp-border-subtle) bg-(--lp-paper-0) px-3.5 py-1.5 text-xs text-(--lp-ink-500)"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {enrolling ? (
                <p className="mt-5 flex items-center gap-2 text-sm text-(--lp-ink-500)">
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--lp-orange-500) opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-(--lp-orange-500)" />
                  </span>
                  Enrolment open · starts{" "}
                  <span className="font-semibold text-(--lp-ink-900)">
                    {formatDate(enrolling.startsAt)}
                  </span>
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
                alt={TEACHER_NAME}
                width={881}
                height={1241}
                priority
                className="relative block h-auto w-[min(88%,440px)] drop-shadow-[0_24px_48px_rgba(14,12,11,0.22)]"
              />

              <div
                data-lp-par="-0.14"
                className="absolute top-[8%] left-0 flex items-center gap-2.5 rounded-full bg-(--lp-paper-0) py-[9px] pr-4 pl-[10px] shadow-[var(--lp-shadow-md)]"
              >
                <span className="grid size-[30px] place-items-center overflow-hidden rounded-full bg-(--lp-orange-50) text-(--lp-orange-500)">
                  <PresenterIcon className="size-[18px]" />
                </span>
                <span className="text-xs font-semibold whitespace-nowrap text-(--lp-ink-900)">
                  Ex-lecturer, Univ. of Moratuwa
                </span>
              </div>

              <div
                data-lp-par="-0.20"
                className="absolute right-0 bottom-[14%] rounded-2xl bg-(--lp-ink-900) px-[18px] py-3.5 shadow-[var(--lp-shadow-lg)]"
              >
                <div className="font-[family-name:var(--lp-font-display)] text-lg leading-tight font-extrabold tracking-[-0.02em] whitespace-nowrap text-(--lp-paper-50)">
                  {CAMPUS_READY.weeks} weeks{" "}
                  <span className="text-(--lp-orange-500)">·</span> {formatLKR(feeLKR)}
                </div>
                <div className="mt-1 text-[11px] text-(--lp-ink-300)">
                  one payment · certificate · portfolio
                </div>
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
                  <span className="grid size-[42px] place-items-center overflow-hidden rounded-full bg-(--lp-orange-50) text-(--lp-orange-500)">
                    <stat.icon className="size-5" />
                  </span>
                  <div className="font-[family-name:var(--lp-font-display)] text-[clamp(22px,2.4vw,30px)] leading-none font-extrabold tracking-[-0.02em] text-(--lp-ink-900)">
                    {stat.value}
                  </div>
                  <div className="text-xs text-(--lp-ink-400)">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The argument. Cream cards on cream, so the dark panels either side
            carry the weight and this section reads as reasoning, not a pitch. */}
        <section id="why" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className="lp-reveal">
              <div className={EYEBROW}>Why this, and why now</div>
              <div className="my-2.5 mb-[clamp(24px,3vw,34px)] flex flex-wrap items-start gap-[clamp(20px,4vw,40px)]">
                <h2 className="m-0 max-w-[16ch] text-[clamp(30px,4.6vw,48px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]">
                  Four things nobody warns you about
                  <span className="text-(--lp-orange-500)">.</span>
                </h2>
                <p className="mt-1.5 ml-auto max-w-[320px] text-sm text-(--lp-ink-500) text-wrap-pretty">
                  None of these are secrets. They are just things every student finds out at the
                  worst possible moment — halfway through a semester.
                </p>
              </div>
            </div>

            <div
              className="lp-reveal grid gap-[clamp(14px,2vw,20px)]"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(280px,100%), 1fr))" }}
            >
              {REASONS.map((r) => (
                <div
                  key={r.title}
                  className="flex flex-col rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-[clamp(20px,2.6vw,26px)] shadow-[var(--lp-shadow-sm)]"
                >
                  <span className="grid size-[42px] place-items-center overflow-hidden rounded-full bg-(--lp-orange-50) text-(--lp-orange-500)">
                    <r.icon className="size-5" />
                  </span>
                  <h3 className="mt-[18px] mb-2 text-lg leading-tight font-bold text-(--lp-ink-900)">
                    {r.title}
                  </h3>
                  <p className="m-0 text-sm text-(--lp-ink-500) text-wrap-pretty">{r.body}</p>
                </div>
              ))}
            </div>

            <p className="lp-reveal mt-5 rounded-[var(--lp-radius-card)] border border-(--lp-orange-200) bg-(--lp-orange-50) p-[clamp(20px,2.6vw,26px)] text-sm text-(--lp-ink-500)">
              <strong className="text-(--lp-ink-900)">
                There is a whole industry in this country that will write your assignment for you.
              </strong>{" "}
              It exists because nobody teaches this, and it charges you every semester for four
              years. Learning to do it once yourself is cheaper — and it is the part of a degree
              that actually transfers to a job.
            </p>
          </div>
        </section>

        {/* The interactive syllabus — the page's main selling argument. */}
        <CurriculumShowcase />

        {/* What you keep */}
        <section id="keep" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className="lp-reveal relative overflow-hidden rounded-[var(--lp-radius-panel)] bg-(--lp-ink-900) p-[clamp(26px,4vw,44px)]">
              <div
                data-lp-par="0.06"
                aria-hidden
                className="pointer-events-none absolute -top-[30%] -left-[10%] size-[520px] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(244,85,30,0.18), rgba(244,85,30,0) 70%)",
                }}
              />
              <div className="relative">
                <div className={EYEBROW}>What you keep</div>
                <div className="my-2.5 mb-[clamp(24px,3vw,34px)] flex flex-wrap items-start gap-[clamp(20px,4vw,40px)]">
                  <h2 className="m-0 text-[clamp(30px,4.4vw,46px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-paper-50) font-[family-name:var(--lp-font-display)]">
                    You finish with
                    <br />
                    four things<span className="text-(--lp-orange-500)">.</span>
                  </h2>
                  <p className="mt-1.5 ml-auto max-w-[320px] text-sm text-(--lp-ink-300) text-wrap-pretty">
                    A certificate on its own is a PDF. These are the things that still matter in
                    third year, and at an interview.
                  </p>
                </div>
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px,100%), 1fr))" }}
                >
                  {TAKEAWAYS.map((item) => (
                    <div
                      key={item.title}
                      className="flex min-h-[210px] flex-col rounded-[var(--lp-radius-md)] border border-(--lp-border-dark) bg-(--lp-ink-800) p-5 shadow-[var(--lp-shadow-inset-dark)] transition-colors hover:bg-(--lp-ink-700)"
                    >
                      <span className="grid size-[42px] place-items-center overflow-hidden rounded-full bg-(--lp-orange-500) text-(--lp-paper-0)">
                        <item.icon className="size-5" />
                      </span>
                      <div className="mt-[18px] mb-[7px] text-lg font-bold text-(--lp-paper-50)">
                        {item.title}
                      </div>
                      <p className="m-0 text-xs text-(--lp-ink-300)">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sinhala. The audience is a Sinhala-medium student who very often
            searches in Sinhala script; without real Sinhala prose on the page
            those queries cannot match at all. A genuine summary, not a keyword
            block — `lang` is set so a crawler and a screen reader both handle
            the script correctly. */}
        <section className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div
              lang="si"
              className="si lp-reveal rounded-[var(--lp-radius-panel)] border border-(--lp-orange-200) bg-(--lp-orange-50) p-[clamp(24px,4vw,40px)]"
            >
              <h2 className="m-0 text-[clamp(24px,3.4vw,34px)] leading-[1.15] font-extrabold tracking-[-0.02em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]">
                උසස් පෙළින් පස්සේ, campus එකට කලින්
              </h2>
              <div
                className="mt-5 grid gap-x-8 gap-y-2.5"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(300px,100%), 1fr))" }}
              >
                {[
                  "A/L ඉවර වෙලා campus එකට යන්න අවුරුද්දක් විතර ඉන්න වෙනවා. ඒ කාලෙට හදපු course එකක්.",
                  `සති ${CAMPUS_READY.weeks}ක්. සම්පූර්ණයෙන්ම online. සිංහලෙන් උගන්වනවා.`,
                  "Word, Excel, Python, statistics, Power BI, Zotero සහ referencing.",
                  "Assignment වලට AI පාවිච්චි කරන්නේ කොහොමද — වැරදි නොවී, හරි විදිහට.",
                  "ඕනෑම degree එකකට — management, arts, science, agriculture, health sciences.",
                  `ගාස්තුව ${formatLKR(feeLKR)}ක් — එක ගෙවීමක් විතරයි.`,
                  "ඉවර වුණාම certificate එකක් සහ ඔබේම portfolio project එකක්.",
                  "Laptop එකක් ඕනේ. Power BI phone එකේ වැඩ කරන්නේ නෑ.",
                ].map((line) => (
                  <p key={line} className="flex gap-2.5 text-sm text-(--lp-ink-500)">
                    <span className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-(--lp-orange-500)" />
                    <span>{line}</span>
                  </p>
                ))}
              </div>
              <p className="mt-5 text-sm text-(--lp-ink-500)">
                උගන්වන්නේ ආචාර්ය යසස් ශ්‍රී වික්‍රමසිංහ — Canterbury විශ්වවිද්‍යාලයෙන් ආචාර්ය උපාධිය,
                මොරටුව විශ්වවිද්‍යාලයේ හිටපු කථිකාචාර්ය.
              </p>
            </div>
          </div>
        </section>

        {/* Intakes — real data, plus the lead capture that is this page's main
            job for most of the year. */}
        <section id="intakes" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className="lp-reveal">
              <div className={EYEBROW}>Intakes and fee</div>
              <h2 className="lp-reveal mt-2.5 mb-[clamp(24px,3vw,34px)] max-w-[18ch] text-[clamp(30px,4.6vw,48px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]">
                Two intakes a year. Everyone starts together
                <span className="text-(--lp-orange-500)">.</span>
              </h2>
            </div>

            {cohorts.length === 0 ? (
              <div className="lp-reveal rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-[clamp(22px,3vw,32px)] shadow-[var(--lp-shadow-sm)]">
                <p className="text-base font-semibold text-(--lp-ink-900)">
                  Dates for the next intake are being confirmed
                </p>
                <p className="mt-1.5 max-w-[52ch] text-sm text-(--lp-ink-500)">
                  January and July, every year. The notify list hears first, and intakes fill from
                  it — leave your email and nothing else is ever sent to it.
                </p>
                <EmailCaptureForm
                  source="campus_ready_intakes"
                  buttonLabel="Tell me when it opens"
                  className="mt-5 max-w-md"
                />
              </div>
            ) : (
              <div
                className="lp-reveal grid gap-[clamp(14px,2vw,20px)]"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(300px,100%), 1fr))" }}
              >
                {cohorts.map((c) => {
                  // `listCohorts` only returns subjects that have one, but the
                  // optional field does not narrow on its own.
                  const term = c.cohort;
                  if (!term) return null;
                  const stillOpen = isEnrolmentOpen(c, now);
                  return (
                    <div
                      key={c.id}
                      className="flex flex-col rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-[clamp(20px,2.6vw,26px)] shadow-[var(--lp-shadow-sm)]"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-lg font-bold text-(--lp-ink-900)">{c.name}</h3>
                        <span className="font-[family-name:var(--lp-font-display)] text-xl font-extrabold text-(--lp-ink-900)">
                          {formatLKR(term.feeLKR)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-(--lp-ink-500)">
                        {formatDate(term.startsAt)} to {formatDate(term.endsAt)}
                      </p>
                      <p className="mt-1 text-xs text-(--lp-ink-400)">
                        {stillOpen
                          ? `Enrolment closes ${formatDate(term.enrolmentClosesAt)}`
                          : "Enrolment closed"}
                      </p>
                      {stillOpen ? (
                        <Link
                          href={`/campus/${c.id}`}
                          className="mt-5 flex h-11 w-fit items-center gap-3 rounded-full bg-(--lp-orange-500) py-2 pr-2 pl-5 text-sm font-semibold text-white shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600) hover:text-white"
                        >
                          Enrol now
                          <span className="grid size-7 place-items-center overflow-hidden rounded-full bg-white text-(--lp-orange-500)">
                            <ArrowRightIcon className="size-3.5" />
                          </span>
                        </Link>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Said before payment, not after. Each of these is a refund we would
            otherwise have to argue about. */}
        <section className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className="lp-reveal">
              <div className={EYEBROW}>Before you enrol</div>
              <h2 className="mt-2.5 mb-[clamp(20px,3vw,30px)] max-w-[20ch] text-[clamp(26px,3.8vw,38px)] leading-[1.08] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]">
                Three straight answers
              </h2>
            </div>
            <div
              className="lp-reveal grid gap-[clamp(14px,2vw,20px)]"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(280px,100%), 1fr))" }}
            >
              {[
                {
                  t: "You need a laptop",
                  b: "Power BI is Windows-only and Python is impractical on a phone. This is the one requirement we cannot work around, and it is the commonest reason someone should not enrol.",
                },
                {
                  t: "There is no personal mentor",
                  b: "Work is marked automatically where that is fair, and by structured peer review where judgement is needed. It is exactly why one payment covers the whole programme.",
                },
                {
                  t: "The certificate is not accredited",
                  b: "It is issued by ICT Campus, earned by assessment rather than attendance, and verifiable by anyone with the code. We will not describe it as anything more than that.",
                },
              ].map((item) => (
                <div
                  key={item.t}
                  className="rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-[clamp(20px,2.6vw,26px)]"
                >
                  <h3 className="text-base font-bold text-(--lp-ink-900)">{item.t}</h3>
                  <p className="mt-2 text-sm text-(--lp-ink-500)">{item.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="w-full py-[clamp(32px,6vw,72px)]">
          <div className={CONTAINER}>
            <div className="lp-reveal">
              <div className={EYEBROW}>Questions</div>
              <h2 className="mt-2.5 mb-[clamp(20px,3vw,30px)] max-w-[16ch] text-[clamp(26px,3.8vw,38px)] leading-[1.08] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]">
                The things people ask before paying
              </h2>
            </div>
            <div className="lp-reveal">
              <FaqAccordion items={FAQS} />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full pt-[clamp(20px,4vw,40px)] pb-[clamp(48px,8vw,96px)]">
          <div className={CONTAINER}>
            <div className="lp-reveal relative overflow-hidden rounded-[var(--lp-radius-panel)] bg-(--lp-orange-500) p-[clamp(26px,4vw,48px)]">
              <div className="relative grid items-center gap-[clamp(20px,4vw,40px)] sm:grid-cols-[1fr_auto]">
                <div>
                  <CampusReadyMark size={36} className="text-white" />
                  <h2 className="mt-4 m-0 max-w-[16ch] text-[clamp(26px,4vw,42px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-white font-[family-name:var(--lp-font-display)]">
                    {CAMPUS_READY.tagline}
                  </h2>
                  <p className="mt-3 max-w-[44ch] text-sm text-white/85">
                    Two intakes a year, and they fill from this list first. Leave your email —
                    nothing else is ever sent to it.
                  </p>
                </div>
                <div className="w-full sm:w-[340px]">
                  <div className="rounded-[var(--lp-radius-card)] bg-(--lp-paper-0) p-5">
                    <EmailCaptureForm source="campus_ready_footer" buttonLabel="Notify me" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer. Campus Ready is a sub-brand, so this points back into ICT
            Campus rather than standing alone. */}
        <footer className="w-full bg-(--lp-ink-900) pt-[clamp(40px,6vw,72px)] pb-7">
          <div
            className={`${CONTAINER} grid gap-[clamp(24px,4vw,48px)]`}
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(200px,100%), 1fr))" }}
          >
            <div>
              <span className="flex items-center gap-2 text-(--lp-paper-50)">
                <CampusReadyMark size={26} />
                <span className="font-[family-name:var(--lp-font-display)] text-[20px] leading-none font-extrabold tracking-[-0.02em]">
                  Campus<span className="text-(--lp-orange-500)">Ready</span>
                </span>
              </span>
              <p className="mt-3.5 max-w-[240px] text-xs text-(--lp-ink-300)">
                A {CAMPUS_READY.weeks}-week course in data, Python and research skills for the wait
                between A/Ls and university. From ICT Campus.
              </p>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">
                This course
              </div>
              <div className="flex flex-col gap-2.5">
                <a href="#syllabus" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">
                  All 12 weeks
                </a>
                <a href="#keep" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">
                  What you keep
                </a>
                <a href="#intakes" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">
                  Intakes and fee
                </a>
                <a href="#faq" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">
                  Questions
                </a>
              </div>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">
                ICT Campus
              </div>
              <div className="flex flex-col gap-2.5">
                <Link href="/" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">
                  A/L ICT classes
                </Link>
                <Link href="/notes" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">
                  Free A/L ICT notes
                </Link>
                <Link
                  href="/past-papers"
                  className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)"
                >
                  A/L ICT past papers
                </Link>
                <Link
                  href="/university-pathways"
                  className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)"
                >
                  University pathways
                </Link>
              </div>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">
                Teacher
              </div>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/dr-yasas"
                  className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)"
                >
                  {TEACHER_NAME} — full profile
                </Link>
                <span className="text-xs text-(--lp-ink-300)">PhD — Univ. of Canterbury</span>
                <span className="text-xs text-(--lp-ink-300)">Ex-Lecturer — Univ. of Moratuwa</span>
              </div>
            </div>
            <div>
              <div className="mb-3.5 text-xs font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase">
                Legal
              </div>
              <div className="flex flex-col gap-2.5">
                <Link href="/terms" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">
                  Terms of service
                </Link>
                <Link href="/privacy" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">
                  Privacy policy
                </Link>
                <Link
                  href="/refund-policy"
                  className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)"
                >
                  Refunds &amp; cancellation
                </Link>
                <Link href="/contact" className="text-xs text-(--lp-ink-300) hover:text-(--lp-paper-50)">
                  Contact us
                </Link>
              </div>
            </div>
          </div>
          <div
            className={`${CONTAINER} mt-[clamp(32px,4vw,48px)] flex flex-wrap justify-between gap-3 border-t border-(--lp-border-dark) pt-5`}
          >
            <span className="text-[11px] text-(--lp-ink-400)">
              © 2026 ICT Campus. All rights reserved.
            </span>
            <span className="text-[11px] text-(--lp-ink-400)">
              Certificate issued by ICT Campus — not accredited by any university.
            </span>
          </div>
        </footer>
      </ScrollEffects>
    </div>
  );
}
