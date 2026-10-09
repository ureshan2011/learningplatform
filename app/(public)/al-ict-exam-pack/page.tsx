import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { formatLKR } from "@/lib/format";
import { EXAM_PACK, accessMonths, pick } from "@/lib/exam-pack/config";
import { COPY, INSIDE, fill } from "@/lib/exam-pack/copy";
import { getExamPack } from "@/lib/exam-pack/ensure";
import { getExamPackSettings } from "@/lib/exam-pack/settings";
import { previewQuestions } from "@/lib/exam-pack/papers";
import { WEEKDAYS, WEEKDAYS_SI, formatWallTime } from "@/lib/exam-pack/time";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { FaqAccordion } from "@/components/marketing/landing/FaqAccordion";
import { SampleQuestions } from "@/components/exam-pack/SampleQuestions";
import { EmailCaptureForm } from "@/components/marketing/EmailCaptureForm";
import { breadcrumbJsonLd, faqJsonLd, graphJsonLd, productJsonLd } from "@/lib/seo/json-ld";
import { TEACHER_CREDENTIALS, TEACHER_NAME } from "@/lib/seo/site";

const PATH = EXAM_PACK.publicPath;
// Under 60 characters with the " | ICT Campus" suffix.
const TITLE = "A/L ICT 2027 Exam Pack — papers, walkthroughs, live";
const DESCRIPTION =
  "The A/L ICT 2027 predicted paper and the real 2026 paper, timed and ranked, with every question worked through — plus a one-to-one with Dr. Yasas Sri Wickramasinghe and a live class every Saturday on Google Meet.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  keywords: [
    "A/L ICT 2027",
    "A/L ICT 2027 paper",
    "A/L ICT model paper 2027",
    "A/L ICT 2026 paper answers",
    "A/L ICT past paper walkthrough",
    "A/L ICT revision 2027",
    "A/L ICT online class",
    "ICT A/L exam pack",
    "උසස් පෙළ ICT 2027",
  ],
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: PATH },
};

/**
 * The Exam Pack's public sales page — the link that goes on Facebook, YouTube
 * and WhatsApp.
 *
 * Cream world, like every marketing page, and cached: it never reads a
 * session (CLAUDE.md — public routes keep their static generation). Buying
 * happens on `/exam-pack`, behind sign-in, where PayHere's checkout lives; the
 * buttons here go there, and sign-in brings the student straight back.
 *
 * Always public and indexable, so it is already ranking by the day the pack
 * opens. While the pack is off sale nothing can be bought here: the buttons
 * become a "tell me when it opens" list, and the structured data says
 * pre-order. Revalidated every five minutes, so turning the pack on (or off,
 * or changing the price) shows here within five minutes.
 */
export const revalidate = 300;

const CONTAINER = "mx-auto w-full max-w-[1180px] px-[clamp(20px,4vw,32px)]";
const EYEBROW = "text-[13px] font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase";
const H2 =
  "mt-3 font-[family-name:var(--lp-font-display)] text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-[-0.02em] text-(--lp-ink-900)";

