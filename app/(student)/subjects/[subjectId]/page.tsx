import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSubject, listContent } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { formatDate } from "@/lib/format";
import { DownloadButton } from "@/components/content/DownloadButton";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { TopBar } from "@/components/ui/TopBar";
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
    <main className="min-h-dvh">
      <TopBar back={{ href: "/dashboard", label: "Dashboard" }} />

      <div className="mx-auto max-w-3xl px-5 py-8">
        <div className="rise-in">
          <h1 className="text-display text-2xl">{subject.name}</h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">{subject.description}</p>
        </div>

        {!access.allowed ? (
          <div className="surface mt-6 border-(--color-brand)/25 bg-(--color-brand)/[0.08] p-4 text-sm">
            <p className="font-medium text-(--color-brand)">
              {access.reason === "expired"
                ? "Your subscription has ended."
                : "You are not enrolled in this subject."}
            </p>
            <p className="mt-1 text-(--color-text-muted)">
              {items.length - visible.length} more resources unlock when you subscribe.
            </p>
            <a href="/dashboard" className="btn btn-primary btn-sm mt-3">
              Subscribe
            </a>
          </div>
        ) : null}

        <section className="mt-8">
          <h2 className="text-title text-lg">Notes &amp; past papers</h2>
          {!r2Configured() ? (
            <div className="mt-3">
              <NotConfigured feature="r2" />
            </div>
          ) : visible.length === 0 ? (
            <p className="mt-3 text-sm text-(--color-text-faint)">Nothing published yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {visible.map((item) => (
                <li key={item.id} className="surface surface-interactive flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-(--color-text-faint)">
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
      </div>
    </main>
  );
}
