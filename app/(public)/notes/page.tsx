import Link from "next/link";
import type { Metadata } from "next";
import { listPublicContent, listSubjects } from "@/lib/queries";
import { publicContentUrl } from "@/lib/content/r2";
import { formatDate } from "@/lib/format";
import { TopBar } from "@/components/ui/TopBar";
import { EmptyState } from "@/components/ui/EmptyState";
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
    <main className="min-h-dvh">
      <TopBar back={{ href: "/", label: "Home" }} />

      <div className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-display text-3xl">Free ICT notes &amp; past papers</h1>
        <p className="mt-3 text-(--color-text-muted)">
          Download these free. No sign-up needed. For live classes, quizzes and marked answers,
          join a class.
        </p>

        {items.length === 0 ? (
          <div className="mt-10">
            <EmptyState>Nothing published yet — check back soon.</EmptyState>
          </div>
        ) : (
          <ul className="mt-10 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="surface surface-interactive flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-(--color-text-faint)">
                    {subjectById.get(item.subjectId)?.name ?? item.subjectId} · {KIND_LABEL[item.kind]} ·{" "}
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                {/* Public content is served straight off R2 — no signing, no auth. */}
                <a
                  href={publicContentUrl(item.r2Key)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm shrink-0"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}

        <section className="surface mt-14 border-(--color-brand)/25 bg-(--color-brand)/[0.07] p-6">
          <h2 className="text-title text-lg">Want the live class?</h2>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            Live lessons in Sinhala, quizzes during class, an island-wide leaderboard and every
            past paper worked through step by step.
          </p>
          <Link href="/signin" className="btn btn-primary mt-4">
            Join a class
          </Link>
        </section>
      </div>
    </main>
  );
}
