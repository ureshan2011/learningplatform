import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { FreeResourcesFooter } from "@/components/content/FreeResourcesFooter";
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
        <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold">
          <Icon name="calendar_month" className="!text-2xl text-(--color-awaken-accent)" />
          A revision plan — especially if you&apos;re repeating or unsure where you stand
        </h1>
        <p className="mt-3 text-(--color-awaken-ink-soft)">
          Repeating A/L ICT, or just not confident about your last mark, is common — it is not a sign
          you can&apos;t do this. What actually moves a mark is revising the right units first and
          matching your plan to the time you genuinely have left, not more hours spent on whatever
          feels most familiar.
        </p>

        <section
          lang="si"
          className="si mt-8 rounded-ict-card border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-6"
        >
          <h2 className="text-xl font-bold text-(--color-awaken-deep)">
            A/L ICT නැවත කරන අය සඳහා — සිංහලෙන්
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-(--color-awaken-deep)">
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
            <Link href="/signin" className="font-semibold text-(--color-awaken-accent) underline">
              නොමිලේ දින 7ක් අත්හදා බලන්න
            </Link>
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">First, find out where you actually stand</h2>
          <p className="mt-2 text-(--color-awaken-ink-soft)">
            A plan built on a guess about your weak areas wastes the time it took to make it.
          </p>
          <ul className="mt-4 space-y-3">
            <li className="rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-4">
              <p className="font-semibold">Have a recent paper or mark?</p>
              <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
                Trace every lost mark back to its syllabus unit —{" "}
                <Link href="/past-papers#official" className="text-(--color-awaken-accent) underline">
                  the method for doing that properly
                </Link>{" "}
                is on the past papers page. Four wrong answers scattered randomly is noise; four wrong
                answers from the same unit is a diagnosis.
              </p>
            </li>
            <li className="rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-4">
              <p className="font-semibold">Don&apos;t have one, or it&apos;s old?</p>
              <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
                Sit{" "}
                <Link href="/papers/al-ict-2026-paper-1-mcq" className="text-(--color-awaken-accent) underline">
                  the free 2026 Paper I MCQ
                </Link>{" "}
                as a baseline — free, no sign-in, scored instantly. It replaces a guess with an actual
                starting point.
              </p>
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Revise in the order marks actually concentrate</h2>
          <p className="mt-2 text-(--color-awaken-ink-soft)">
            The syllabus&apos;s own teaching-period allocation is the best public signal of where marks
            concentrate — more periods generally means more marks. This is every A/L ICT unit, heaviest
            first, not in the syllabus&apos;s own numbering.
          </p>
          <ol className="mt-4 space-y-2">
            {UNITS_BY_YIELD.map((unit, i) => (
              <li key={unit.id}>
                <Link
                  href={`/syllabus/al-ict/${unit.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 transition-colors hover:border-(--color-awaken-accent)/40"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-sm text-(--color-awaken-ink-soft)">{i + 1}</span>
                    <span className="font-semibold">
                      Unit {unit.competencyNumber} — {unit.title}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {isHighYield(unit.periods) ? (
                      <span className="rounded-full bg-(--color-awaken-accent-soft) px-2.5 py-0.5 text-[11px] font-bold text-(--color-awaken-accent) uppercase">
                        High-yield
                      </span>
                    ) : null}
                    <span className="text-xs text-(--color-awaken-ink-soft)">
                      Grade {unit.gradeYear} · {unit.periods} periods
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">A realistic plan for the time you actually have</h2>
          <p className="mt-2 text-(--color-awaken-ink-soft)">
            Pick the row that matches your exam date, not the one that flatters your intentions.
          </p>
          <div className="mt-4 space-y-4">
            {STAGES.map((stage) => (
              <div key={stage.window} className="rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-bold">{stage.headline}</h3>
                  <span className="rounded-full bg-(--color-awaken-accent-soft) px-2.5 py-0.5 text-xs font-bold text-(--color-awaken-accent) uppercase">
                    {stage.window}
                  </span>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-(--color-awaken-ink-soft)">
                  {stage.steps.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <Icon name="chevron_right" className="mt-0.5 shrink-0 !text-base text-(--color-awaken-accent)" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Exam technique is still worth fixing, whatever stage you&apos;re at</h2>
          <p className="mt-2 text-(--color-awaken-ink-soft)">
            {EXAM_STRUCTURE.paper1.note} {EXAM_STRUCTURE.paper2.note} Neither of those costs real
            revision time to fix —{" "}
            <Link href="/command-words" className="text-(--color-awaken-accent) underline">
              every command word explained
            </Link>{" "}
            and{" "}
            <Link href="/distinguish-between" className="text-(--color-awaken-accent) underline">
              ten worked &quot;distinguish between&quot; answers
            </Link>{" "}
            are both free and take under an hour each.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Questions students ask</h2>
          <div className="mt-4 space-y-3">
            {FAQ.map((faq) => (
              <details key={faq.q} className="rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card)">
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold">{faq.q}</summary>
                <p className="border-t border-(--color-awaken-line) px-5 py-4 text-sm text-(--color-awaken-ink-soft)">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <FreeResourcesFooter exclude={["/revision-plan"]} />

        <section className="mt-8 rounded-ict-panel bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) p-6 text-white">
          <h2 className="text-lg font-bold">Want the structure of a live class behind this plan?</h2>
          <p className="mt-2 text-white/90">
            Seven days free, no card, no auto-renewal. Sign in with your mobile number and one SMS code.
          </p>
          <Link href="/signin" className="mt-4 inline-block rounded-full bg-white px-5 py-3 font-semibold text-(--color-awaken-accent)">
            Start free
          </Link>
        </section>
      </main>
    </>
  );
}
