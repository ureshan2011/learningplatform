import Link from "next/link";
import type { Metadata } from "next";
import { listSubjects, listSubjectSessions } from "@/lib/queries";
import { AL_ICT_UNITS } from "@/lib/content/al-ict-units";
import { formatLKR, formatSessionTime } from "@/lib/format";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon, type IconName } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ds";
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
 * The home page cannot serve this intent, because it has to do three jobs at
 * once (free resources, the teacher's credibility, the class offer) and its
 * title has to lead with the free material that earns the links. A student
 * comparing tuition classes wants one page that answers medium, grade,
 * syllabus coverage, schedule, price and trial without scrolling past a
 * hero — so this page answers exactly that, in that order, and carries the
 * `Course` structured data that makes it eligible for an education rich
 * result.
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

/**
 * Written against what a student or parent actually types before choosing a
 * class — medium, cost, whether a missed class is recoverable, whether the
 * phone is enough. Every answer is a fact about this platform, not a slogan,
 * because these are also what an AI assistant will quote back.
 */
const FAQS = [
  {
    q: "Are the A/L ICT classes in Sinhala medium or English medium?",
    a: "Both. ICT Campus runs A/L ICT classes in Sinhala medium and in English medium, following the same NIE A/L ICT syllabus — pick the medium you're most comfortable studying in.",
  },
  {
    q: "Which grades are covered?",
    a: "Grades 12 and 13, the complete two-year A/L ICT syllabus. Grade 12 covers units 1 to 6 (concepts, computer fundamentals, data representation, digital circuits, operating systems, networking) and Grade 13 covers units 7 to 14 (system analysis, databases, Python programming, web development, IoT, ICT in business, new trends, and the project).",
  },
  {
    q: "How much do the classes cost?",
    a: "A monthly fee per subject, shown on this page and on the home page. Every subject starts with a free 7-day trial and no card is required to begin, so you can sit in on a real class before paying anything. There is no forced auto-renewal.",
  },
  {
    q: "Can I join from a phone?",
    a: "Yes. Classes run in the browser on any phone, tablet or laptop — there is nothing to install. You sign in with your Sri Lankan mobile number and a one-time SMS code, so there is no password to forget.",
  },
  {
    q: "What happens if I miss a live class?",
    a: "Published class recordings stay available on your subject page and can be downloaded, so a missed class is caught up rather than lost.",
  },
  {
    q: "Do the classes cover past papers?",
    a: "Yes. Past paper questions are worked through in class, and free written breakdowns, a full 2026 Paper I MCQ practice paper and command-word guidance are published openly on this site for anyone, whether or not they join a class.",
  },
  {
    q: "Who teaches the class?",
    a: `${TEACHER_NAME} — PhD in Human Interface Technology from the University of Canterbury, New Zealand, a senior lecturer, a former lecturer at the University of Moratuwa, and a former industry researcher and tech lead at Sony, 99X and Niantic. Every note, video and live class is taught by him personally.`,
  },
  {
    q: "How do I pay?",
    a: "By card through PayHere, by uploading a bank deposit slip, or by cash or bank transfer recorded directly by the teacher. All three issue the same numbered receipt.",
  },
] as const;

const WHY: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: "live_tv",
    title: "Live, not recorded",
    body: "You ask a question and get the answer in the class, not in a comment thread three days later. Recordings exist for catch-up, but the class itself is live.",
  },
  {
    icon: "bolt",
    title: "Quizzes during the class",
    body: "Questions are pushed mid-lesson and answered on your phone, with the island-wide leaderboard right after — so you find out you misunderstood a concept in the same hour you learn it.",
  },
  {
    icon: "fact_check",
    title: "Marks, not just content",
    body: "Knowing the syllabus is not the same as scoring. Command words, answer structure and where examiners actually award marks are taught alongside the content.",
  },
  {
    icon: "download",
    title: "Notes you keep",
    body: "Class notes, past papers and marking schemes download straight after the class and stay yours.",
  },
  {
    icon: "military_tech",
    title: "Timed mock exams",
    body: "Full papers under exam conditions with a live rank, so the first timed paper you sit is not the real one.",
  },
  {
    icon: "smartphone",
    title: "Phone-first",
    body: "Sign in with an SMS code, join from the browser, no app and no password. Built for a student on mobile data, not a desktop lab.",
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
      <SiteHeader user={null} />

      <main className="mx-auto max-w-3xl px-5 py-12">
        {/* The H1 carries the query verbatim. Everything else on the page is
            downstream of getting this one line right. */}
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          A/L ICT classes online — Sinhala &amp; English, Grades 12 &amp; 13
        </h1>

        <p className="mt-4 text-lg text-(--color-awaken-ink-soft)">
          Live A/L ICT tuition for Sri Lankan Advanced Level students, covering the complete{" "}
          {SYLLABUS_AUTHORITY} syllabus — all {AL_ICT_UNITS.length} units across Grade 12 and Grade 13.
          Taught in Sinhala and English medium by{" "}
          <Link href="/dr-yasas" className="font-semibold text-(--color-awaken-deep) underline">
            {TEACHER_NAME}
          </Link>
          . The first 7 days are free and no card is needed to start.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink href="/signin" variant="primary">
            Start the free 7-day trial
          </ButtonLink>
          <Link
            href="/syllabus"
            className="rounded-full border border-(--color-awaken-line) px-5 py-3 font-semibold transition-colors hover:border-(--color-awaken-accent)/40"
          >
            Browse the syllabus first
          </Link>
        </div>

        {/* At-a-glance facts. A student comparing three tuition classes reads
            exactly this and nothing else, so it goes above every other section. */}
        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-line) sm:grid-cols-3">
          {[
            { term: "Subject", value: "A/L ICT (local syllabus)" },
            { term: "Grades", value: "12 and 13" },
            { term: "Medium", value: "Sinhala and English" },
            { term: "Format", value: "Live online, join from a phone" },
            { term: "Syllabus", value: `${AL_ICT_UNITS.length} units · ${totalPeriods} periods` },
            { term: "Fee", value: priceLKR ? `From ${formatLKR(priceLKR)} / month` : "See the class list below" },
          ].map((row) => (
            <div key={row.term} className="bg-(--color-awaken-card) p-4">
              <dt className="text-xs font-semibold tracking-wide text-(--color-awaken-ink-soft) uppercase">
                {row.term}
              </dt>
              <dd className="mt-1 text-sm font-semibold">{row.value}</dd>
            </div>
          ))}
        </dl>

        {/* Sinhala. The audience is a Sinhala-medium student who very often
            searches in Sinhala script; without a single Sinhala string on the
            site those queries cannot match at all. This is a real summary of
            the offer, not a keyword block — `lang` is set so a crawler and a
            screen reader both handle the script correctly. */}
        <section
          lang="si"
          className="si mt-10 rounded-ict-card border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-6"
        >
          <h2 className="text-xl font-bold text-(--color-awaken-deep)">
            උසස් පෙළ තොරතුරු හා සන්නිවේදන තාක්ෂණය (ICT) පන්ති — සිංහල මාධ්‍යයෙන්
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-(--color-awaken-deep)">
            <li>· 12 සහ 13 ශ්‍රේණි සඳහා මාර්ගගත (online) සජීවී ICT පන්ති.</li>
            <li>· NIE විෂය නිර්දේශයේ ඒකක {AL_ICT_UNITS.length}ම සම්පූර්ණයෙන් ආවරණය කරයි.</li>
            <li>· පසුගිය විභාග ප්‍රශ්න පත්‍ර සාකච්ඡා, ක්ෂණික ප්‍රශ්නාවලි සහ බාගත කළ හැකි සටහන්.</li>
            <li>· ඔබේ දුරකථනයෙන්ම පන්තියට සම්බන්ධ විය හැක. යෙදුමක් ස්ථාපනය කිරීම අවශ්‍ය නොවේ.</li>
            <li>· ඉංග්‍රීසි මාධ්‍යයෙන් ද පන්ති පවත්වනු ලැබේ.</li>
            <li>· පළමු දින 7 නොමිලේ. ණයපත් (credit card) අවශ්‍ය නොවේ.</li>
            <li>· උගන්වන්නේ ආචාර්ය යසස් ශ්‍රී වික්‍රමසිංහ — නවසීලන්තයේ Canterbury විශ්වවිද්‍යාලයෙන් ආචාර්ය උපාධිය ලැබූ, ජ්‍යෙෂ්ඨ කථිකාචාර්යවරයෙකි.</li>
          </ul>
          <p className="mt-4 text-sm">
            <Link href="/signin" className="font-semibold text-(--color-awaken-accent) underline">
              නොමිලේ දින 7ක් අත්හදා බලන්න
            </Link>
          </p>
        </section>

        {/* Live, published classes with real prices. Empty until the teacher
            publishes a subject — a fabricated price list would be worse than
            none, both for a student and for the Offer schema above. */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold">Classes and fees</h2>
          {subjects.length === 0 ? (
            <p className="mt-3 text-(--color-awaken-ink-soft)">
              Classes are being set up for the new intake.{" "}
              <Link href="/contact" className="text-(--color-awaken-accent) underline">
                Message us
              </Link>{" "}
              and we will tell you the moment enrolment opens.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {subjects.map((subject) => (
                <li
                  key={subject.id}
                  className="rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold">{subject.name}</h3>
                    <span className="font-bold">
                      {formatLKR(subject.priceLKR)}
                      <span className="text-sm font-normal text-(--color-awaken-ink-soft)"> / month</span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">{subject.description}</p>
                  <p className="mt-2 text-xs font-semibold text-(--color-awaken-success)">
                    First 7 days free · no card required
                  </p>
                </li>
              ))}
            </ul>
          )}

          {upcoming.length > 0 ? (
            <div className="mt-5 rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-5">
              <h3 className="flex items-center gap-2 font-bold">
                <Icon name="calendar_month" className="!text-base text-(--color-awaken-accent)" />
                Next live classes
              </h3>
              <ul className="mt-3 space-y-1.5 text-sm text-(--color-awaken-ink-soft)">
                {upcoming.map((s) => (
                  <li key={s.id}>
                    <span className="font-semibold text-(--color-awaken-deep)">{s.title}</span> ·{" "}
                    {formatSessionTime(s.startsAt)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">What makes this different from a recorded course</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {WHY.map((item) => (
              <div
                key={item.title}
                className="rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-5"
              >
                <h3 className="flex items-center gap-2 font-bold">
                  <Icon name={item.icon} className="!text-base text-(--color-awaken-accent)" />
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The full unit list. This is the page's substance: a student
            comparing classes wants to see the whole syllabus is covered, and
            each unit name is itself something students search for. */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold">Every unit covered, Grade 12 and Grade 13</h2>
          <p className="mt-2 text-(--color-awaken-ink-soft)">
            The {SYLLABUS_AUTHORITY} A/L ICT syllabus, unit by unit, with the syllabus&apos;s own numbering
            and period counts — nothing renumbered, nothing skipped.
          </p>

          {[
            { year: 12 as const, units: grade12 },
            { year: 13 as const, units: grade13 },
          ].map(({ year, units }) => (
            <div key={year} className="mt-6">
              <h3 className="text-lg font-bold">
                Grade {year}
                <span className="ml-2 text-sm font-normal text-(--color-awaken-ink-soft)">
                  units {units[0]?.competencyNumber}–{units[units.length - 1]?.competencyNumber}
                </span>
              </h3>
              <ul className="mt-3 space-y-2">
                {units.map((u) => (
                  <li
                    key={u.id}
                    className="rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) px-4 py-3"
                  >
                    <Link
                      href={`/syllabus/${SUBJECT_ID}/${u.id}`}
                      className="flex flex-wrap items-baseline justify-between gap-2"
                    >
                      <span className="font-semibold">
                        <span className="text-(--color-awaken-accent)">{u.competencyNumber}.</span> {u.title}
                      </span>
                      <span className="text-xs text-(--color-awaken-ink-soft)">
                        {u.lessons.length} lessons · {u.periods} periods
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Exam shape. Ranks for "A/L ICT paper structure" style queries on its
            own, and it is the context that makes the class offer legible. */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold">How the A/L ICT exam is structured</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[EXAM_STRUCTURE.paper1, EXAM_STRUCTURE.paper2].map((paper) => (
              <div
                key={paper.name}
                className="rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-5"
              >
                <h3 className="font-bold">{paper.name}</h3>
                <p className="mt-1 text-sm font-semibold text-(--color-awaken-accent)">
                  {paper.durationMinutes / 60} hours
                  {"questions" in paper ? ` · ${paper.questions} questions` : ""}
                </p>
                <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">{paper.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-(--color-awaken-ink-soft)">
            Free and open to everyone:{" "}
            <Link href="/past-papers" className="text-(--color-awaken-accent) underline">
              the past papers guide
            </Link>
            ,{" "}
            <Link href="/papers/al-ict-2026-paper-1-mcq" className="text-(--color-awaken-accent) underline">
              a full 2026 Paper I MCQ practice paper
            </Link>{" "}
            and{" "}
            <Link href="/command-words" className="text-(--color-awaken-accent) underline">
              what every exam command word requires
            </Link>
            .
          </p>
        </section>

        {/* Who is teaching. For an exam-prep site this is the single strongest
            trust signal a search engine and a parent both look for. */}
        <section className="mt-12 rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-6">
          <h2 className="text-2xl font-bold">Who teaches these classes</h2>
          <p className="mt-3 text-(--color-awaken-ink-soft)">
            <Link href="/dr-yasas" className="font-semibold text-(--color-awaken-deep) underline">
              {TEACHER_NAME}
            </Link>{" "}
            teaches every class, writes every note and records every video on this site personally —
            there is no panel of assistant tutors.
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-(--color-awaken-ink-soft)">
            {TEACHER_CREDENTIALS.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <Icon name="check_circle" className="mt-0.5 shrink-0 !text-base text-(--color-awaken-success)" />
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Questions students and parents ask</h2>
          <div className="mt-4 space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card)"
              >
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold">{faq.q}</summary>
                <p className="border-t border-(--color-awaken-line) px-5 py-4 text-sm text-(--color-awaken-ink-soft)">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-ict-panel bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) p-6 text-white">
          <h2 className="text-2xl font-bold">Sit in on a real class before you pay</h2>
          <p className="mt-2 text-white/90">
            Seven days free, no card, no auto-renewal. Sign in with your mobile number and one SMS code.
          </p>
          <Link
            href="/signin"
            className="mt-4 inline-block rounded-full bg-white px-5 py-3 font-semibold text-(--color-awaken-accent)"
          >
            Start free
          </Link>
        </section>
      </main>
    </>
  );
}
