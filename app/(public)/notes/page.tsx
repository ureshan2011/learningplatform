import Link from "next/link";
import type { Metadata } from "next";
import { listPublicContent, listSubjects } from "@/lib/queries";
import { publicContentUrl } from "@/lib/content/r2";
import { formatDate } from "@/lib/format";
import type { ContentItem, ContentKind, Subject } from "@/lib/types";

export const metadata: Metadata = {
  title: "Free ICT notes & past papers",
  description:
    "Free O/L and A/L ICT notes, past papers and marking schemes for Sri Lankan students, in Sinhala medium.",
};

// Cached for an hour: this is the SEO funnel, so it must render fast and
// statically for crawlers rather than hitting Firestore per visitor.
export const revalidate = 3600;

const KIND_LABEL: Record<ContentKind, string> = {
  notes: "Notes",
  past_paper: "Past paper",
  marking_scheme: "Marking scheme",
  replay: "Class replay",
};

export default async function PublicNotesPage() {
  const [items, subjects] = await Promise.all([
    listPublicContent().catch(() => [] as ContentItem[]),
    listSubjects().catch(() => [] as Subject[]),
  ]);
  const subjectById = new Map(subjects.map((s) => [s.id, s]));

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm text-white/50 underline">
        ← Home
      </Link>

      <h1 className="mt-4 text-3xl font-bold">Free ICT notes &amp; past papers</h1>
      <p className="mt-3 text-white/65">
        Download these free. No sign-up needed. For live classes, quizzes and marked
        answers, join a class. Also free:{" "}
        <Link href="/command-words" className="underline">
          exam command words explained
        </Link>
        .
      </p>

      {items.length === 0 ? (
        <p className="mt-10 text-sm text-white/50">Nothing published yet — check back soon.</p>
      ) : (
        <ul className="mt-10 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.title}</p>
                <p className="mt-0.5 text-xs text-white/45">
                  {subjectById.get(item.subjectId)?.name ?? item.subjectId} ·{" "}
                  {KIND_LABEL[item.kind]} · {formatDate(item.createdAt)}
                </p>
              </div>
              {/* Public content is served straight off R2 — no signing, no auth. */}
              <a
                href={publicContentUrl(item.r2Key)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-14 rounded-xl border border-[--color-brand]/30 bg-[--color-brand]/10 p-6">
        <h2 className="text-lg font-bold">Want the live class?</h2>
        <p className="mt-2 text-sm text-white/70">
          Live lessons in Sinhala, quizzes during class, an island-wide leaderboard and
          every past paper worked through step by step.
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
