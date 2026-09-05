import { col } from "@/lib/firebase/admin";
import { requireStaffPage } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/ds";
import { LeadsTable, type LeadRow } from "@/components/teacher/LeadsTable";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

/** How many lead documents to pull before narrowing in memory — same reasoning as lib/queries.ts: a single-field orderBy needs no composite index, a tenantId equality alongside it would. */
const SCAN_WINDOW = 2000;
const DAY_MS = 24 * 60 * 60 * 1000;

export default async function TeacherLeadsPage() {
  // Gate only — the app shell renders who is signed in.
  await requireStaffPage("/teacher/leads");

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
      <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6">
        <PageHeader
          eyebrow="Teacher console"
          title="Subscribers"
          subtitle="Emails captured from the free content hub on the landing page."
        />

        <div className="mt-5 grid grid-cols-3 gap-2">
          <StatCard icon="group" label="Total" value={leads.length} />
          <StatCard
            icon="bolt"
            label="This week"
            value={newThisWeek}
            tone={newThisWeek > 0 ? "success" : "neutral"}
          />
          <StatCard icon="notifications_active" label="Today" value={newToday} />
        </div>

        <LeadsTable leads={rows} />
      </main>
  );
}

async function allLeads(): Promise<Lead[]> {
  const snap = await col.leads().orderBy("createdAt", "desc").limit(SCAN_WINDOW).get();
  return snap.docs.map((d) => d.data() as Lead).filter((l) => l.tenantId === publicEnv.tenantId);
}
