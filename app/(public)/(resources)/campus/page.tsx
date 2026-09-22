import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { CampusFooter } from "@/components/content/CampusFooter";
import { ButtonLink, Card, IconBadge, PageHeader } from "@/components/ds";
import type { IconName } from "@/components/ui/Icon";
import { campusMetadata } from "@/lib/seo/campus";
import { breadcrumbJsonLd, graphJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = campusMetadata({
  title: "Free first-year university guides for Sri Lankan students",
  description:
    "Free guides for your first year at a Sri Lankan university: emailing a lecturer, APA referencing with real examples, and using AI honestly in assignments.",
  path: "/campus",
  keywords: [
    "first year university Sri Lanka",
    "university guide Sri Lanka",
    "campus tips Sri Lanka",
    "campus එකට ලෑස්ති වෙන්න",
  ],
});

export const revalidate = 86400;

/**
 * The hub for the free `/campus/*` guides — what gives each of them a parent
 * in its breadcrumb and a page that links them together.
 *
 * ## The URL space is shared
 *
 * `/campus/{subjectId}` is also the signed-in cohort page
 * (`app/(student)/campus/[subjectId]`). A static guide wins over the dynamic
 * segment, which is what lets these live here — and it means a guide slug must
 * never equal a cohort id. Cohort ids are `campus-ready-<year>-<term>`, so a
 * plain topic word like `apa-referencing` cannot collide. Keep it that way.
 */

const GUIDES: Array<{ href: string; icon: IconName; title: string; body: string }> = [
  {
    href: "/campus/academic-email",
    icon: "mail",
    title: "How to email a lecturer",
    body: "Two emails you can copy — a question and an extension request — and the five parts every academic email needs.",
  },
  {
    href: "/campus/apa-referencing",
    icon: "auto_stories",
    title: "APA referencing, with real examples",
    body: "How a reference works in text and in the list, and exactly how to write a book and a journal article.",
  },
  {
    href: "/campus/ai-rules",
    icon: "auto_awesome",
    title: "Using AI honestly",
    body: "Where help ends and misconduct starts, and the two mistakes that get students caught.",
  },
];

export default function CampusGuidesPage() {
  return (
    <>
      <JsonLd
        data={graphJsonLd([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Campus guides", path: "/campus" },
          ]),
        ])}
      />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <PageHeader
          eyebrow="Free · first year"
          title="Guides for your first year"
          subtitle="The things a Sri Lankan degree expects you to know in week one, and nobody teaches. Free to read, no sign-in."
        />

        <ul className="mt-8 space-y-3">
          {GUIDES.map((g) => (
            <li key={g.href}>
              <Link href={g.href} className="block">
                <Card radius="card" className="ict-lift flex gap-4 p-5 hover:border-ict-line-strong-hover">
                  <IconBadge icon={g.icon} size={40} />
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-bold text-ict-fg">{g.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-ict-fg-soft">{g.body}</p>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>

        <Card variant="feature" radius="panel" className="mt-10 p-6 sm:p-8">
          <h2 className="font-display text-lg font-extrabold">Everything else, in one kit</h2>
          <p className="mt-2 text-sm text-ict-on-feature-soft">
            The Campus Survival Pack: an assignment template with automatic contents, the full APA
            and Harvard guide, a Zotero library, an AI-use declaration generator, email templates and
            a Python starter notebook. One payment, yours for three years.
          </p>
          <ButtonLink href="/campus-survival-pack" variant="primary" className="mt-5">
            See the pack
          </ButtonLink>
        </Card>

        <CampusFooter />
      </main>
    </>
  );
}
