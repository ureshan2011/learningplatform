import { requirePageUser } from "@/lib/auth/session";
import { listPublicContent, listSubjects } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { resourceLabels } from "@/lib/i18n/resource-labels";
import { ResourceActions } from "@/components/content/ResourceActions";
import { CommandWordsBody } from "@/components/content/CommandWordsBody";
import { EmptyState, IconBadge, PageHeader, SectionBar } from "@/components/ds";
import { PageShell } from "@/components/ds/PageShell";
import type { ContentItem, ContentKind, Subject } from "@/lib/types";
import type { IconName } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<ContentKind, string> = {
  notes: "Notes",
  past_paper: "Past paper",
  marking_scheme: "Marking scheme",
  replay: "Class replay",
  pack: "Pack file",
};

/** Kinds the in-app reader can actually render. A replay is video and a pack
 *  file is whatever the teacher uploaded, so both stay download-only rather
 *  than opening a reader that shows nothing. */
const READABLE_KINDS: ReadonlySet<ContentKind> = new Set(["notes", "past_paper", "marking_scheme"]);

const KIND_ICON: Record<ContentKind, IconName> = {
  notes: "description",
  past_paper: "receipt_long",
  marking_scheme: "check_circle",
  replay: "videocam",
  pack: "inventory_2",
};

/**
 * The free resources, inside the app.
 *
 * The rail used to offer three of these — "Free notes", "Past papers",
 * "Command words" — and all three went to `/notes`, `/past-papers` and
 * `/command-words`: public, cream, statically generated pages carrying the
 * marketing header and a "Sign in" button. Tapping any of them from a dark
 * sidebar dropped the student out of the product with no way back but the
 * browser.
 *
 * Those pages stay exactly as they are. They are the SEO funnel, they cache
 * for everyone rather than rendering per visitor, and a session read here
 * would cost them that (see the comment on `/notes`). This is one in-app
 * screen that serves the same material to someone already signed in, which it
 * can do better than the public page anyway: a student can read a paper here
 * without downloading it, and a download that is wanted gets its own
 * ten-minute signed URL per click rather than one baked into cached HTML.
 *
 * One entry in the rail rather than three. A student looking for "the free
 * stuff" has one place to look, and the reference material sits beside the
 * files instead of being a separate destination.
 */
export default async function LibraryPage() {
  await requirePageUser("/library");

  const [items, subjects, t] = await Promise.all([
    listPublicContent().catch(() => [] as ContentItem[]),
    listSubjects().catch(() => [] as Subject[]),
    getT(),
  ]);
  const subjectById = new Map(subjects.map((s) => [s.id, s]));

  return (
    <PageShell width="reading">
      <PageHeader title={t("library.title")} subtitle={t("library.subtitle")} />

      <section className="mt-6">
        <SectionBar
          title={t("library.files")}
          hint={t("library.filesHint", { count: items.length })}
        />
        {items.length === 0 ? (
          <EmptyState icon="description" title={t("library.empty")} body={t("library.emptyBody")} />
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-ict-md border border-ict-line bg-ict-surface-card p-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <IconBadge icon={KIND_ICON[item.kind]} tone="dark" size={40} round />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ict-fg">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-ict-fg-soft">
                      {subjectById.get(item.subjectId)?.name ?? item.subjectId} ·{" "}
                      {KIND_LABEL[item.kind]} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
                <ResourceActions
                  contentId={item.id}
                  title={item.title}
                  readable={READABLE_KINDS.has(item.kind)}
                  labels={resourceLabels(t)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <SectionBar title={t("library.reference")} hint={t("library.referenceHint")} />
        <CommandWordsBody />
      </section>
    </PageShell>
  );
}
