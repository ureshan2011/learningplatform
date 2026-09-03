import Link from "next/link";
import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Manrope } from "next/font/google";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { ScrollEffects } from "@/components/marketing/landing/ScrollEffects";
import { Icon } from "@/components/ui/Icon";
import { EligibilityExplorer } from "@/components/university-pathways/EligibilityExplorer";
import { ALSO_WORTH_KNOWING } from "@/lib/content/university-pathways";

// Same three self-hosted fonts as the main landing page, scoped to this page
// only — this page is built to feel like an extension of it, not a plain
// reference article.
const displayFont = Manrope({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-lp-display" });
const bodyFont = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-lp-body" });
const monoFont = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-lp-mono" });

export const metadata: Metadata = {
  title: "A/L ICT University Degrees Sri Lanka — Z-Score Cutoffs & Eligibility",
  description:
    "Which state university degrees an A/L ICT background makes you eligible for, with real Z-score cutoff ranges from the UGC's own latest published admission round — free, interactive, sourced and clearly disclaimed.",
  alternates: { canonical: "/university-pathways" },
};

const CONTAINER = "mx-auto w-full max-w-[900px] px-[clamp(20px,4vw,32px)]";
const EYEBROW = "text-[13px] font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase";

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "University degrees eligible with an A/L ICT background in Sri Lanka",
    itemListElement: [
      "Bachelor of Information & Communication Technology (BICT)",
      "Bachelor of Information Systems (BIS)",
      "Bachelor of Computer Science",
      "Physical Science – ICT",
      "Applied Sciences (Physical Science), ICT combination",
    ].map((name, i) => ({ "@type": "ListItem", position: i + 1, name })),
  };
}

