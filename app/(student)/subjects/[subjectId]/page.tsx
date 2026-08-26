import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSubject, listContent } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { formatDate } from "@/lib/format";
import { DownloadButton } from "@/components/content/DownloadButton";
import { StartTrialButton } from "@/components/payments/StartTrialButton";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { r2Configured } from "@/lib/features";
import type { ContentKind } from "@/lib/types";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<ContentKind, string> = {
  notes: "Notes",
  past_paper: "Past paper",
  marking_scheme: "Marking scheme",
  replay: "Class replay",
};

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/subjects/${subjectId}`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const access = await hasAccess(user.uid, subjectId);
  const items = await listContent(subjectId);

  // Locked students still see the catalogue — knowing what they are missing is
  // the most effective renewal prompt there is.
  const visible = access.allowed ? items : items.filter((i) => i.isPublic);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/dashboard" className="text-sm text-(--color-awaken-ink-soft) underline">
        ← Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold">{subject.name}</h1>
      <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">{subject.description}</p>

      {access.allowed ? (
        <nav className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/subjects/${subjectId}/practice`}
            className="rounded-lg border border-(--color-awaken-line) px-4 py-2 text-sm hover:border-(--color-awaken-accent)/40"
          >
            🎯 Practice &amp; revision
          </Link>
          <Link
            href={`/subjects/${subjectId}/lab`}
            className="rounded-lg border border-(--color-awaken-line) px-4 py-2 text-sm hover:border-(--color-awaken-accent)/40"
          >
            🧪 Code Lab
          </Link>
          <Link
            href={`/subjects/${subjectId}/certificate`}
            className="rounded-lg border border-(--color-awaken-line) px-4 py-2 text-sm hover:border-(--color-awaken-accent)/40"
          >
            🎓 Certificate
          </Link>
        </nav>
      ) : null}

      {!access.allowed ? (
        <div className="mt-6 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-4 text-sm">
          <p className="font-medium text-(--color-awaken-accent)">
            {access.reason === "expired"
              ? "Your subscription has ended."
              : !access.enrollment
                ? "You are not enrolled in this subject yet."
                : "You are not enrolled in this subject."}
          </p>
          <p className="mt-1 text-(--color-awaken-ink-soft)">
            {items.length - visible.length} more resources unlock when you subscribe.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/*
              A trial is only offered where `hasAccess` found no enrollment
              document at all — see the reason comment on `startFreeTrial`.
              A lapsed or cancelled subscriber always has one, so they only
              ever see "Subscribe".
            */}
            {!access.enrollment ? <StartTrialButton subjectId={subjectId} /> : null}
            <Link
              href="/dashboard"
              className="inline-block rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-4 py-2 font-semibold hover:border-(--color-awaken-accent)/40"
            >
              Subscribe
            </Link>
          </div>
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Notes &amp; past papers</h2>
        {!r2Configured() ? (
          <div className="mt-3">
            <NotConfigured feature="r2" />
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">Nothing published yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {visible.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-(--color-awaken-ink-soft)">
                    {KIND_LABEL[item.kind]} · {formatDate(item.createdAt)}
                    {item.isPublic ? " · free" : ""}
                  </p>
                </div>
                <DownloadButton contentId={item.id} label="Download" />
              </li>
            ))}
          </ul>
        )}
      </section>
      </main>
    </>
  );
}
