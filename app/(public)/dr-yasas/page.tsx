import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Card, IconBadge, SectionHeading, ButtonLink } from "@/components/ds-cream";
import { Icon, type IconName } from "@/components/ui/Icon";
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

/** Each list on this page is a run of credentials, not a checklist — a small
 *  accent icon marks the line without implying pass/fail semantics. */
function CredentialList({ icon, items }: { icon: IconName; items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-ict-ink-400">
          <Icon name={icon} className="mt-0.5 shrink-0 !text-base text-ict-orange-500" />
          {item}
        </li>
      ))}
    </ul>
  );
}

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
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-ict-ink-900 sm:text-4xl">
              {TEACHER_NAME}
            </h1>
            <p className="mt-2 text-lg text-ict-ink-400">
              PhD in Human Interface Technology, University of Canterbury — lecturer, {SUBJECT_EN}{" "}
              ({GRADES}), ICT Campus
            </p>

            <Card variant="raised" radius="card" className="mt-4 inline-flex items-start gap-3 px-4 py-3">
              <IconBadge icon="fact_check" tone="brand" size={36} />
              <div>
                <p className="text-sm font-bold text-ict-ink-900">UGC-certified lecturer</p>
                <p className="text-xs text-ict-ink-400">
                  Certificate in Teaching in Higher Education (CTHE) — top of cohort
                </p>
              </div>
            </Card>

            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href="/al-ict-classes" variant="primary">
                See A/L ICT classes
              </ButtonLink>
              <a
                href={TEACHER_WEBSITE}
                target="_blank"
                rel="noreferrer me"
                className="ict-press inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-ict-ink-900 px-5 text-sm font-semibold text-ict-ink-900 transition-colors duration-[120ms] ease-ict hover:border-ict-orange-500 hover:text-ict-orange-600"
              >
                <Icon name="north_east" className="!text-base" />
                Personal website
              </a>
              <a
                href={TEACHER_LINKEDIN}
                target="_blank"
                rel="noreferrer me"
                className="ict-press inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-ict-ink-900 px-5 text-sm font-semibold text-ict-ink-900 transition-colors duration-[120ms] ease-ict hover:border-ict-orange-500 hover:text-ict-orange-600"
              >
                <Icon name="north_east" className="!text-base" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <p className="mt-8 text-ict-ink-400">
          {TEACHER_NAME} teaches every live class, writes every note and records every video published on
          ICT Campus personally — an online tuition platform for Sri Lankan GCE Advanced Level{" "}
          {SUBJECT_EN} students ({GRADES}), covering the complete National Institute of Education (NIE)
          syllabus in Sinhala and English medium.
        </p>

        <section className="mt-10">
          <SectionHeading as="h2" className="!text-xl">
            Academic qualifications
          </SectionHeading>
          <CredentialList icon="school" items={ACADEMIC} />
        </section>

        <section className="mt-8">
          <SectionHeading as="h2" className="!text-xl">
            Teaching experience
          </SectionHeading>
          <CredentialList icon="auto_stories" items={TEACHING} />
        </section>

        <section className="mt-8">
          <SectionHeading as="h2" className="!text-xl">
            Professional &amp; research experience
          </SectionHeading>
          <CredentialList icon="workspace_premium" items={PROFESSIONAL} />
        </section>

        <section className="mt-8">
          <SectionHeading as="h2" className="!text-xl">
            Public talks &amp; speaking
          </SectionHeading>
          <CredentialList icon="co_present" items={SPEAKING} />
        </section>

        <Card radius="card" className="mt-10 p-6">
          <SectionHeading as="h2" className="!text-lg">
            Questions people ask
          </SectionHeading>
          <div className="mt-4 space-y-3">
            {FAQS.map((faq) => (
              <Card key={faq.q} variant="raised" radius="md" className="overflow-hidden">
                <details>
                  <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-ict-ink-900">{faq.q}</summary>
                  <p className="border-t border-ict-paper-300 px-4 py-3 text-sm text-ict-ink-400">{faq.a}</p>
                </details>
              </Card>
            ))}
          </div>
        </Card>

        <p className="mt-8 text-sm text-ict-ink-400">
          Read the full class offer on the{" "}
          <Link href="/al-ict-classes" className="text-ict-orange-600 underline decoration-ict-orange-500 underline-offset-2">
            A/L ICT classes page
          </Link>
          , or browse the{" "}
          <Link href="/syllabus" className="text-ict-orange-600 underline decoration-ict-orange-500 underline-offset-2">
            full syllabus
          </Link>{" "}
          he teaches, unit by unit.
        </p>

        <FreeResourcesFooter exclude={["/dr-yasas"]} />
      </main>
    </>
  );
}