export default function UniversityPathwaysPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
      <SiteHeader user={null} />
      <ScrollEffects>
        <div className="font-[family-name:var(--lp-font-body)]">
          {/* Hero */}
          <section className="w-full py-[clamp(48px,7vw,88px)]">
            <div className={CONTAINER}>
              <div className={`lp-reveal ${EYEBROW}`}>Free resource</div>
              <h1 className="lp-reveal mt-2.5 text-[clamp(32px,5vw,52px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]">
                Where can A/L ICT actually take you
                <span className="text-(--lp-orange-500)">?</span>
              </h1>
              <p className="lp-reveal mt-4 max-w-[62ch] text-[clamp(15px,1.4vw,18px)] text-(--lp-ink-500) text-wrap-pretty">
                Not just Computer Science. Tick what you studied below and see which state
                university degrees you&apos;re realistically eligible for, with Z-score cutoff
                ranges taken directly from the UGC&apos;s own most recently published admission
                round — not estimated.
              </p>
            </div>
          </section>

          {/* Context: how admission works */}
          <section className="w-full pb-[clamp(24px,4vw,40px)]">
            <div className={CONTAINER}>
              <div className="lp-reveal rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-100) p-[clamp(18px,2.4vw,26px)] text-sm text-(--lp-ink-500)">
                <p className="flex items-start gap-2">
                  <Icon name="info" className="mt-0.5 !text-base shrink-0 text-(--lp-orange-500)" />
                  <span>
                    Sri Lankan state university admission runs on a <strong>Z-score</strong> (how you
                    performed relative to everyone else who sat the same subjects) and a{" "}
                    <strong>district quota</strong> — most seats are reserved proportionally by
                    district, so the cutoff to get into the exact same degree can differ
                    substantially depending on where you sat the exam. That&apos;s why every figure
                    below is a range, not one number: it&apos;s the lowest and highest Z-score that
                    actually got someone in, across every district that had a successful
                    candidate, in the last published round.
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Interactive eligibility explorer */}
          <section className="w-full pb-[clamp(32px,6vw,72px)]">
            <div className={CONTAINER}>
              <div className={`lp-reveal ${EYEBROW}`}>Check your combination</div>
              <h2 className="lp-reveal mt-2.5 mb-[clamp(20px,3vw,30px)] text-[clamp(26px,4vw,38px)] leading-[1.05] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]">
                Degrees, ranked by what you actually qualify for
              </h2>
              <EligibilityExplorer />
            </div>
          </section>

          {/* Also worth knowing */}
          <section className="w-full pb-[clamp(32px,6vw,72px)]">
            <div className={CONTAINER}>
              <div className={`lp-reveal ${EYEBROW}`}>Also worth knowing</div>
              <h2 className="lp-reveal mt-2.5 mb-[clamp(20px,3vw,30px)] text-[clamp(24px,3.6vw,32px)] leading-[1.1] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) font-[family-name:var(--lp-font-display)]">
                ICT counts for more than the headline degrees
              </h2>
              <ul className="space-y-3">
                {ALSO_WORTH_KNOWING.map((item) => (
                  <li
                    key={item.name}
                    className="lp-reveal rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-4 shadow-[var(--lp-shadow-xs)]"
                  >
                    <p className="font-bold text-(--lp-ink-900)">{item.name}</p>
                    <p className="mt-1 text-sm text-(--lp-ink-400)">{item.note}</p>
                    <p className="mt-1.5 text-[11px] text-(--lp-ink-300)">Source: {item.sourceRef}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Sources */}
          <section className="w-full pb-[clamp(24px,4vw,40px)]">
            <div className={CONTAINER}>
              <div className={`lp-reveal ${EYEBROW}`}>Sources</div>
              <h2 className="lp-reveal mt-2.5 mb-4 text-xl font-bold text-(--lp-ink-900)">
                Everything here is traceable
              </h2>
              <ul className="lp-reveal space-y-2 rounded-[var(--lp-radius-card)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-5 text-sm">
                <li>
                  <a
                    href="https://www.ugc.ac.lk/downloads/admissions/cutoff_2025/COP_2024_2025-ENGLISH_Final.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="text-(--lp-orange-500) underline"
                  >
                    University Grants Commission — Minimum Z-Scores for University Admission
                  </a>{" "}
                  <span className="text-(--lp-ink-400)">
                    (2024/2025 academic year, based on the 2024 A/L examination — the most recent round published at time of writing). Every Z-score figure on this page.
                  </span>
                </li>
                <li>
                  <a
                    href="https://mohe.gov.lk/images/pdf/subject_pre-requisites_for_courses_Of_study_.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="text-(--lp-orange-500) underline"
                  >
                    Ministry of Higher Education — Subject Pre-Requisites for Courses of Study (Part Two)
                  </a>{" "}
                  <span className="text-(--lp-ink-400)">Every subject/stream eligibility rule quoted on this page.</span>
                </li>
                <li>
                  <a href="https://www.ugc.ac.lk/" target="_blank" rel="noreferrer" className="text-(--lp-orange-500) underline">
                    ugc.ac.lk
                  </a>{" "}
                  <span className="text-(--lp-ink-400)">— the UGC&apos;s own site, for the current year&apos;s handbook once it is published.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="w-full pb-[clamp(32px,6vw,72px)]">
            <div className={CONTAINER}>
              <div className="lp-reveal rounded-[var(--lp-radius-panel)] border border-(--lp-orange-200) bg-(--lp-orange-50) p-[clamp(20px,3vw,28px)]">
                <h2 className="flex items-center gap-2 text-lg font-bold text-(--lp-ink-900)">
                  <Icon name="gavel" className="!text-lg text-(--lp-orange-500)" />
                  Disclaimer — please read before you decide anything
                </h2>
                <ul className="mt-3 space-y-2.5 text-sm text-(--lp-ink-500)">
                  <li>
                    <strong>These are last cycle&apos;s cutoffs, not this year&apos;s.</strong> Z-scores
                    move every single year with how the whole island performs — sometimes by a
                    lot. Treat every figure here as a rough guide to which degrees are within
                    reach, never as this year&apos;s actual threshold.
                  </li>
                  <li>
                    <strong>Your district is what actually matters.</strong> The range shown is
                    the lowest-to-highest cutoff across all districts with a successful
                    candidate — your own district&apos;s exact figure could sit anywhere in that
                    range, or the programme could show &quot;NQC&quot; (No Qualified Candidates)
                    for your district that year, which the UGC document explains can happen for
                    several different reasons, not only low performance.
                  </li>
                  <li>
                    <strong>Eligibility rules are simplified here.</strong> The real UGC handbook
                    has additional conditions this page doesn&apos;t fully capture — O/L subject
                    credits, medium of instruction, aptitude or practical tests for some degrees,
                    and university-specific variations. Where we weren&apos;t certain a rule applied
                    identically across every university offering a degree, we said so directly in
                    that programme&apos;s notes rather than guessing.
                  </li>
                  <li>
                    <strong>This is not official advice, and we are not the UGC.</strong> ICT
                    Campus is a tuition platform, not a university admissions authority. Before
                    making any decision, check the current year&apos;s handbook at ugc.ac.lk, and
                    talk to your school&apos;s career guidance teacher.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="w-full pt-[clamp(20px,4vw,40px)] pb-[clamp(48px,8vw,96px)]">
            <div className="relative w-full overflow-hidden bg-(--lp-orange-500)">
              <div className={`${CONTAINER} relative flex flex-wrap items-center gap-6 py-[clamp(32px,5vw,56px)]`}>
                <div className="flex-1 basis-[320px]">
                  <h2 className="text-[clamp(22px,3.4vw,32px)] leading-[1.1] font-extrabold tracking-[-0.03em] text-(--lp-paper-0) font-[family-name:var(--lp-font-display)]">
                    Whichever degree you&apos;re aiming for, the syllabus is the same first step.
                  </h2>
                </div>
                <Link
                  href="/signin"
                  className="flex h-12 shrink-0 items-center gap-3 rounded-full bg-(--lp-ink-900) py-2 pr-2 pl-6 text-base font-semibold text-white hover:bg-(--lp-ink-700)"
                >
                  Start free
                  <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-(--lp-orange-500) text-white">
                    <Icon name="arrow_forward" className="!text-base" />
                  </span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </ScrollEffects>
    </div>
  );
}
