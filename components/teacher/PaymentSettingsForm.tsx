"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import type { PaymentSettings } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2.5 text-base outline-none focus:border-(--color-awaken-accent)";

const FIELDS: Array<{
  name: keyof Omit<PaymentSettings, "tenantId" | "updatedAt" | "updatedBy">;
  label: string;
  hint?: string;
  required?: boolean;
}> = [
  { name: "bankName", label: "Bank", hint: "e.g. Bank of Ceylon", required: true },
  { name: "bankBranch", label: "Branch" },
  { name: "accountName", label: "Account name", hint: "Exactly as the bank has it", required: true },
  { name: "accountNumber", label: "Account number", required: true },
  {
    name: "slipInstructions",
    label: "What the depositor must write",
    hint: "e.g. put your phone number in the reference field",
  },
  {
    name: "businessName",
    label: "Name on receipts",
    hint: "Your registered business name, or your own name if you have not registered one",
    required: true,
  },
  { name: "ownerName", label: "Your name" },
  { name: "addressLine", label: "Address on receipts" },
  { name: "contactPhone", label: "Contact phone" },
  { name: "contactEmail", label: "Contact email" },
  { name: "brNumber", label: "Business registration no.", hint: "Leave blank until you have one" },
  { name: "taxId", label: "TIN", hint: "Taxpayer Identification Number, if registered" },
];

/**
 * The bank account students deposit into, and the identity printed on
 * receipts.
 *
 * Until the bank fields are filled in, the deposit-slip page has nothing to
 * tell a student to pay into — so this form is the first thing the payments
 * page asks for, and it says so loudly when it is empty.
 */
export function PaymentSettingsForm({ settings }: { settings: PaymentSettings }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(
      FIELDS.map((f) => [f.name, String(form.get(f.name) ?? "")]),
    );

    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/teacher/payments/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Could not save. Try again.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.name} className="block">
            <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">
              {field.label}
              {field.required ? <span className="text-(--color-awaken-danger)"> *</span> : null}
            </span>
            <input
              name={field.name}
              defaultValue={settings[field.name] ?? ""}
              required={field.required}
              maxLength={300}
              className={inputClass}
            />
            {field.hint ? (
              <span className="mt-1 block text-xs text-(--color-awaken-ink-soft)">{field.hint}</span>
            ) : null}
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        <Icon name="save" className="!text-base" />
        {busy ? "Saving…" : "Save details"}
      </button>

      {saved ? (
        <p className="text-sm font-semibold text-(--color-awaken-success)">
          Saved. Students paying by deposit now see these details.
        </p>
      ) : null}
      {error ? <p className="text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </form>
  );
}
