import Link from "next/link";
import type { Metadata } from "next";
import { listPublicContent, listSubjects } from "@/lib/queries";
import { publicContentUrl } from "@/lib/content/r2";
import { formatDate } from "@/lib/format";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { ContentItem, ContentKind, Subject } from "@/lib/types";

export const metadata: Metadata = {
  title: "Free ICT notes & past papers",
  description:
    "Free A/L ICT notes, past papers and marking schemes for Sri Lankan Grade 12 and 13 students, in Sinhala medium.",
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

const KIND_ICON: Record<ContentKind, IconName> = {
  notes: "description",
  past_paper: "receipt_long",
  marking_scheme: "check_circle",
  replay: "videocam",
};

export default async function PublicNotesPage() {
  const [items, subjects] = await Promise.all([
    listPublicContent().catch(() => [] as ContentItem[]),
    listSubjects().catch(() => [] as Subject[]),
  ]);
  const subjectById = new Map(subjects.map((s) => [s.id, s]));

  return (
    <>
      {/*
        Guest header always, deliberately: reading the session here would
        force this page to render dynamically per-visitor, which is exactly
        what the SEO funnel comment above warns against. A signed-in visitor
        sees "Sign in" for a moment longer, which costs far less than losing
        static generation on the page search traffic lands on.
      */}
      <SiteHeader user={null} />
      <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold">
        <Icon name="description" className="!text-2xl text-(--color-awaken-accent)" />
        Free ICT notes &amp; past papers
      </h1>
      <p className="mt-3 text-(--color-awaken-ink-soft)">
        Download these free. No sign-up needed. For live classes, quizzes and marked
        answers, join a class. Also free:{" "}
        <Link href="/command-words" className="underline">
          exam command words explained
        </Link>
        .
      </p>

      {items.length === 0 ? (
        <p className="mt-10 text-sm text-(--color-awaken-ink-soft)">Nothing published yet — check back soon.</p>
      ) : (
        <ul className="mt-10 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)">
                  <Icon name={KIND_ICON[item.kind]} className="!text-lg" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-(--color-awaken-ink-soft)">
                    {subjectById.get(item.subjectId)?.name ?? item.subjectId} ·{" "}
                    {KIND_LABEL[item.kind]} · {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
              {/* Public content is served straight off R2 — no signing, no auth. */}
              <a
                href={publicContentUrl(item.r2Key)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-awaken-line) px-4 py-2 text-sm hover:border-(--color-awaken-accent)/40"
              >
                <Icon name="download" className="!text-base" />
                Download
              </a>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-14 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-6">
        <h2 className="text-lg font-bold">Want the live class?</h2>
        <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
          Live lessons in Sinhala, quizzes during class, an island-wide leaderboard and
          every past paper worked through step by step.
        </p>
        <Link
          href="/signin"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 font-semibold text-white"
        >
          <Icon name="videocam" className="!text-base" />
          Join a class
        </Link>
      </section>
      </main>
    </>
  );
}
