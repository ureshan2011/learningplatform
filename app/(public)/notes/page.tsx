import type { Metadata } from "next";
import { listPublicContent, listSubjects } from "@/lib/queries";
import { signedContentUrl } from "@/lib/content/storage";
import { formatDate } from "@/lib/format";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon, type IconName } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { FreeResourcesFooter } from "@/components/content/FreeResourcesFooter";
import { ResourcePageCta } from "@/components/content/ResourcePageCta";
import { Card, EmptyState, IconBadge, PageHeader } from "@/components/ds-cream";
import type { ContentItem, ContentKind, Subject } from "@/lib/types";

export const metadata: Metadata = {
  title: "Free ICT notes & past papers",
  description:
    "Free A/L ICT notes, past papers and marking schemes for Sri Lankan Grade 12 and 13 students, in Sinhala and English medium.",
  alternates: { canonical: "/notes" },
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
  const [rawItems, subjects] = await Promise.all([
    listPublicContent().catch(() => [] as ContentItem[]),
    listSubjects().catch(() => [] as Subject[]),
  ]);
  // Fresh signed URLs on every hourly regeneration (see `revalidate` above) —
  // Storage denies direct reads, so this is the only way a file leaves the bucket.
  const items = await Promise.all(
    rawItems.map(async (item) => ({ ...item, downloadUrl: await signedContentUrl(item.storagePath) })),
  );
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
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free notes", path: "/notes" },
        ])}
      />
      <SiteHeader user={null} />
      <main className="bg-ict-paper-100">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <PageHeader
            eyebrow="Free resource"
            title="Free ICT notes & past papers"
            subtitle="Download these free. No sign-up needed. For live classes, quizzes and marked answers, join a class."
          />

          {items.length === 0 ? (
            <div className="mt-10">
              <EmptyState
                icon="description"
                title="Nothing published yet"
                body="Check back soon — new notes and past papers are added regularly."
              />
            </div>
          ) : (
            <ul className="mt-8 space-y-3">
              {items.map((item) => (
                <li key={item.id}>
                  <Card radius="card" className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <IconBadge icon={KIND_ICON[item.kind]} tone="soft" size={40} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ict-ink-900">{item.title}</p>
                        <p className="mt-0.5 text-xs text-ict-ink-400">
                          {subjectById.get(item.subjectId)?.name ?? item.subjectId} ·{" "}
                          {KIND_LABEL[item.kind]} · {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ict-press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-ict-ink-900 px-4 text-sm font-semibold text-ict-ink-900 transition-colors duration-[120ms] ease-ict hover:border-ict-orange-500 hover:text-ict-orange-600"
                    >
                      <Icon name="download" className="!text-base" />
                      Download
                    </a>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          <FreeResourcesFooter exclude={["/notes"]} />

          <ResourcePageCta
            title="Want the live class?"
            body="Live lessons in Sinhala, quizzes during class, an island-wide leaderboard and every past paper worked through step by step."
            guestHref="/signin"
            guestLabel="Join a class"
          />
        </div>
      </main>
    </>
  );
}
