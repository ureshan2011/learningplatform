"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";

export interface LeadRow {
  id: string;
  email: string;
  source: string;
  createdAt: number;
  signedUp: string;
  resubscribed: boolean;
}

const SOURCE_LABEL: Record<string, string> = {
  landing_hero: "Hero",
  landing_resources: "Resources",
  landing_final: "Final CTA",
  landing: "Other",
};

const SOURCE_TONE: Record<string, "accent" | "success" | "neutral"> = {
  landing_hero: "accent",
  landing_resources: "success",
  landing_final: "neutral",
};

function sourceLabel(source: string): string {
  return SOURCE_LABEL[source] ?? source;
}

const PAGE_SIZE = 25;
type SortKey = "newest" | "oldest" | "email";

/** Client-side search, filter, sort, pagination, CSV export and copy — the whole list is fetched once server-side (see the leads page), so all of this is instant with no round trip. */
export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);
  const [copied, setCopied] = useState(false);

  const sources = useMemo(() => [...new Set(leads.map((l) => l.source))], [leads]);

  const filtered = useMemo(() => {
    let rows = leads;
    if (sourceFilter !== "all") rows = rows.filter((r) => r.source === sourceFilter);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) => r.email.toLowerCase().includes(q));
    return [...rows].sort((a, b) => {
      if (sort === "newest") return b.createdAt - a.createdAt;
      if (sort === "oldest") return a.createdAt - b.createdAt;
      return a.email.localeCompare(b.email);
    });
  }, [leads, search, sourceFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  function resetAnd<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(0);
    };
  }

  function exportCsv() {
    const header = "email,source,signed_up_at\n";
    const body = filtered
      .map((r) => [csvEscape(r.email), csvEscape(sourceLabel(r.source)), new Date(r.createdAt).toISOString()].join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ict-class-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function copyEmails() {
    await navigator.clipboard.writeText(filtered.map((r) => r.email).join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (leads.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-(--color-awaken-line) bg-(--color-awaken-card) p-10 text-center">
        <Icon name="inbox" className="!text-3xl text-(--color-awaken-ink-soft)" />
        <p className="mt-3 font-semibold">No subscribers yet</p>
        <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
          Signups from the landing page&apos;s email capture forms will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <label className="relative flex-1 sm:max-w-xs">
            <span className="sr-only">Search by email</span>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 !text-lg text-(--color-awaken-ink-soft)" />
            <input
              type="text"
              value={search}
              onChange={(e) => resetAnd(setSearch)(e.target.value)}
              placeholder="Search email…"
              className="w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) py-2 pr-3 pl-9 text-sm outline-none focus:border-(--color-awaken-accent)"
            />
          </label>
          <select
            value={sourceFilter}
            onChange={(e) => resetAnd(setSourceFilter)(e.target.value)}
            className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2 text-sm outline-none focus:border-(--color-awaken-accent)"
          >
            <option value="all">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {sourceLabel(s)}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2 text-sm outline-none focus:border-(--color-awaken-accent)"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="email">Email A–Z</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyEmails}
            className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-awaken-line) px-3 py-2 text-sm font-medium hover:border-(--color-awaken-accent)/40"
          >
            <Icon name={copied ? "check_circle" : "content_copy"} className="!text-base" />
            {copied ? "Copied" : "Copy emails"}
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-3 py-2 text-sm font-semibold text-white"
          >
            <Icon name="download" className="!text-base" />
            Export CSV
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-(--color-awaken-ink-soft)">
        Showing {filtered.length === 0 ? 0 : clampedPage * PAGE_SIZE + 1}–
        {Math.min(filtered.length, clampedPage * PAGE_SIZE + PAGE_SIZE)} of {filtered.length}
        {filtered.length !== leads.length ? ` (${leads.length} total)` : ""}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 text-center text-sm text-(--color-awaken-ink-soft)">
          No subscribers match that search.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-xl border border-(--color-awaken-line)">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr>
                <Th>Email</Th>
                <Th>Source</Th>
                <Th>Signed up</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id} className="odd:bg-(--color-awaken-bg) hover:bg-(--color-awaken-accent-soft)/40">
                  <Td>
                    <span className="font-medium">{row.email}</span>
                  </Td>
                  <Td>
                    <StatusPill tone={SOURCE_TONE[row.source] ?? "neutral"}>{sourceLabel(row.source)}</StatusPill>
                  </Td>
                  <Td>
                    <span className="text-(--color-awaken-ink-soft)">
                      {row.signedUp}
                      {row.resubscribed ? <span className="ml-1.5 text-xs text-(--color-awaken-accent)">· resubscribed</span> : null}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={clampedPage === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-(--color-awaken-line) px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          >
            <Icon name="chevron_left" className="!text-base" />
            Prev
          </button>
          <span className="text-xs text-(--color-awaken-ink-soft)">
            Page {clampedPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={clampedPage >= totalPages - 1}
            className="inline-flex items-center gap-1 rounded-lg border border-(--color-awaken-line) px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          >
            Next
            <Icon name="chevron_right" className="!text-base" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-(--color-awaken-line) bg-(--color-awaken-bg) px-3 py-2 text-left text-xs font-semibold tracking-wide text-(--color-awaken-ink-soft) uppercase">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border-b border-(--color-awaken-line) px-3 py-2.5">{children}</td>;
}
