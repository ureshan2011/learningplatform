import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { FreeResourcesFooter } from "@/components/content/FreeResourcesFooter";
import { ResourcePageCta } from "@/components/content/ResourcePageCta";
import { PageHeader, Card, CardLink, SectionHeading, Badge } from "@/components/ds-cream";
import { AL_ICT_UNITS } from "@/lib/content/al-ict-units";
import { isHighYield } from "@/lib/content/unit-visuals";
import { EXAM_STRUCTURE } from "@/lib/seo/site";
import { STAGES, FAQ } from "@/lib/content/revision-plan";

const TITLE = "A/L ICT revision plan — for repeat candidates & anyone unsure of their marks";
const DESCRIPTION =
  "A revision plan for A/L ICT that starts from where you actually are — a repeat candidate, unsure of your last mark, or just short on time. Which units to revise first, a realistic plan for however many weeks are left, and how to find your weak areas without a recent paper. Free.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/revision-plan" },
  keywords: [
    "A/L ICT revision plan",
    "A/L ICT repeat student",
    "AL ICT repeat exam",
    "A/L ICT self study plan",
    "A/L ICT low marks",
    "උසස් පෙළ ICT නැවත විභාගය",
    "උසස් පෙළ ICT revision",
  ],
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/revision-plan" },
};

// Fixed reference content — safe to cache like command-words and distinguish-between.
export const revalidate = 86400;

const UNITS_BY_YIELD = [...AL_ICT_UNITS].sort((a, b) => b.periods - a.periods);

