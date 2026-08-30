"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { formatLKR } from "@/lib/format";
import type { LedgerRow } from "@/lib/payments/ledger";
import type { PaymentStatus } from "@/lib/types";

const STATUS_TONE: Record<PaymentStatus, string> = {
  paid: "bg-(--color-awaken-success-soft) text-(--color-awaken-success)",
  pending: "bg-(--color-awaken-warn-soft) text-(--color-awaken-warn)",
  failed: "bg-(--color-awaken-danger-soft) text-(--color-awaken-danger)",
  cancelled: "bg-(--color-awaken-bg) text-(--color-awaken-ink-soft)",
  chargeback: "bg-(--color-awaken-danger-soft) text-(--color-awaken-danger)",
  refunded: "bg-(--color-awaken-indigo-soft) text-(--color-awaken-indigo)",
};

const STATUS_TEXT: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  cancelled: "Cancelled",
  chargeback: "Chargeback",
  refunded: "Refunded",
};

/**
 * Every payment, searchable, with the two corrections a teacher ever needs to
 * make to one: mark it refunded, or take the access back.
 *
 * Filtering happens in the browser over rows the page already fetched — the
 * whole ledger arrives in one server render, so changing a filter costs
 * nothing and works on a phone with no signal to spare.
 */
export function PaymentLedger({ rows }: { rows: LedgerRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PaymentStatus>("all");
  const [month, setMonth] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const months = useMemo(
    () => [...new Set(rows.map((r) => r.dateLabel.slice(0, 7)))].sort().reverse(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (month !== "all" && !row.dateLabel.startsWith(month)) return false;
      if (!q) return true;
      return (
        row.studentName.toLowerCase().includes(q) ||
        row.studentPhone.includes(q) ||
        row.receiptNo.toLowerCase().includes(q) ||
        row.providerRef.toLowerCase().includes(q) ||
        row.bankRef.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status, month]);

  const shownTotal = filtered
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.amountLKR, 0);

  async function act(row: LedgerRow, action: "refund" | "revoke") {
    const question =
      action === "refund"
        ? `Mark ${row.studentName}'s ${formatLKR(row.amountLKR)} as refunded and end their access?`
        : `Remove ${row.studentName}'s access for ${row.subjectName}? The payment record stays.`;
    if (!window.confirm(question)) return;

    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch("/api/teacher/payments/refund", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paymentId: row.id, action, revoke: true }),
      });
      if (!res.ok) throw new Error("Could not save that. Try again.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[12rem] flex-1">
          <span className="sr-only">Search payments</span>
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3 !text-lg -translate-y-1/2 text-(--color-awaken-ink-soft)"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, phone, receipt or reference…"
            className="w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) py-2.5 pr-3 pl-10 text-sm outline-none focus:border-(--color-awaken-accent)"
          />
        </label>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | PaymentStatus)}
          className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2.5 text-sm"
        >
          <option value="all">Every status</option>
          {(Object.keys(STATUS_TEXT) as PaymentStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_TEXT[s]}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2.5 text-sm"
        >
          <option value="all">Every month</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <a
          href="/api/teacher/payments/export"
          className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-awaken-line) px-3 py-2.5 text-sm font-semibold hover:border-(--color-awaken-accent)/40"
        >
          <Icon name="download" className="!text-base" />
          CSV
        </a>
      </div>

      <p className="mt-2 text-xs text-(--color-awaken-ink-soft)">
        Showing <strong className="text-(--color-awaken-ink)">{filtered.length}</strong> of{" "}
        {rows.length} payments · paid in this view:{" "}
        <strong className="text-(--color-awaken-ink)">{formatLKR(shownTotal)}</strong>
      </p>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-(--color-awaken-line) p-6 text-center text-sm text-(--color-awaken-ink-soft)">
          No payments match that.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {filtered.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{row.studentName}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_TONE[row.status]}`}
                    >
                      {STATUS_TEXT[row.status]}
                    </span>
                    {row.accessRevoked ? (
                      <span className="rounded-full bg-(--color-awaken-danger-soft) px-2 py-0.5 text-[11px] font-bold text-(--color-awaken-danger)">
                        Access removed
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
                    {row.dateLabel} · {row.subjectName} · {row.method}
                  </p>
                  <p className="mt-0.5 text-xs text-(--color-awaken-ink-soft)">
                    {row.receiptNo ? `Receipt ${row.receiptNo}` : "No receipt number"}
                    {row.studentPhone ? ` · ${row.studentPhone}` : ""}
                    {row.providerRef ? ` · ref ${row.providerRef}` : ""}
                    {row.bankRef ? ` · bank ${row.bankRef}` : ""}
                  </p>
                  {row.note ? (
                    <p className="mt-1 text-xs text-(--color-awaken-ink-soft) italic">{row.note}</p>
                  ) : null}
                </div>
                <p className="shrink-0 text-lg font-bold text-(--color-awaken-accent)">
                  {formatLKR(row.amountLKR)}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-(--color-awaken-line) pt-3 text-sm">
                {row.receiptNo ? (
                  <Link
                    href={`/receipt/${row.id}`}
                    className="inline-flex items-center gap-1 font-medium text-(--color-awaken-deep) underline"
                  >
                    <Icon name="receipt_long" className="!text-base" />
                    Receipt
                  </Link>
                ) : null}
                {row.slipUrl ? (
                  <a
                    href={row.slipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-(--color-awaken-deep) underline"
                  >
                    <Icon name="image" className="!text-base" />
                    Slip
                  </a>
                ) : null}
                {row.status === "paid" || row.status === "chargeback" ? (
                  <div className="ml-auto flex gap-2">
                    {!row.accessRevoked ? (
                      <button
                        onClick={() => act(row, "revoke")}
                        disabled={busyId === row.id}
                        className="rounded-lg border border-(--color-awaken-line) px-3 py-1.5 text-xs font-medium hover:border-(--color-awaken-danger)/40 hover:text-(--color-awaken-danger) disabled:opacity-50"
                      >
                        Remove access
                      </button>
                    ) : null}
                    <button
                      onClick={() => act(row, "refund")}
                      disabled={busyId === row.id}
                      className="rounded-lg border border-(--color-awaken-line) px-3 py-1.5 text-xs font-medium hover:border-(--color-awaken-danger)/40 hover:text-(--color-awaken-danger) disabled:opacity-50"
                    >
                      Mark refunded
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="mt-2 text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </div>
  );
}
