import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSubject, listContent } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { formatDate } from "@/lib/format";
import { DownloadButton } from "@/components/content/DownloadButton";
import { NotConfigured } from "@/components/ui/NotConfigured";
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
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/dashboard" className="text-sm text-white/50 underline">
        ← Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold">{subject.name}</h1>
      <p className="mt-1 text-sm text-white/55">{subject.description}</p>

      {!access.allowed ? (
        <div className="mt-6 rounded-xl border border-[--color-brand]/30 bg-[--color-brand]/10 p-4 text-sm">
          <p className="font-medium text-[--color-brand]">
            {access.reason === "expired"
              ? "Your subscription has ended."
              : "You are not enrolled in this subject."}
          </p>
          <p className="mt-1 text-white/70">
            {items.length - visible.length} more resources unlock when you subscribe.
          </p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block rounded-lg bg-[--color-brand] px-4 py-2 font-semibold text-black"
          >
            Subscribe
          </Link>
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Notes &amp; past papers</h2>
        {!r2Configured() ? (
          <div className="mt-3">
            <NotConfigured feature="r2" />
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">Nothing published yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {visible.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-white/45">
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
  );
}
