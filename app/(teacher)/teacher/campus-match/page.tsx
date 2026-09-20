import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/session";
import { Icon } from "@/components/ui/Icon";
import { CampusMatchPublishToggle } from "@/components/teacher/CampusMatchPublishToggle";
import { getCampusMatchSettings } from "@/lib/campus-match/settings";
import { campusMatchCounts } from "@/lib/campus-match/console";
import { dataFreshness, handbookCoverYear, roundSpan } from "@/lib/campus-match/data";
import { profileCodes } from "@/lib/campus-match/profiles";
import {
  ADMISSION_ROUND,
  CAMPUS_MATCH_FEE_LKR,
  CAMPUS_MATCH_NAME,
} from "@/lib/campus-match/cycle";
import { formatLKR } from "@/lib/format";
import backtest from "@/lib/content/ugc/backtest.json";

export const dynamic = "force-dynamic";

/**
 * The Campus Match console panel. English only, like the rest of the console.
 *
 * Everything the owner has to check before flipping the switch, on one screen:
 * which UGC round the figures come from, how old it is, whether the backtest
 * still meets its bars, and what has sold. The publish toggle is deliberately
 * below all of it.
 */

export default async function TeacherCampusMatchPage() {
  await requireStaffPage("/teacher/campus-match");
  const [settings, counts] = await Promise.all([getCampusMatchSettings(), campusMatchCounts()]);
  const freshness = dataFreshness();
  const span = roundSpan();

  return (
    <main className="mx-auto max-w-[900px] px-4 py-5 sm:px-6 sm:py-6">
      <Link
        href="/teacher"
        className="inline-flex items-center gap-1 text-sm text-ict-fg-soft underline"
      >
        <Icon name="arrow_back" className="!text-base" />
        Teacher console
      </Link>

      <h1 className="mt-4 flex items-center gap-2 text-2xl font-bold">
        <Icon name="school" className="text-ict-accent-fg" />
        {CAMPUS_MATCH_NAME}
      </h1>
      <p className="mt-1 text-sm text-ict-fg-soft">
        A one-payment report estimating a student&rsquo;s chance at every state university course
        their stream can apply for, in their own district, for the {ADMISSION_ROUND} round.{" "}
        {formatLKR(CAMPUS_MATCH_FEE_LKR)}, once, for the whole cycle.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Panel
          label="Newest UGC round"
          value={freshness.coverYear ?? "—"}
          hint={
            freshness.fetchedAt
              ? `Collected ${freshness.fetchedAt}, ${freshness.ageDays} days ago`
              : "Never collected"
          }
          tone={freshness.stale ? "warn" : "ok"}
        />
        <Panel
          label="Rounds behind the forecast"
          value={String(freshness.rounds)}
          hint={`${span.from ?? "—"} to ${span.to ?? "—"}`}
        />
        <Panel
          label="Reports bought"
          value={counts.bought === null ? "—" : String(counts.bought)}
          hint="Every enrollment on this product"
        />
        <Panel
          label="Outcomes told back"
          value={counts.outcomes === null ? "—" : String(counts.outcomes)}
          hint="The only real check on next cycle's forecast"
        />
      </section>

      <section className="mt-4 rounded-ict-md border border-ict-line bg-ict-surface-card p-5">
        <p className="font-semibold">Backtest</p>
        <p className="mt-1 text-sm text-ict-fg-soft">
          The method replayed against {backtest.heldOut.length} rounds it was not fitted on,{" "}
          {backtest.cells.toLocaleString()} cells. Average miss {backtest.mae} Z.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li>
            A student one sigma above the forecast was labelled Likely and cleared{" "}
            <strong>{backtest.likelyPct}%</strong> of the time — the bar is at least{" "}
            {backtest.likelyBar}%.
          </li>
          <li>
            A student 1.5 sigma below was labelled Unlikely and cleared{" "}
            <strong>{backtest.unlikelyPct}%</strong> of the time — the bar is at most{" "}
            {backtest.unlikelyBar}%.
          </li>
        </ul>
        <p className="mt-3 text-sm font-semibold">
          {backtest.passes ? "Both bars met." : "The bars are NOT met — do not put this on sale."}
        </p>
        <p className="mt-3 text-sm text-ict-fg-soft">
          The full working is in <code>lib/content/ugc/BACKTEST.md</code>, every source file and
          its hash in <code>lib/content/ugc/SOURCES.md</code>, and the data checks in{" "}
          <code>lib/content/ugc/QA.md</code>.
        </p>
      </section>

      <section className="mt-4 rounded-ict-md border border-ict-line bg-ict-surface-card p-5">
        <p className="font-semibold">Before you put it on sale</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-ict-fg-soft">
          <li>Read SOURCES.md — every figure traces to a UGC file with a hash.</li>
          <li>Read the backtest headline above; both bars have to be met.</li>
          <li>
            Open ten degree profiles and read them, Sinhala and English. There are{" "}
            {profileCodes().length}; the descriptions are ours, not the UGC&rsquo;s, and nobody
            else has checked them.
          </li>
          <li>Buy one report yourself in sandbox and check the receipt and the ledger.</li>
        </ol>
      </section>

      <div className="mt-6">
        <CampusMatchPublishToggle published={settings.published} stale={freshness.stale} />
      </div>

      <p className="mt-4 text-sm text-ict-fg-soft">
        Eligibility is summarised from the {handbookCoverYear() ?? "—"} Courses of Study handbook.
        Every student-facing screen says the figures are an estimate from published data and that
        ICT Campus is not affiliated with the UGC.
      </p>
    </main>
  );
}

function Panel({
  label,
  value,
  hint,
  tone = "ok",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="rounded-ict-md border border-ict-line bg-ict-surface-card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ict-fg-soft">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold">{value}</p>
      <p
        className={
          tone === "warn"
            ? "mt-0.5 text-sm text-ict-danger-fg"
            : "mt-0.5 text-sm text-ict-fg-soft"
        }
      >
        {hint}
      </p>
    </div>
  );
}
