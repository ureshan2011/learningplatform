import type { Metadata } from "next";
import { PACK_GUIDES, SURVIVAL_PACK } from "@/lib/content/survival-pack";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, graphJsonLd } from "@/lib/seo/json-ld";
import { CampusFooter } from "@/components/content/CampusFooter";
import { FaqList } from "@/components/content/FaqList";
import { campusMetadata } from "@/lib/seo/campus";
import { ResourcePageCta } from "@/components/content/ResourcePageCta";
import { Card, PageHeader } from "@/components/ds";

export const metadata: Metadata = campusMetadata({
  title: "How to email a lecturer — sample emails for Sri Lankan students",
  description:
    "Two ready-to-copy emails: asking a lecturer a question, and requesting an extension. What to put in the subject line, which title to use, and what not to write.",
  path: "/campus/academic-email",
  keywords: [
    "email to lecturer sample",
    "how to email a lecturer Sri Lanka",
    "extension request email university",
    "academic email format",
    "lecturer ට email එකක් ලියන හැටි",
  ],
});

export const revalidate = 86400;

/**
 * The free sample from the Survival Pack.
 *
 * Two of the five templates, given away whole. "How do I email my lecturer" is
 * a question a first-year types into Google at 11pm, and answering it properly
 * is both the honest thing to do and the cheapest way to be found by exactly
 * the person the pack is for. Holding all five back would rank for nothing.
 */
const GUIDE = PACK_GUIDES.find((g) => g.key === "academic-email");
const TEMPLATE_SECTION = GUIDE?.sections.find((s) => s.templates);
const FREE_TEMPLATES = TEMPLATE_SECTION?.templates?.slice(0, 2) ?? [];
const HOW_SECTION = GUIDE?.sections[0];

const FAQS = [
  {
    q: "How should I address a lecturer in an email?",
    a: "Dear Dr. or Dear Professor with their surname. Check their staff page rather than guessing — getting the title wrong is the one thing that is noticed immediately. Use Mr. or Ms. only if you know they hold no doctorate.",
  },
  {
    q: "What should the subject line say?",
    a: "The module code and what you want, in that order — for example, [IS2011] Extension request — Assignment 1. A lecturer filters hundreds of emails by module code.",
  },
  {
    q: "When should I ask for an extension?",
    a: "Before the deadline, not after. Before, it is a request and it is usually granted; after, it is an appeal and it usually is not.",
  },
];

export default function AcademicEmailPage() {
  return (
    <>
      <JsonLd
        data={graphJsonLd([
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Campus Ready", path: "/campus-ready" },
            { name: "Emailing a lecturer", path: "/campus/academic-email" },
          ]),
        ])}
      />
      <main className="bg-ict-surface">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <PageHeader
            eyebrow="Free resource"
            title="How to email a lecturer"
            subtitle="Two emails you can copy, and the five parts every academic email needs. Free, from the Campus Survival Pack."
          />

          {HOW_SECTION ? (
            <Card radius="card" className="mt-8 p-6">
              <h2 className="font-display text-xl font-extrabold text-ict-fg">
                {HOW_SECTION.heading.en}
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ict-fg-soft">
                {HOW_SECTION.body.en}
              </p>
            </Card>
          ) : null}

          <div className="mt-4 space-y-4">
            {FREE_TEMPLATES.map((template) => (
              <Card key={template.label.en} radius="card" className="p-6">
                <h2 className="font-display text-lg font-extrabold text-ict-fg">
                  {template.label.en}
                </h2>
                {/* Selectable plain text rather than a copy button: this page is
                    static and cached for a day, and a client component here
                    would cost a hydration for one convenience. */}
                <pre className="mt-3 overflow-x-auto rounded-ict-md border border-ict-line bg-ict-surface-card p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-ict-fg">
                  {template.text}
                </pre>
              </Card>
            ))}
          </div>

          <Card radius="card" className="mt-4 p-6">
            <h2 className="font-display text-lg font-extrabold text-ict-fg">
              Before you send it
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-ict-fg-soft">
              Check the name and the title. Check every square bracket is gone — an email that still
              says [module code] says you did not read your own message. Check the attachment is
              actually attached. And if you are angry about a mark, write the email, then send it
              tomorrow.
            </p>
          </Card>

          {/* The same three answers the FAQPage schema above carries. Google only
              accepts FAQ markup for questions a reader can actually see. */}
          <FaqList faqs={FAQS} heading="Common questions" />

          <div className="mt-8">
            <ResourcePageCta
              title={SURVIVAL_PACK.name}
              body="Three more email templates, a university assignment template with automatic contents, an APA and Harvard guide with real Sri Lankan examples, a Python starter notebook and more."
              guestHref="/campus-survival-pack"
              guestLabel="See what's inside"
            />
          </div>

          <CampusFooter exclude={["/campus/academic-email"]} />
        </div>
      </main>
    </>
  );
}