export default async function ExamPackSalesPage() {
  const [settings, subject] = await Promise.all([getExamPackSettings(), getExamPack()]);
  const onSale = settings.enabled;

  const feeLKR = subject?.product?.feeLKR ?? EXAM_PACK.feeLKR;
  const months = accessMonths(subject?.product?.accessDays ?? EXAM_PACK.accessDays);
  const fee = formatLKR(feeLKR);
  const live = {
    title: settings.live.title,
    weekday: WEEKDAYS[settings.live.weekday],
    time: formatWallTime(settings.live.time),
  };
  const liveSi = { ...live, weekday: WEEKDAYS_SI[settings.live.weekday] };

  const faqs = [
    {
      q: "Is the predicted paper the real 2027 paper?",
      a: "No. Nobody has the real paper before the exam, and anyone who says they do is lying. The predicted paper is a pattern analysis of 25 past papers and the syllabus weighting, ranked by confidence, with the reason for every question shown. The 2026 paper in the pack is the real one.",
    },
    {
      q: "How do I pay?",
      a: `By card through PayHere — Visa, Mastercard and the other cards PayHere accepts. ${fee}, once. The pack opens within seconds of paying. This pack is card only; bank deposits are not accepted for it.`,
    },
    {
      q: "When is the live class?",
      a: `Every ${live.weekday} at ${live.time}, Sri Lanka time, on Google Meet, until the exam. The Join button appears in the app 15 minutes before. You join with the Google account on your phone.`,
    },
    {
      q: "How does the consultation work?",
      a: `Dr. Yasas publishes times every week. You pick one in the app, say what you want to talk about, and join a private ${EXAM_PACK.consultMinutes}-minute Google Meet call at that time. You can move it yourself until 12 hours before.`,
    },
    {
      q: "Do I need a laptop?",
      a: "No. Everything works on a phone — the papers, the walkthroughs, the live class and the consultation. A printer is optional: every paper can be saved as a PDF and printed if you want to sit it on paper.",
    },
    {
      q: "How long do I keep it?",
      a: `${months} months from the day you buy it — past the 2027 exam, wherever in the year it falls.`,
    },
    {
      q: "Can I get a refund?",
      a: "Within seven days of buying, if you have not started a paper or had your consultation, ask and it is refunded in full. After that, the refund policy applies.",
    },
    {
      q: "Who made it, and was AI used?",
      a: `${TEACHER_NAME} built the pack. The predicted papers and the walkthroughs were drafted with AI and reviewed by Dr. Yasas before going on sale, and every calculation in them was checked independently.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={graphJsonLd([
          productJsonLd({
            name: EXAM_PACK.name,
            description: DESCRIPTION,
            path: PATH,
            priceLKR: feeLKR,
            availability: onSale ? "InStock" : "PreOrder",
          }),
          faqJsonLd(faqs),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: EXAM_PACK.name, path: PATH },
          ]),
        ])}
      />
      <SiteHeader user={null} />

      <main className="landing-ict bg-(--lp-paper-100)">
        {/* Hero */}
        <section className={`${CONTAINER} py-[clamp(40px,7vw,80px)]`}>
          <p className={EYEBROW}>{EXAM_PACK.name}</p>
          <h1 className="mt-3 max-w-[18ch] font-[family-name:var(--lp-font-display)] text-[clamp(34px,5.4vw,58px)] leading-[1.04] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) text-wrap-balance">
            The 2027 exam year, worked through with you
            <span className="text-(--lp-orange-500)">.</span>
          </h1>
          <p className="mt-5 max-w-[580px] text-[clamp(15px,1.4vw,18px)] text-(--lp-ink-500) text-wrap-pretty">
            Two full Paper I sittings, timed and ranked against every student in the pack, with all 100
            questions worked through. The predicted Paper II with its mark scheme. A one-to-one with
            Dr. Yasas, and a live class every {live.weekday}. In Sinhala and English.
          </p>
          {onSale ? (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={EXAM_PACK.appPath}
                className="flex h-12 items-center gap-3 rounded-full bg-(--lp-orange-500) py-2 pr-6 pl-6 text-base font-semibold text-white shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600) hover:text-white"
              >
                Get the Exam Pack — {fee}
              </Link>
              <a href="#try" className="text-base font-semibold text-(--lp-ink-900) underline decoration-(--lp-orange-500) underline-offset-4">
                Try 8 questions free
              </a>
            </div>
          ) : (
            <div className="mt-8 max-w-[520px]">
              <p className="text-sm font-semibold text-(--lp-ink-900)">
                Opening soon. Leave your email and you will hear the day it opens.
              </p>
              <EmailCaptureForm source="exam_pack_waitlist" buttonLabel="Tell me when it opens" className="mt-3" />
              <a href="#try" className="mt-4 inline-block text-base font-semibold text-(--lp-ink-900) underline decoration-(--lp-orange-500) underline-offset-4">
                Try 8 questions free now
              </a>
            </div>
          )}
          <p className="mt-4 text-sm text-(--lp-ink-500)">
            {fee} · One payment · {months} months · Card only, through PayHere
          </p>
        </section>

        {/* Inside */}
        <section className={`${CONTAINER} border-t border-(--lp-border-subtle) py-[clamp(40px,6vw,72px)]`}>
          <p className={EYEBROW}>Inside the pack</p>
          <h2 className={H2}>Six things, built for the exam year</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INSIDE.map((item) => (
              <li
                key={item.icon}
                className="rounded-[var(--lp-radius-md)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-5"
              >
                <p className="font-[family-name:var(--lp-font-display)] text-base font-extrabold text-(--lp-ink-900)">
                  {fill(item.title, "en", live)}
                </p>
                <p className="mt-1.5 text-sm text-(--lp-ink-500)">{fill(item.body, "en", live)}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Try it first */}
        <section id="try" className={`${CONTAINER} scroll-mt-20 border-t border-(--lp-border-subtle) py-[clamp(40px,6vw,72px)]`}>
          <p className={EYEBROW}>Try it first</p>
          <h2 className={H2}>Eight real questions, answers and all</h2>
          <p className="mt-3 max-w-[600px] text-sm text-(--lp-ink-500)">
            Straight from the pack. Answer in your head, then tap to see the answer and the walkthrough
            — the same walkthrough every question in the pack comes with.
          </p>
          <div className="mt-8 max-w-[820px]">
            <SampleQuestions
              items={previewQuestions()}
              defaultLang="en"
              labels={{ show: COPY.showAnswer, hide: COPY.hideAnswer, walkthrough: { en: "Walkthrough", si: "Walkthrough" } }}
            />
          </div>
        </section>

        {/* Who */}
        <section className={`${CONTAINER} border-t border-(--lp-border-subtle) py-[clamp(40px,6vw,72px)]`}>
          <p className={EYEBROW}>Who you learn with</p>
          <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Image
              src="/images/dr-yasas.png"
              alt={`${TEACHER_NAME}, PhD, University of Canterbury`}
              width={220}
              height={310}
              className="h-auto w-32 shrink-0 rounded-[var(--lp-radius-md)]"
            />
            <div>
              <p className="font-[family-name:var(--lp-font-display)] text-2xl font-extrabold text-(--lp-ink-900)">
                {TEACHER_NAME}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-(--lp-ink-500)">
                {TEACHER_CREDENTIALS.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Link href="/dr-yasas" className="mt-3 inline-block text-sm font-semibold text-(--lp-ink-900) underline decoration-(--lp-orange-500) underline-offset-4">
                More about Dr. Yasas
              </Link>
            </div>
          </div>
        </section>

        {/* Sinhala */}
        <section lang="si" className={`${CONTAINER} border-t border-(--lp-border-subtle) py-[clamp(40px,6vw,72px)]`}>
          <p className={EYEBROW}>සිංහලෙන්</p>
          <h2 className={H2}>2027 exam එකට ඕන ඔක්කොම, එක pack එකක</h2>
          <div className="mt-4 max-w-[640px] space-y-3 text-[15px] leading-relaxed text-(--lp-ink-500)">
            <p>{pick(EXAM_PACK.tagline, "si")}</p>
            <p>
              2027 predicted paper එකයි ඇත්ත 2026 paper එකයි, ඇත්ත exam එකේ වගේම පැය දෙකට, submit කරපු
              ගමන් marks සහ rank. ප්‍රශ්න 100ටම walkthrough. Mark scheme එක්ක predicted Paper II.
            </p>
            <p>
              Dr. Yasas එක්ක Google Meet එකේ විනාඩි {EXAM_PACK.consultMinutes}ක one-to-one එකක්, සහ හැම{" "}
              {liveSi.weekday}ම {liveSi.time}ට (ලංකාවේ වෙලාවෙන්) Live class එකක්.
            </p>
            <p>{fee} — එක ගෙවීමක්, card එකෙන් විතරයි. මාස {months}ක් ඔයාගේ.</p>
          </div>
          {onSale ? (
            <Link
              href={EXAM_PACK.appPath}
              className="mt-6 inline-flex h-12 items-center rounded-full bg-(--lp-orange-500) px-6 text-base font-semibold text-white shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600) hover:text-white"
            >
              Exam Pack එක ගන්න — {fee}
            </Link>
          ) : (
            <p className="mt-6 text-sm font-semibold text-(--lp-ink-900)">
              ළඟදීම open කරනවා. උඩ තියෙන form එකේ email එක දාන්න — open වෙන දවස අපි කියනවා.
            </p>
          )}
        </section>

        {/* FAQ */}
        <section className={`${CONTAINER} border-t border-(--lp-border-subtle) py-[clamp(40px,6vw,72px)]`}>
          <p className={EYEBROW}>Questions</p>
          <h2 className={`${H2} mb-8`}>The awkward ones first</h2>
          <FaqAccordion items={faqs} />
        </section>

        <footer className={`${CONTAINER} border-t border-(--lp-border-subtle) py-10`}>
          <p className="max-w-[640px] text-sm text-(--lp-ink-500)">{COPY.aiNote.en}</p>
          <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-(--lp-ink-500)">
            <Link href="/terms" className="hover:text-(--lp-orange-600)">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-(--lp-orange-600)">
              Privacy
            </Link>
            <Link href="/refund-policy" className="hover:text-(--lp-orange-600)">
              Refunds
            </Link>
            <Link href="/al-ict-classes" className="hover:text-(--lp-orange-600)">
              A/L ICT classes
            </Link>
            <Link href="/" className="hover:text-(--lp-orange-600)">
              ICT Campus
            </Link>
          </nav>
        </footer>
      </main>
    </>
  );
}
