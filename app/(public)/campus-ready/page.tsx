import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { listCohorts, isEnrolmentOpen } from "@/lib/queries";
import { CAMPUS_READY, CAMPUS_READY_WEEKS } from "@/lib/content/campus-ready";
import { formatDate, formatLKR } from "@/lib/format";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon, type IconName } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { EmailCaptureForm } from "@/components/marketing/EmailCaptureForm";
import { CampusReadyLogo, CampusReadyMark } from "@/components/marketing/CampusReadyLogo";
import {
  Badge,
  ButtonLink,
  Card,
  Eyebrow,
  IconBadge,
  SectionHeading,
  StatCard,
} from "@/components/ds-cream";
import { breadcrumbJsonLd, courseJsonLd, faqJsonLd, graphJsonLd } from "@/lib/seo/json-ld";
import { COUNTRY, TEACHER_CREDENTIALS, TEACHER_NAME } from "@/lib/seo/site";
import type { Subject } from "@/lib/types";

/**
 * The Campus Ready landing page.
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
 * So the H1 leads with the moment rather than the subject, and the product is
 * framed as the thing every degree assumes you can already do. An Arts student
 * who reads "data analytics course" self-excludes; one who reads "the skills
 * your degree expects" does not.
 *
 * ## Honesty
 *
 * The laptop requirement, the absence of mentoring and the fact that the
 * certificate carries no external accreditation are all stated on the page, not
 * buried. Every one of them is cheaper to say here than to argue about after a
 * student has paid Rs 30,000.
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
// per-visitor read — same reasoning as /al-ict-classes and /notes.
export const revalidate = 3600;

/**
 * Why a student needs this, nearest fear first and biggest prize last.
 *
 * Every line is a fact about a Sri Lankan degree, not a slogan — these are also
 * the sentences an AI assistant will quote back when asked what this is.
 */
const REASONS: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: "assignment",
    title: "Your first assignment is due in week three",
    body: "Your lecturer will say 2,000 words, APA referencing, submit as a PDF on Moodle by Friday. Nobody in school ever taught you how to do any of that — and a report with no styles, no table of contents and guessed citations loses marks before anyone reads the argument.",
  },
  {
    icon: "insights",
    title: "Every honours degree ends in a research project",
    body: "Four-year special degrees finish with a dissertation. Most students reach it in third year having never collected data, run a test or managed a reference list, and lose a semester learning it under deadline. You have the time now that you will not have then.",
  },
  {
    icon: "auto_awesome",
    title: "You will use AI. Almost everyone already does",
    body: "Sri Lankan undergraduates overwhelmingly use AI tools for academic work, and almost no university has taught them where the line is. We teach what counts as help, what counts as misconduct, how to check what a model tells you, and how to declare that you used one.",
  },
  {
    icon: "work",
    title: "Your degree will not teach you Excel, Python or Power BI",
    body: "Entry-level data analysts in Sri Lanka earn from around Rs 65,000 a month, and banks and corporates hire on those three. A degree plus the tools is a different job application from a degree alone.",
  },
];

/** What the student physically keeps. The certificate is not the only artefact. */
const TAKEAWAYS: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: "military_tech",
    title: "A certificate you can prove",
    body: `Signed by ${TEACHER_NAME}, graded pass, merit or distinction, and carrying a code anyone can check on this site. Not a PDF that could have been typed by anybody.`,
  },
  {
    icon: "grid_view",
    title: "A portfolio project on real Sri Lankan data",
    body: "Your capstone uses real open data from this country — district results, census, weather — cleaned, analysed and built into a dashboard. A link you can put on a CV, not a certificate number.",
  },
  {
    icon: "save",
    title: "The Campus Survival Pack",
    body: "An assignment template with styles and an automatic table of contents, a Zotero library, APA and Harvard style files, a Python starter notebook, a Power BI template, and an AI-use declaration you can hand in.",
  },
  {
    icon: "play_circle",
    title: "The recordings, for good",
    body: "Every session stays open to you after the programme ends, including later updates. When you hit your real research project in third year, it is all still there.",
  },
];

