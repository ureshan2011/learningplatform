import type { Metadata } from "next";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { PaperAttempt } from "@/components/papers/PaperAttempt";
import { publicEnv } from "@/lib/env";
import { AL_ICT_2026_PAPER1, PAPER_DURATION_MINUTES, PAPER_QUESTION_COUNT } from "@/lib/content/al-ict-2026-paper1";

export const metadata: Metadata = {
  title: "A/L ICT 2026 Paper I MCQ — Attempt Free, Answers Included",
  description:
    "Attempt the full A/L ICT 2026 Paper I (50 MCQs) online, free, no sign-in — a live 2-hour timer, instant scoring and every correct answer explained. Sinhala and English.",
  alternates: { canonical: "/papers/al-ict-2026-paper-1-mcq" },
};

/** Makes the paper eligible for a rich result and gives an AI assistant enough to cite it directly. */
function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: "A/L ICT 2026 Paper I (MCQ)",
    description:
      "A 50-question multiple-choice practice paper for Sri Lankan A/L ICT (Grades 12 & 13), free and open without sign-in.",
    about: { "@type": "Thing", name: "Information & Communication Technology" },
    educationalLevel: "Advanced Level",
    numberOfQuestions: PAPER_QUESTION_COUNT,
    timeRequired: `PT${PAPER_DURATION_MINUTES}M`,
    inLanguage: ["si", "en"],
    isAccessibleForFree: true,
    provider: { "@type": "EducationalOrganization", name: "ICT Campus", url: publicEnv.appUrl },
  };
}

export default function AlIctPaper1Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
      <SiteHeader user={null} />
      <PaperAttempt />

      {/*
        Server-rendered and always in the DOM (not behind a noscript tag or a
        click) — the interactive widget above hides its 50 questions behind a
        "Start" button, which a search crawler never presses. This is what
        actually makes the paper's content indexable, and it doubles as a
        genuinely useful plain answer key for anyone who just wants to check
        one answer without starting a timed attempt.
      */}
      <section className="mx-auto max-w-3xl px-5 pb-16">
        <details className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card)">
          <summary className="cursor-pointer list-none px-5 py-4 font-semibold">
            Read the full paper as text, with every answer (no timer)
          </summary>
          <div className="border-t border-(--color-awaken-line) px-5 py-4">
            <h2 className="text-lg font-bold">A/L ICT 2026 Paper I (MCQ) — all {PAPER_QUESTION_COUNT} questions and answers</h2>
            <ol className="mt-4 space-y-5 text-sm">
              {AL_ICT_2026_PAPER1.map((q, i) => (
                <li key={q.id} id={`q${q.id}`}>
                  <p className="font-semibold">{i + 1}. {q.en.stem}</p>
                  <ol className="mt-1.5 ml-4 list-decimal space-y-0.5 text-(--color-awaken-ink-soft)">
                    {q.en.options.map((opt, j) => (
                      <li key={j} className={j === q.correctIndex ? "font-semibold text-(--color-awaken-success)" : undefined}>
                        {opt}
                        {j === q.correctIndex ? " ✓" : ""}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          </div>
        </details>
      </section>
    </>
  );
}
