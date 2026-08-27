import Link from "next/link";
import { redirect } from "next/navigation";
import { col } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { StatTile } from "@/components/ui/StatTile";
import { LeadsTable, type LeadRow } from "@/components/teacher/LeadsTable";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

/** How many lead documents to pull before narrowing in memory — same reasoning as lib/queries.ts: a single-field orderBy needs no composite index, a tenantId equality alongside it would. */
const SCAN_WINDOW = 2000;
const DAY_MS = 24 * 60 * 60 * 1000;

export default async function TeacherLeadsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  const leads = await allLeads();

  // eslint-disable-next-line react-hooks/purity -- server component, one render per request
  const now = Date.now();
  const newToday = leads.filter((l) => now - l.createdAt < DAY_MS).length;
  const newThisWeek = leads.filter((l) => now - l.createdAt < 7 * DAY_MS).length;

  const rows: LeadRow[] = leads.map((l) => ({
    id: l.id,
    email: l.email,
    source: l.source,
    createdAt: l.createdAt,
    signedUp: formatDate(l.createdAt),
    resubscribed: l.updatedAt > l.createdAt,
  }));

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Link href="/teacher" className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline">
          <Icon name="arrow_back" className="!text-base" />
          Teacher console
        </Link>

        <h1 className="mt-4 flex items-center gap-2 text-2xl font-bold">
          <Icon name="mail" className="text-(--color-awaken-accent)" />
          Subscribers
        </h1>
        <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
          Emails captured from the free content hub on the landing page.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatTile icon="group" label="Total subscribers" value={leads.length} tone="accent" />
          <StatTile icon="bolt" label="New this week" value={newThisWeek} tone={newThisWeek > 0 ? "success" : "default"} />
          <StatTile icon="notifications_active" label="New today" value={newToday} />
        </div>

        <LeadsTable leads={rows} />
      </main>
    </>
  );
}

async function allLeads(): Promise<Lead[]> {
  const snap = await col.leads().orderBy("createdAt", "desc").limit(SCAN_WINDOW).get();
  return snap.docs.map((d) => d.data() as Lead).filter((l) => l.tenantId === publicEnv.tenantId);
}
