import Link from "next/link";
import type { Metadata } from "next";
import { COMMAND_WORDS } from "@/lib/content/command-words";
import { SiteHeader } from "@/components/nav/SiteHeader";

export const metadata: Metadata = {
  title: "ICT exam command words explained",
  description:
    "What 'state', 'explain', 'distinguish' and every other O/L and A/L ICT command word actually requires — free, in English and Sinhala.",
};

// Fixed reference content — safe to cache like the free notes page.
export const revalidate = 86400;

/**
 * The single highest-leverage, lowest-cost content page on the platform:
 * losing marks for misreading a command word is one of the most common and
 * most fixable mistakes in O/L and A/L ICT, and this list needs no teacher
 * authoring or Firestore reads to exist.
 */
export default function CommandWordsPage() {
  return (
    <>
      {/*
        Guest header always, deliberately — see the same note on /notes.
        This page is fixed static content cached for a day; reading the
        session would force it to render dynamically per-visitor for no
        real benefit.
      */}
      <SiteHeader user={null} />
      <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="mt-4 text-3xl font-bold">ICT exam command words, explained</h1>
      <p className="mt-3 text-(--color-awaken-ink-soft)">
        Every year, students who know the ICT syllabus cold still lose marks — not on
        content, but on misreading what a question is actually asking for.
        &quot;Explain&quot; is not &quot;state&quot;. &quot;Distinguish&quot; is not
        &quot;describe&quot;. Here is exactly what each one requires.
      </p>

      <ul className="mt-10 space-y-4">
        {COMMAND_WORDS.map((cw) => (
          <li key={cw.word} className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold">{cw.word}</h2>
              <span className="text-xs text-(--color-awaken-ink-soft)">{cw.typicalMarks}</span>
            </div>
            <p className="si mt-1 text-sm text-(--color-awaken-deep)" lang="si">
              {cw.sinhala}
            </p>
            <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">{cw.meaning}</p>
            <p className="mt-2 rounded-lg bg-(--color-awaken-accent-soft) p-3 text-sm text-(--color-awaken-accent)">
              {cw.tip}
            </p>
            <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">
              <span className="font-medium text-(--color-awaken-ink-soft)">Example: </span>
              {cw.example}
            </p>
          </li>
        ))}
      </ul>

      <section className="mt-14 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-6">
        <h2 className="text-lg font-bold">Drill these until they&apos;re automatic</h2>
        <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
          Every subject&apos;s Practice section includes command-word drill questions —
          short scenarios that check whether you&apos;d actually answer a &quot;distinguish&quot;
          or a &quot;justify&quot; correctly under exam conditions.
        </p>
        <Link
          href="/signin"
          className="mt-4 inline-block rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 font-semibold text-white"
        >
          Join a class
        </Link>
      </section>
      </main>
    </>
  );
}
