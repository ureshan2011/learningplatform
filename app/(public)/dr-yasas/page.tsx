import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { ButtonLink } from "@/components/ds";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { FreeResourcesFooter } from "@/components/content/FreeResourcesFooter";
import { GRADES, SUBJECT_EN, TEACHER_LINKEDIN, TEACHER_NAME, TEACHER_WEBSITE } from "@/lib/seo/site";

/**
 * The canonical page for the person who teaches everything on this site. An
 * exam-prep site's single strongest trust signal is "who teaches this and are
 * they qualified" — this page is where that question gets a complete,
 * citable answer, in crawlable HTML rather than only inside JSON-LD.
 */

const TITLE = TEACHER_NAME;
const DESCRIPTION =
  `${TEACHER_NAME} — PhD in Human Interface Technology, University of Canterbury (New Zealand). ` +
  `Teaches ${SUBJECT_EN} (${GRADES}) in Sinhala and English medium at ICT Campus, Sri Lanka.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/dr-yasas" },
  openGraph: {
    type: "profile",
    title: TITLE,
    description: DESCRIPTION,
    url: "/dr-yasas",
    images: ["/images/dr-yasas.png"],
  },
};

// Biographical content changes rarely — cache like the other reference pages.
export const revalidate = 86400;

const ACADEMIC = [
  "PhD, Human Interface Technology — University of Canterbury, New Zealand",
  "Certificate in Teaching in Higher Education (CTHE), UGC-approved — top of the staff development programme cohort",
];

const TEACHING = [
  `Teaches the complete NIE ${SUBJECT_EN} syllabus (${GRADES}) at ICT Campus, live and online, in Sinhala and English medium`,
  "Senior Lecturer, Yoobee College of Creative Innovation, New Zealand — teaches on the Master of Business Informatics programme, Auckland and Christchurch",
  "Former Lecturer, Faculty of Information Technology, University of Moratuwa",
  "70,000+ students taught on Udemy and open.uom.lk",
];

const PROFESSIONAL = [
  "Postdoctoral researcher, HIT Lab NZ, University of Canterbury",
  "Postdoctoral researcher and industry tech lead — Sony",
  "Industry experience — 99X",
  "Industry experience — Niantic",
  "Peer-reviewed research published in Entertainment Computing (Elsevier) and other HCI venues",
];

const SPEAKING = [
  "Invited speaker, NZGDC (New Zealand Game Developers Conference) — on multiplayer, location-based AR game design",
  "Workshop speaker, ICITR, University of Moratuwa",
  "Workshop speaker, IEEE WIE Sri Lanka",
  "Speaker, Falling Walls Lab Aotearoa New Zealand",
];

const FAQS = [
  {
    q: "Who is Dr. Yasas Sri Wickramasinghe?",
    a: `${TEACHER_NAME} is the lecturer behind ICT Campus, a Sri Lankan online tuition platform for GCE Advanced Level ICT. He holds a PhD in Human Interface Technology from the University of Canterbury, New Zealand, and is a Senior Lecturer in New Zealand, teaching on a master's programme.`,
  },
  {
    q: "What is Dr. Yasas Sri Wickramasinghe's academic qualification?",
    a: "A PhD in Human Interface Technology from the University of Canterbury, New Zealand.",
  },
  {
    q: "Does Dr. Yasas Sri Wickramasinghe teach A/L ICT?",
    a: `Yes. He personally teaches every live class, writes every note and records every video for ${SUBJECT_EN} (${GRADES}) at ICT Campus, in Sinhala and English medium, covering the full NIE syllabus.`,
  },
  {
    q: "What is Dr. Yasas Sri Wickramasinghe's professional background?",
    a: "Before and alongside teaching, he worked as a postdoctoral researcher at HIT Lab NZ and as an industry tech lead at Sony, with further industry experience at 99X and Niantic. He was previously a lecturer at the University of Moratuwa and is currently a Senior Lecturer in New Zealand, teaching on a Master of Business Informatics programme. He has taught over 70,000 students on Udemy and open.uom.lk.",
  },
  {
    q: "Has Dr. Yasas Sri Wickramasinghe spoken at any conferences?",
    a: "Yes. He has been an invited speaker at NZGDC (New Zealand Game Developers Conference) on AR game design, and has spoken at ICITR (University of Moratuwa), IEEE WIE Sri Lanka and Falling Walls Lab Aotearoa New Zealand.",
  },
  {
    q: "Is Dr. Yasas Sri Wickramasinghe a certified teacher?",
    a: "Yes. Alongside his PhD, he holds a UGC-approved Certificate in Teaching in Higher Education (CTHE), finishing the staff development programme at the top of his cohort.",
  },
] as const;

