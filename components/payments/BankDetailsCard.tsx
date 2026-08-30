"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Where to deposit, in a form a student can act on from a phone at a bank
 * counter or inside a banking app.
 *
 * Every field is one tap to copy, because the alternative is retyping an
 * account number from a screenshot — which is how tuition payments end up in
 * a stranger's account.
 */
export function BankDetailsCard({
  bankName,
  bankBranch,
  accountName,
  accountNumber,
  amount,
  reference,
  instructions,
}: {
  bankName: string;
  bankBranch: string;
  accountName: string;
  accountNumber: string;
  amount: string;
  /** What the student should put in the bank's reference field — their phone number. */
  reference: string;
  instructions?: string;
}) {
  return (
    <div className="rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-5">
      <p className="flex items-center gap-2 font-semibold text-(--color-awaken-accent)">
        <Icon name="account_balance" className="!text-lg" />
        Deposit to this account
      </p>

      <dl className="mt-3 space-y-2">
        <CopyRow label="Bank" value={bankBranch ? `${bankName} — ${bankBranch}` : bankName} />
        <CopyRow label="Account name" value={accountName} />
        <CopyRow label="Account number" value={accountNumber} emphasise />
        <CopyRow label="Amount" value={amount} emphasise />
        <CopyRow label="Reference to write" value={reference} />
      </dl>

      <p className="mt-3 text-xs text-(--color-awaken-ink-soft)">
        {instructions ||
          "Write your phone number as the reference so your payment can be matched to your account."}
      </p>
    </div>
  );
}

function CopyRow({
  label,
  value,
  emphasise,
}: {
  label: string;
  value: string;
  emphasise?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard is blocked in some in-app browsers. The value is on screen
      // either way, so this is a convenience failing, not the feature.
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-(--color-awaken-card) px-3 py-2">
      <div className="min-w-0">
        <dt className="text-xs text-(--color-awaken-ink-soft)">{label}</dt>
        <dd className={`truncate ${emphasise ? "text-base font-bold" : "text-sm font-medium"}`}>
          {value}
        </dd>
      </div>
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-(--color-awaken-line) px-2.5 py-1.5 text-xs font-semibold hover:border-(--color-awaken-accent)/40"
      >
        <Icon name={copied ? "check_circle" : "content_copy"} className="!text-sm" />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
