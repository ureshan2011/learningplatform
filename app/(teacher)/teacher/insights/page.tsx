import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listSubjects } from "@/lib/queries";
import { formatLKR } from "@/lib/format";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import {
  getAtRiskStudents,
  getBusinessOverview,
  getSubjectBreakdown,
  getWeakTopics,
  type AtRiskStudent,
  type BusinessOverview,
  type SubjectBreakdown,
  type TopicStat,
} from "@/lib/teacher/insights";

export const dynamic = "force-dynamic";

/**
 * One section's read, falling back to `empty` if it throws — same pattern as
 * the main teacher console: a broken aggregate should degrade its own card,
 * not blank the whole page.
 */
async function section<T>(name: string, read: () => Promise<T>, empty: T): Promise<T> {
  try {
    return await read();
  } catch (err) {
    console.error(`[teacher/insights] "${name}" failed to load`, err);
    return empty;
  }
}

export default async function TeacherInsightsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  const subjects = await section("subjects", () => listSubjects(), []);

  const [overview, atRisk, weakTopics, breakdown] = await Promise.all([
    section<BusinessOverview>(
      "overview",
      () => getBusinessOverview(subjects),
      { activeStudents: 0, mrrLKR: 0, newStudentsThisMonth: 0, pendingRevenueLKR: 0, pendingSlipCount: 0 },
    ),
    section<AtRiskStudent[]>("atRisk", () => getAtRiskStudents(subjects), []),
    section<TopicStat[]>("weakTopics", () => getWeakTopics(subjects), []),
    section<SubjectBreakdown[]>("breakdown", () => getSubjectBreakdown(subjects), []),
  ]);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Link href="/teacher" className="text-sm text-(--color-awaken-ink-soft) underline">
          ← Teacher console
        </Link>

        <h1 className="mt-4 text-2xl font-bold">Insights</h1>
        <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
          What&apos;s working, who needs a nudge, and what to teach next — all from data
          students are already generating.
        </p>

        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Active students" value={String(overview.activeStudents)} />
          <StatCard label="Monthly revenue" value={formatLKR(overview.mrrLKR)} />
          <StatCard label="New this month" value={String(overview.newStudentsThisMonth)} />
          <StatCard
            label="Awaiting approval"
            value={formatLKR(overview.pendingRevenueLKR)}
            hint={overview.pendingSlipCount > 0 ? `${overview.pendingSlipCount} slip${overview.pendingSlipCount === 1 ? "" : "s"}` : undefined}
          />
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Reach out before they lapse</h2>
          <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
            Active subscriptions expiring within two weeks, quietest students first.
          </p>
          {atRisk.length === 0 ? (
            <p className="mt-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-sm text-(--color-awaken-ink-soft)">
              Nobody&apos;s renewal is coming up in the next two weeks.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {atRisk.map((s) => (
                <li
                  key={`${s.uid}_${s.subjectName}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="mt-0.5 text-sm text-(--color-awaken-ink-soft)">
                      {s.subjectName} ·{" "}
                      <span className={s.daysUntilExpiry <= 3 ? "font-medium text-(--color-awaken-danger)" : ""}>
                        renews in {s.daysUntilExpiry}d
                      </span>
                      {" · "}
                      {s.lastActiveDaysAgo === null
                        ? "never practiced"
                        : s.lastActiveDaysAgo === 0
                          ? "active today"
                          : `inactive ${s.lastActiveDaysAgo}d`}
                    </p>
                  </div>
                  {s.phone ? (
                    <WhatsAppShareButton
                      phone={s.phone}
                      text={`Hi ${s.name.split(" ")[0]}, your ${s.subjectName} class access renews in ${s.daysUntilExpiry} day${s.daysUntilExpiry === 1 ? "" : "s"} — let me know if you'd like to continue!`}
                      label="Nudge"
                      className="shrink-0 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-black"
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Teach this next</h2>
          <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
            Topics the whole cohort is struggling with, worst first — straight from Practice
            answers, not a guess.
          </p>
          {weakTopics.length === 0 ? (
            <p className="mt-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-sm text-(--color-awaken-ink-soft)">
              Not enough Practice answers yet to spot a pattern.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {weakTopics.map((t) => (
                <li
                  key={`${t.subjectId}_${t.topic}`}
                  className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium">{t.topic}</p>
                    <span className={`text-sm font-semibold ${accuracyColor(t.accuracyPct)}`}>
                      {t.accuracyPct}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-(--color-awaken-ink-soft)">
                    {t.subjectName} · {t.studentsSeen} student{t.studentsSeen === 1 ? "" : "s"} ·{" "}
                    {t.timesAnswered} answers
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-(--color-awaken-line)">
                    <div
                      className={`h-full rounded-full ${accuracyBarColor(t.accuracyPct)}`}
                      style={{ width: `${t.accuracyPct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">By subject</h2>
          {breakdown.length === 0 ? (
            <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">No subjects yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-(--color-awaken-line)">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr>
                    <Th>Subject</Th>
                    <Th>Active</Th>
                    <Th>Avg. accuracy</Th>
                    <Th>Avg. attendance</Th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((b) => (
                    <tr key={b.subjectId} className="odd:bg-(--color-awaken-bg)">
                      <Td>{b.subjectName}</Td>
                      <Td>{b.activeStudents}</Td>
                      <Td>{b.avgAccuracyPct === null ? "—" : `${b.avgAccuracyPct}%`}</Td>
                      <Td>{b.avgAttendanceScore === null ? "—" : `${b.avgAttendanceScore}%`}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
      <p className="text-xs uppercase tracking-wide text-(--color-awaken-ink-soft)">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-(--color-awaken-ink-soft)">{hint}</p> : null}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-(--color-awaken-line) bg-(--color-awaken-bg) px-3 py-2 text-left text-xs font-medium text-(--color-awaken-ink-soft)">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border-b border-(--color-awaken-line) px-3 py-2">{children}</td>;
}

function accuracyColor(pct: number): string {
  if (pct < 50) return "text-(--color-awaken-danger)";
  if (pct < 70) return "text-(--color-awaken-accent)";
  return "text-(--color-awaken-success)";
}

function accuracyBarColor(pct: number): string {
  if (pct < 50) return "bg-(--color-awaken-danger)";
  if (pct < 70) return "bg-(--color-awaken-accent)";
  return "bg-(--color-awaken-success)";
}
