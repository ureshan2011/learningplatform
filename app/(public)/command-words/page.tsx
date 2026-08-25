import Link from "next/link";
import type { Metadata } from "next";
import { COMMAND_WORDS } from "@/lib/content/command-words";

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
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm text-white/50 underline">
        ← Home
      </Link>

      <h1 className="mt-4 text-3xl font-bold">ICT exam command words, explained</h1>
      <p className="mt-3 text-white/65">
        Every year, students who know the ICT syllabus cold still lose marks — not on
        content, but on misreading what a question is actually asking for.
        &quot;Explain&quot; is not &quot;state&quot;. &quot;Distinguish&quot; is not
        &quot;describe&quot;. Here is exactly what each one requires.
      </p>

      <ul className="mt-10 space-y-4">
        {COMMAND_WORDS.map((cw) => (
          <li key={cw.word} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold">{cw.word}</h2>
              <span className="text-xs text-white/45">{cw.typicalMarks}</span>
            </div>
            <p className="si mt-1 text-sm text-[--color-accent]" lang="si">
              {cw.sinhala}
            </p>
            <p className="mt-3 text-sm text-white/75">{cw.meaning}</p>
            <p className="mt-2 rounded-lg bg-[--color-brand]/10 p-3 text-sm text-[--color-brand]">
              {cw.tip}
            </p>
            <p className="mt-3 text-sm text-white/50">
              <span className="font-medium text-white/70">Example: </span>
              {cw.example}
            </p>
          </li>
        ))}
      </ul>

      <section className="mt-14 rounded-xl border border-[--color-brand]/30 bg-[--color-brand]/10 p-6">
        <h2 className="text-lg font-bold">Drill these until they&apos;re automatic</h2>
        <p className="mt-2 text-sm text-white/70">
          Every subject&apos;s Practice section includes command-word drill questions —
          short scenarios that check whether you&apos;d actually answer a &quot;distinguish&quot;
          or a &quot;justify&quot; correctly under exam conditions.
        </p>
        <Link
          href="/signin"
          className="mt-4 inline-block rounded-lg bg-[--color-brand] px-5 py-2.5 font-semibold text-black"
        >
          Join a class
        </Link>
      </section>
    </main>
  );
}
