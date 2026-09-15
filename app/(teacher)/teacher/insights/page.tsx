import { requireStaffPage } from "@/lib/auth/session";
import { listSubjects } from "@/lib/queries";
import { formatLKR } from "@/lib/format";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, StatCard } from "@/components/ds";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  getAtRiskStudents,
  getBusinessOverview,
  getHowHeardBreakdown,
  getSubjectBreakdown,
  getWeakTopics,
  type AtRiskStudent,
  type BusinessOverview,
  type HowHeardBreakdown,
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
  // Gate only — the app shell renders who is signed in.
  await requireStaffPage("/teacher/insights");

  const subjects = await section("subjects", () => listSubjects(), []);

  const [overview, atRisk, weakTopics, breakdown, howHeard] = await Promise.all([
    section<BusinessOverview>(
      "overview",
      () => getBusinessOverview(subjects),
      { activeStudents: 0, mrrLKR: 0, newStudentsThisMonth: 0, pendingRevenueLKR: 0, pendingSlipCount: 0 },
    ),
    section<AtRiskStudent[]>("atRisk", () => getAtRiskStudents(subjects), []),
    section<TopicStat[]>("weakTopics", () => getWeakTopics(subjects), []),
    section<SubjectBreakdown[]>("breakdown", () => getSubjectBreakdown(subjects), []),
    section<HowHeardBreakdown>("howHeard", () => getHowHeardBreakdown(), {
      answered: 0,
      notAnswered: 0,
      totalStudents: 0,
      bySource: [],
    }),
  ]);

  return (
      <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6">
        <PageHeader
          eyebrow="Teacher console"
          title="Insights"
          subtitle="What's working, who needs a nudge, and what to teach next — from data students are already generating."
        />

        <section className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard icon="group" label="Active students" value={overview.activeStudents} />
          <StatCard icon="payments" label="Monthly revenue" value={formatLKR(overview.mrrLKR)} tone="success" />
          <StatCard icon="bolt" label="New this month" value={overview.newStudentsThisMonth} tone="brand" />
          <StatCard
            icon="receipt_long"
            label="Awaiting approval"
            value={formatLKR(overview.pendingRevenueLKR)}
            hint={overview.pendingSlipCount > 0 ? `${overview.pendingSlipCount} slip${overview.pendingSlipCount === 1 ? "" : "s"}` : undefined}
            tone={overview.pendingSlipCount > 0 ? "warning" : "neutral"}
          />
        </section>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="chat" className="text-(--color-awaken-accent)" />
            Reach out before they lapse
          </h2>
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
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="quiz" className="text-(--color-awaken-accent)" />
            Teach this next
          </h2>
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
                  <div className="mt-2">
                    <ProgressBar percent={t.accuracyPct} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="search" className="text-(--color-awaken-accent)" />
            How students found us
          </h2>
          <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
            {howHeard.totalStudents === 0
              ? "No students yet."
              : `${howHeard.answered} of ${howHeard.totalStudents} students answered the sign-up question, asked once, the first time they sign in.`}
          </p>
          {howHeard.answered === 0 ? (
            <p className="mt-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-sm text-(--color-awaken-ink-soft)">
              Nobody has answered yet — it only shows up for students who sign up from now on.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {howHeard.bySource
                .filter((s) => s.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((s) => (
                  <li
                    key={s.source}
                    className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium">{s.label}</p>
                      <span className="text-sm font-semibold text-(--color-awaken-accent)">
                        {s.count} · {s.pct}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <ShareBar percent={s.pct} />
                    </div>
                  </li>
                ))}
              {howHeard.notAnswered > 0 ? (
                <li className="flex items-center justify-between gap-2 px-1 text-xs text-(--color-awaken-ink-soft)">
                  <span>Skipped or from before this question existed</span>
                  <span>{howHeard.notAnswered}</span>
                </li>
              ) : null}
            </ul>
          )}
        </section>

        <section className="mt-10 pb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="auto_stories" className="text-(--color-awaken-accent)" />
            By subject
          </h2>
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

/**
 * A share-of-total bar, deliberately one flat colour — unlike `ProgressBar`,
 * a bigger slice of "how students found us" is not a better or worse result,
 * so the red/amber/green accuracy scale next to it would read as a
 * judgement this number was never making.
 */
function ShareBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-awaken-line)">
      <div
        className="h-full rounded-full bg-(--color-awaken-accent) transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function accuracyColor(pct: number): string {
  if (pct < 50) return "text-(--color-awaken-danger)";
  if (pct < 70) return "text-(--color-awaken-accent)";
  return "text-(--color-awaken-success)";
}