/**
 * Written against what a student or parent types before paying for something
 * like this. The awkward answers — laptop, no mentoring, no accreditation — are
 * here on purpose: they are the questions that cause refunds when discovered late.
 */
const FAQS = [
  {
    q: "What can I do after my A/Ls while waiting for university?",
    a: `Most Sri Lankan students wait roughly ten to fourteen months between sitting the A/L exam and starting a degree, and often longer. Campus Ready uses that window to teach the computer and academic skills a degree assumes you already have — Word and Excel properly, Python, statistics, Power BI, referencing with Zotero, and honest use of AI — over 12 weeks, online, in Sinhala.`,
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
  // posture as /al-ict-classes.
  const cohorts = await listCohorts().catch(() => [] as Subject[]);

  // Server Component: this renders once per request (or once per revalidation
  // window), so reading the clock here is deterministic for that render. The
  // purity rule targets client renders.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const open = cohorts.filter((c) => isEnrolmentOpen(c, now));
  const nextOpen = open[open.length - 1];
  const enrolling = nextOpen?.cohort;

  const schema = graphJsonLd([
    courseJsonLd({
      name: `Campus Ready — ${CAMPUS_READY.certificateTitle}`,
      description: DESCRIPTION,
      path: "/campus-ready",
      priceLKR: enrolling?.feeLKR ?? CAMPUS_READY.feeLKR,
      priceCategory: "Fee",
      educationalLevel: "Post-secondary",
      teaches:
        "Data analysis, spreadsheets, Python, statistics, Power BI, academic referencing and research skills",
      audienceType: `${COUNTRY} students preparing to enter university`,
      workload: `P${CAMPUS_READY.weeks}W`,
    }),
  ]);

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd data={faqJsonLd(FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Campus Ready", path: "/campus-ready" },
        ])}
      />
      <SiteHeader user={null} />

      <main className="mx-auto max-w-3xl px-5 py-12">
        <CampusReadyLogo size={36} wordmarkClassName="text-2xl text-ict-ink-900" />

        {/* The H1 leads with the moment a student is in, not the subject.
            "After A/L" is the query; the rest is the promise. */}
        <h1 className="mt-6 font-display text-3xl font-extrabold tracking-[-0.02em] text-ict-ink-900 sm:text-4xl">
          After A/L, before campus — the skills your degree assumes you already have
        </h1>

        <p className="mt-4 text-lg text-ict-ink-400">
          You will wait about a year to start your degree. Campus Ready is a{" "}
          {CAMPUS_READY.weeks}-week online course that turns that year into Word, Excel, Python,
          statistics, Power BI, referencing and honest AI use — taught in Sinhala by{" "}
          <Link
            href="/dr-yasas"
            className="font-semibold text-ict-ink-900 underline decoration-ict-orange-500 underline-offset-2"
          >
            {TEACHER_NAME}
          </Link>
          , former lecturer at the University of Moratuwa.
        </p>

        {/* The conversion moment. Enrolment is open for a few weeks a year; the
            rest of the time the honest, useful ask is an email address. */}
        <div className="mt-7">
          {enrolling && nextOpen ? (
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href={`/campus/${nextOpen.id}`} variant="primary">
                Enrol — {formatLKR(enrolling.feeLKR)}
              </ButtonLink>
              <span className="text-sm text-ict-ink-400">
                Starts {formatDate(enrolling.startsAt)} · enrolment closes{" "}
                {formatDate(enrolling.enrolmentClosesAt)}
              </span>
            </div>
          ) : (
            <Card radius="card" className="p-5">
              <p className="font-display text-lg font-bold text-ict-ink-900">
                The next intake opens soon
              </p>
              <p className="mt-1.5 text-sm text-ict-ink-400">
                Two intakes a year, January and July. Leave your email and you will hear the day
                enrolment opens — before it is announced anywhere else.
              </p>
              <EmailCaptureForm
                source="campus_ready_hero"
                buttonLabel="Notify me"
                className="mt-4"
              />
            </Card>
          )}
        </div>

        {/* At-a-glance. A student comparing this against a diploma reads exactly
            this block and nothing else, so it sits above every argument. */}
        <div className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {(
            [
              { icon: "schedule", label: "Length", value: `${CAMPUS_READY.weeks} weeks` },
              {
                icon: "credit_card",
                label: "Fee",
                value: `${formatLKR(enrolling?.feeLKR ?? CAMPUS_READY.feeLKR)} once`,
              },
              { icon: "language", label: "Taught in", value: "Sinhala" },
              { icon: "live_tv", label: "Format", value: "Live online, weekly" },
              { icon: "military_tech", label: "Ends with", value: "Certificate + portfolio" },
              { icon: "computer", label: "You need", value: "A laptop" },
            ] satisfies Array<{ icon: IconName; label: string; value: string }>
          ).map((row) => (
            <StatCard key={row.label} icon={row.icon} label={row.label} value={row.value} />
          ))}
        </div>

        {/* The argument. This is the part that decides whether someone who came
            for "what do I do after A/L" believes they need this specifically. */}
        <section className="mt-14">
          <Eyebrow>Why this, and why now</Eyebrow>
          <SectionHeading as="h2" className="mt-2">
            Four things nobody warns you about before campus
          </SectionHeading>
          <div className="mt-5 space-y-3">
            {REASONS.map((r) => (
              <Card key={r.title} radius="card" className="flex gap-4 p-5">
                <IconBadge icon={r.icon} tone="soft" size={40} round />
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold text-ict-ink-900">{r.title}</h3>
                  <p className="mt-1.5 text-sm text-ict-ink-400">{r.body}</p>
                </div>
              </Card>
            ))}
          </div>

          <p className="mt-5 rounded-ict-card border border-ict-orange-200 bg-ict-orange-50 p-5 text-sm text-ict-ink-500">
            <strong className="text-ict-ink-900">
              There is a whole industry in this country that will write your assignment for you.
            </strong>{" "}
            It exists because nobody teaches this, and it charges you every semester for four years.
            Learning to do it yourself once is cheaper, and it is the part of a degree that actually
            transfers to a job.
          </p>
        </section>

        {/* Sinhala. The audience is a Sinhala-medium student who very often
            searches in Sinhala script; without real Sinhala prose on the page
            those queries cannot match at all. A genuine summary, not a keyword
            block — `lang` is set so a crawler and a screen reader both handle
            the script correctly. */}
        <section
          lang="si"
          className="si mt-14 rounded-ict-card border border-ict-orange-200 bg-ict-orange-50 p-6"
        >
          <h2 className="font-display text-xl font-extrabold text-ict-ink-900">
            උසස් පෙළින් පස්සේ, campus එකට කලින් — Campus Ready
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-ict-ink-500">
            <li>· A/L ඉවර වෙලා campus එකට යන්න අවුරුද්දක් විතර ඉන්න වෙනවා. ඒ කාලෙට හදපු course එකක්.</li>
            <li>· සති {CAMPUS_READY.weeks}ක්. සම්පූර්ණයෙන්ම online. සිංහලෙන් උගන්වනවා.</li>
            <li>· Word, Excel, Python, statistics, Power BI, Zotero සහ referencing.</li>
            <li>· Assignment වලට AI පාවිච්චි කරන්නේ කොහොමද — වැරදි නොවී, හරි විදිහට.</li>
            <li>· ඕනෑම degree එකකට — management, arts, science, agriculture, health sciences.</li>
            <li>· ගාස්තුව {formatLKR(enrolling?.feeLKR ?? CAMPUS_READY.feeLKR)}ක් — එක ගෙවීමක් විතරයි.</li>
            <li>· ඉවර වුණාම certificate එකක් සහ ඔබේම portfolio project එකක්.</li>
            <li>· <strong>Laptop එකක් ඕනේ.</strong> Power BI phone එකේ වැඩ කරන්නේ නෑ.</li>
            <li>
              · උගන්වන්නේ ආචාර්ය යසස් ශ්‍රී වික්‍රමසිංහ — Canterbury විශ්වවිද්‍යාලයෙන් ආචාර්ය උපාධිය,
              මොරටුව විශ්වවිද්‍යාලයේ හිටපු කථිකාචාර්ය.
            </li>
          </ul>
        </section>

        {/* The syllabus, split the way the product is sold: survive first year,
            then the part that gets you hired. */}
        <section className="mt-14">
          <Eyebrow>The programme</Eyebrow>
          <SectionHeading as="h2" className="mt-2">
            {CAMPUS_READY.weeks} weeks, week by week
          </SectionHeading>

          <h3 className="mt-6 flex items-center gap-2 text-sm font-bold text-ict-ink-900">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-ict-orange-500" />
            Weeks 1–4 · what first year expects on day one
          </h3>
          <WeekList strand="foundations" />

          <h3 className="mt-8 flex items-center gap-2 text-sm font-bold text-ict-ink-900">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-ict-orange-500" />
            Weeks 5–12 · the part employers pay for
          </h3>
          <WeekList strand="analysis" />
        </section>

        <section className="mt-14">
          <Eyebrow>What you keep</Eyebrow>
          <SectionHeading as="h2" className="mt-2">
            You finish with four things, not one
          </SectionHeading>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {TAKEAWAYS.map((item) => (
              <Card key={item.title} radius="card" className="p-5">
                <IconBadge icon={item.icon} tone="soft" size={40} round />
                <h3 className="mt-3.5 font-display text-base font-bold text-ict-ink-900">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm text-ict-ink-400">{item.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Who is teaching it. For an education page this is the single strongest
            trust signal there is, and it is the honest answer to "why you and not
            a university" — the credential here is the person, not an institute. */}
        <section className="mt-14">
          <Eyebrow>Taught by</Eyebrow>
          <Card radius="panel" className="mt-3 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Image
                src="/images/dr-yasas.png"
                alt={TEACHER_NAME}
                width={112}
                height={112}
                className="h-28 w-28 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0">
                <h2 className="font-display text-xl font-extrabold text-ict-ink-900">
                  {TEACHER_NAME}
                </h2>
                <ul className="mt-3 space-y-1.5">
                  {TEACHER_CREDENTIALS.map((line) => (
                    <li key={line} className="flex gap-2 text-sm text-ict-ink-400">
                      <Icon
                        name="check_circle"
                        className="mt-0.5 !text-base shrink-0 text-ict-orange-500"
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm">
                  <Link
                    href="/dr-yasas"
                    className="font-semibold text-ict-orange-600 underline decoration-ict-orange-500 underline-offset-2"
                  >
                    More about the lecturer
                  </Link>
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Real intakes from the database, never an invented date. An empty
            state here is honest; a fabricated "starting soon" is not. */}
        <section className="mt-14">
          <SectionHeading as="h2">Intakes and fee</SectionHeading>
          {cohorts.length === 0 ? (
            <Card radius="card" className="mt-4 p-5">
              <p className="text-sm text-ict-ink-400">
                Dates for the next intake are being confirmed. Two run each year, in January and
                July, and the notify list hears first.
              </p>
              <EmailCaptureForm
                source="campus_ready_intakes"
                buttonLabel="Tell me when it opens"
                className="mt-4"
              />
            </Card>
          ) : (
            <ul className="mt-4 space-y-3">
              {cohorts.map((c) => {
                // `listCohorts` only returns subjects that have one, but the
                // optional field does not narrow on its own.
                const term = c.cohort;
                if (!term) return null;
                const stillOpen = isEnrolmentOpen(c, now);
                return (
                  <li key={c.id}>
                    <Card radius="card" className="p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-lg font-bold text-ict-ink-900">{c.name}</h3>
                        <span className="font-bold text-ict-ink-900">
                          {formatLKR(term.feeLKR)}
                          <span className="text-sm font-normal text-ict-ink-400"> once</span>
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-ict-ink-400">
                        {formatDate(term.startsAt)} to {formatDate(term.endsAt)}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Badge tone={stillOpen ? "success" : "neutral"}>
                          {stillOpen
                            ? `Enrolment closes ${formatDate(term.enrolmentClosesAt)}`
                            : "Enrolment closed"}
                        </Badge>
                        {stillOpen ? (
                          <ButtonLink href={`/campus/${c.id}`} variant="primary" size="sm">
                            Enrol
                          </ButtonLink>
                        ) : null}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Said before payment, not after. Each of these is a refund we would
            otherwise have to argue about. */}
        <section className="mt-14">
          <SectionHeading as="h2">Before you enrol, three straight answers</SectionHeading>
          <Card radius="card" className="mt-4 p-5">
            <ul className="space-y-3.5 text-sm text-ict-ink-400">
              <li className="flex gap-2.5">
                <Icon name="computer" className="mt-0.5 !text-base shrink-0 text-ict-ink-900" />
                <span>
                  <strong className="text-ict-ink-900">You need a laptop.</strong> Power BI is
                  Windows-only and Python is impractical on a phone. This is the one requirement we
                  cannot work around.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Icon name="group" className="mt-0.5 !text-base shrink-0 text-ict-ink-900" />
                <span>
                  <strong className="text-ict-ink-900">There is no personal mentor.</strong> Work is
                  marked automatically where that is fair, and by structured peer review where
                  judgement is needed. It is why one payment covers the whole programme.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Icon name="info" className="mt-0.5 !text-base shrink-0 text-ict-ink-900" />
                <span>
                  <strong className="text-ict-ink-900">
                    The certificate is not externally accredited.
                  </strong>{" "}
                  It is issued by ICT Campus, earned by assessment rather than attendance, and
                  verifiable by anyone with the code. We will not describe it as anything more.
                </span>
              </li>
            </ul>
          </Card>
        </section>

        <section className="mt-14">
          <SectionHeading as="h2">Questions</SectionHeading>
          <div className="mt-4 space-y-2.5">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-ict-card border border-ict-paper-300 bg-ict-paper-0 p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-base font-bold text-ict-ink-900">
                  {f.q}
                  <Icon
                    name="expand_more"
                    className="!text-lg shrink-0 text-ict-ink-400 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 text-sm text-ict-ink-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final ask. Same form, different source, so the console can tell which
            placement actually converts once there is traffic. */}
        <section className="mt-14">
          <Card radius="panel" className="p-6 text-center">
            <CampusReadyMark size={40} className="mx-auto text-ict-ink-900" />
            <h2 className="mt-4 font-display text-2xl font-extrabold text-ict-ink-900">
              {CAMPUS_READY.tagline}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ict-ink-400">
              Two intakes a year, and they fill from this list first. Leave your email — nothing else
              is sent to it.
            </p>
            <EmailCaptureForm
              source="campus_ready_footer"
              buttonLabel="Notify me"
              className="mx-auto mt-5 max-w-md text-left"
            />
          </Card>
        </section>
      </main>
    </>
  );
}

/** One strand of the syllabus. Split out so the two halves read identically. */
function WeekList({ strand }: { strand: "foundations" | "analysis" }) {
  return (
    <ol className="mt-3 space-y-2.5">
      {CAMPUS_READY_WEEKS.filter((w) => w.strand === strand).map((w) => (
        <li key={w.week}>
          <Card radius="md" className="p-4">
            <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-xs font-semibold text-ict-ink-400">Week {w.week}</span>
              <span className="font-display text-base font-bold text-ict-ink-900">{w.title}</span>
            </p>
            <p className="mt-1 text-sm text-ict-ink-400">{w.summary}</p>
          </Card>
        </li>
      ))}
    </ol>
  );
}