export default function RevisionPlanPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Revision plan", path: "/revision-plan" },
        ])}
      />
      <SiteHeader user={null} />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <PageHeader
          eyebrow="Free resource"
          title="A revision plan — especially if you're repeating or unsure where you stand"
          subtitle="Repeating A/L ICT, or just not confident about your last mark, is common — it is not a sign you can't do this. What actually moves a mark is revising the right units first and matching your plan to the time you genuinely have left, not more hours spent on whatever feels most familiar."
        />

        <section lang="si" className="si mt-8 rounded-ict-card border border-ict-orange-200 bg-ict-orange-50 p-6">
          <h2 className="font-display text-xl font-extrabold text-ict-ink-900">
            A/L ICT නැවත කරන අය සඳහා — සිංහලෙන්
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-ict-ink-700">
            <li>
              · A/L ICT නැවත කරන එක සාමාන්‍ය දෙයක්. ලකුණු අඩු වුනා කියලා ඔයාට හැකියාවක් නෑ කියලා අදහස්
              නෑ.
            </li>
            <li>
              · පළමුවෙන්ම ඔයා දැනට කොහෙද ඉන්නේ කියලා දැනගන්න. නෝට්ස් නැවත කියවනවට වඩා, 2026 Paper I MCQ
              එක නොමිලේ try කරලා බලන්න.
            </li>
            <li>
              · සියලුම ඒකක එකම විදිහට revise කරන්න එපා. වැඩිම ලකුණු එන ඒකක (periods වැඩි ඒවා) මුලින්ම
              කරන්න — පහළින් ඒ list එක තියෙනවා.
            </li>
            <li>· Command words (state, explain, distinguish) හරියට තේරුම් ගන්නවා කියන්නේ ලේසියෙන්ම ලකුණු ගන්න එකක්.</li>
            <li>
              · වෙලාව අඩුයි කියලා හිතෙනවද? හැමදාම cover කරන්න බෑ, ඒත් weak topics කිහිපයක් ගැඹුරින් කරලා,
              සතියකට timed paper එකක් හරි කරන එක ප්‍රමාණවත්.
            </li>
            <li>· පන්තියක් join කරන එකෙන් ඔයාට structure එකක් ලැබෙනවා — මුල් දින 7 නොමිලේ.</li>
          </ul>
          <p className="mt-4 text-sm">
            <Link href="/signin" className="font-semibold text-ict-orange-600 underline">
              නොමිලේ දින 7ක් අත්හදා බලන්න
            </Link>
          </p>
        </section>

        <section className="mt-12">
          <SectionHeading>First, find out where you actually stand</SectionHeading>
          <p className="mt-2 text-ict-ink-500">
            A plan built on a guess about your weak areas wastes the time it took to make it.
          </p>
          <ul className="mt-4 space-y-3">
            <li>
              <Card radius="card" className="p-4">
                <p className="font-semibold text-ict-ink-900">Have a recent paper or mark?</p>
                <p className="mt-1 text-sm text-ict-ink-500">
                  Trace every lost mark back to its syllabus unit —{" "}
                  <Link href="/past-papers#official" className="text-ict-orange-600 underline">
                    the method for doing that properly
                  </Link>{" "}
                  is on the past papers page. Four wrong answers scattered randomly is noise; four wrong
                  answers from the same unit is a diagnosis.
                </p>
              </Card>
            </li>
            <li>
              <Card radius="card" className="p-4">
                <p className="font-semibold text-ict-ink-900">Don&apos;t have one, or it&apos;s old?</p>
                <p className="mt-1 text-sm text-ict-ink-500">
                  Sit{" "}
                  <Link href="/papers/al-ict-2026-paper-1-mcq" className="text-ict-orange-600 underline">
                    the free 2026 Paper I MCQ
                  </Link>{" "}
                  as a baseline — free, no sign-in, scored instantly. It replaces a guess with an actual
                  starting point.
                </p>
              </Card>
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <SectionHeading>Revise in the order marks actually concentrate</SectionHeading>
          <p className="mt-2 text-ict-ink-500">
            The syllabus&apos;s own teaching-period allocation is the best public signal of where marks
            concentrate — more periods generally means more marks. This is every A/L ICT unit, heaviest
            first, not in the syllabus&apos;s own numbering.
          </p>
          <ol className="mt-4 space-y-2">
            {UNITS_BY_YIELD.map((unit, i) => (
              <li key={unit.id}>
                <CardLink href={`/syllabus/al-ict/${unit.id}`} radius="card" className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-sm text-ict-ink-400">{i + 1}</span>
                    <span className="font-semibold text-ict-ink-900">
                      Unit {unit.competencyNumber} — {unit.title}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {isHighYield(unit.periods) ? <Badge tone="brand">High-yield</Badge> : null}
                    <span className="text-xs text-ict-ink-400">
                      Grade {unit.gradeYear} · {unit.periods} periods
                    </span>
                  </span>
                </CardLink>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <SectionHeading>A realistic plan for the time you actually have</SectionHeading>
          <p className="mt-2 text-ict-ink-500">
            Pick the row that matches your exam date, not the one that flatters your intentions.
          </p>
          <div className="mt-4 space-y-4">
            {STAGES.map((stage) => (
              <Card key={stage.window} radius="card" className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display font-bold text-ict-ink-900">{stage.headline}</h3>
                  <Badge tone="brand">{stage.window}</Badge>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-ict-ink-500">
                  {stage.steps.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <Icon name="chevron_right" className="mt-0.5 shrink-0 !text-base text-ict-orange-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <SectionHeading>Exam technique is still worth fixing, whatever stage you&apos;re at</SectionHeading>
          <p className="mt-2 text-ict-ink-500">
            {EXAM_STRUCTURE.paper1.note} {EXAM_STRUCTURE.paper2.note} Neither of those costs real
            revision time to fix —{" "}
            <Link href="/command-words" className="text-ict-orange-600 underline">
              every command word explained
            </Link>{" "}
            and{" "}
            <Link href="/distinguish-between" className="text-ict-orange-600 underline">
              ten worked &quot;distinguish between&quot; answers
            </Link>{" "}
            are both free and take under an hour each.
          </p>
        </section>

        <section className="mt-12">
          <SectionHeading>Questions students ask</SectionHeading>
          <div className="mt-4 space-y-3">
            {FAQ.map((faq) => (
              <Card key={faq.q} radius="card" className="overflow-hidden">
                <details>
                  <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-ict-ink-900">{faq.q}</summary>
                  <p className="border-t border-ict-paper-300 px-5 py-4 text-sm text-ict-ink-500">{faq.a}</p>
                </details>
              </Card>
            ))}
          </div>
        </section>

        <FreeResourcesFooter exclude={["/revision-plan"]} />

        <ResourcePageCta
          title="Want the structure of a live class behind this plan?"
          body="Seven days free, no card, no auto-renewal. Sign in with your mobile number and one SMS code."
          guestHref="/signin"
          guestLabel="Start free"
        />
      </main>
    </>
  );
}