export default function LecturerPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Dr. Yasas Sri Wickramasinghe", path: "/dr-yasas" },
        ])}
      />
      <SiteHeader user={null} />

      <main className="mx-auto max-w-3xl px-5 py-12">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <Image
            src="/images/dr-yasas.png"
            alt="Dr. Yasas Sri Wickramasinghe, PhD in Human Interface Technology, University of Canterbury"
            width={220}
            height={310}
            priority
            className="h-auto w-40 shrink-0 rounded-ict-card"
          />
          <div>
            {/* One H1, the person's own name — this page's entire purpose. */}
            <h1 className="text-3xl font-bold sm:text-4xl">{TEACHER_NAME}</h1>
            <p className="mt-2 text-lg text-(--color-awaken-ink-soft)">
              PhD in Human Interface Technology, University of Canterbury — lecturer, {SUBJECT_EN}{" "}
              ({GRADES}), ICT Campus
            </p>

            <div className="mt-4 inline-flex items-start gap-3 rounded-ict-card border border-(--color-awaken-accent)/25 bg-(--color-awaken-accent-soft) px-4 py-3">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-(--color-awaken-accent) text-white">
                <Icon name="fact_check" className="!text-base" />
              </span>
              <div>
                <p className="text-sm font-bold text-(--color-awaken-ink)">UGC-certified lecturer</p>
                <p className="text-xs text-(--color-awaken-ink-soft)">
                  Certificate in Teaching in Higher Education (CTHE) — top of cohort
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href="/al-ict-classes" variant="primary">
                See A/L ICT classes
              </ButtonLink>
              <a
                href={TEACHER_WEBSITE}
                target="_blank"
                rel="noreferrer me"
                className="flex items-center gap-2 rounded-full border border-(--color-awaken-line) px-5 py-3 font-semibold transition-colors hover:border-(--color-awaken-accent)/40"
              >
                <Icon name="north_east" className="!text-base" />
                Personal website
              </a>
              <a
                href={TEACHER_LINKEDIN}
                target="_blank"
                rel="noreferrer me"
                className="flex items-center gap-2 rounded-full border border-(--color-awaken-line) px-5 py-3 font-semibold transition-colors hover:border-(--color-awaken-accent)/40"
              >
                <Icon name="north_east" className="!text-base" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <p className="mt-8 text-(--color-awaken-ink-soft)">
          {TEACHER_NAME} teaches every live class, writes every note and records every video published on
          ICT Campus personally — an online tuition platform for Sri Lankan GCE Advanced Level{" "}
          {SUBJECT_EN} students ({GRADES}), covering the complete National Institute of Education (NIE)
          syllabus in Sinhala and English medium.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Academic qualifications</h2>
          <ul className="mt-3 space-y-2">
            {ACADEMIC.map((item) => (
              <li key={item} className="flex items-start gap-2 text-(--color-awaken-ink-soft)">
                <Icon name="school" className="mt-0.5 shrink-0 !text-base text-(--color-awaken-accent)" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Teaching experience</h2>
          <ul className="mt-3 space-y-2">
            {TEACHING.map((item) => (
              <li key={item} className="flex items-start gap-2 text-(--color-awaken-ink-soft)">
                <Icon name="auto_stories" className="mt-0.5 shrink-0 !text-base text-(--color-awaken-accent)" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Professional &amp; research experience</h2>
          <ul className="mt-3 space-y-2">
            {PROFESSIONAL.map((item) => (
              <li key={item} className="flex items-start gap-2 text-(--color-awaken-ink-soft)">
                <Icon name="workspace_premium" className="mt-0.5 shrink-0 !text-base text-(--color-awaken-accent)" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Public talks &amp; speaking</h2>
          <ul className="mt-3 space-y-2">
            {SPEAKING.map((item) => (
              <li key={item} className="flex items-start gap-2 text-(--color-awaken-ink-soft)">
                <Icon name="co_present" className="mt-0.5 shrink-0 !text-base text-(--color-awaken-accent)" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-6">
          <h2 className="text-lg font-bold">Questions people ask</h2>
          <div className="mt-4 space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.q} className="rounded-ict-md border border-(--color-awaken-line)">
                <summary className="cursor-pointer list-none px-4 py-3 font-semibold">{faq.q}</summary>
                <p className="border-t border-(--color-awaken-line) px-4 py-3 text-sm text-(--color-awaken-ink-soft)">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-8 text-sm text-(--color-awaken-ink-soft)">
          Read the full class offer on the{" "}
          <Link href="/al-ict-classes" className="text-(--color-awaken-accent) underline">
            A/L ICT classes page
          </Link>
          , or browse the{" "}
          <Link href="/syllabus" className="text-(--color-awaken-accent) underline">
            full syllabus
          </Link>{" "}
          he teaches, unit by unit.
        </p>

        <FreeResourcesFooter exclude={["/dr-yasas"]} />
      </main>
    </>
  );
}
