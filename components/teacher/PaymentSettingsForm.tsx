"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import type { PaymentSettings } from "@/lib/types";
import { fetchWithSession } from "@/lib/auth/session-client";

const inputClass =
  "w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2.5 text-base outline-none focus:border-(--color-awaken-accent)";

type FieldName = keyof Omit<
  PaymentSettings,
  "tenantId" | "updatedAt" | "updatedBy" | "payhereMerchantSecret" | "payhereMode"
>;

const BANK_FIELDS: Array<{ name: FieldName; label: string; hint?: string; required?: boolean }> = [
  { name: "bankName", label: "Bank", hint: "e.g. Bank of Ceylon", required: true },
  { name: "bankBranch", label: "Branch" },
  { name: "accountName", label: "Account name", hint: "Exactly as the bank has it", required: true },
  { name: "accountNumber", label: "Account number", required: true },
  {
    name: "slipInstructions",
    label: "What the depositor must write",
    hint: "e.g. put your phone number in the reference field",
  },
];

const IDENTITY_FIELDS: Array<{ name: FieldName; label: string; hint?: string; required?: boolean }> = [
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

const ALL_FIELDS = [...BANK_FIELDS, ...IDENTITY_FIELDS];

/** Obvious test data, so nobody mistakes a rehearsal for the real account. */
const TEST_DETAILS: Partial<Record<FieldName, string>> = {
  bankName: "Bank of Ceylon (TEST — not a real account)",
  bankBranch: "Colombo Main",
  accountName: "ICT Campus (Sandbox Test)",
  accountNumber: "0000123456789",
  slipInstructions: "SANDBOX TEST ONLY — do not deposit real money into this account.",
  businessName: "ICT Campus (Sandbox Test)",
  ownerName: "Dr. Yasas Sri Wickramasinghe",
  addressLine: "123 Test Lane, Colombo 07",
  contactPhone: "071 000 0000",
  contactEmail: "test@example.com",
};

/**
 * The bank account students deposit into, who the receipts come from, and the
 * PayHere credentials.
 *
 * The credentials live here rather than in environment variables because
 * setting one of those on App Hosting needs Secret Manager and a command line,
 * which this platform's owner does not have — so card payments could never be
 * switched on at all. An environment variable still wins when present; this is
 * the fallback that makes the feature reachable.
 */
export function PaymentSettingsForm({
  settings,
  hasStoredSecret,
  secretFromEnv,
}: {
  settings: Omit<PaymentSettings, "payhereMerchantSecret">;
  /** Whether a secret is already saved. The secret itself is never sent to the browser. */
  hasStoredSecret: boolean;
  /** True when the deployment supplies credentials, which override anything entered here. */
  secretFromEnv: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const secret = String(form.get("payhereMerchantSecret") ?? "").trim();

    const body: Record<string, string> = Object.fromEntries(
      ALL_FIELDS.map((f) => [f.name, String(form.get(f.name) ?? "")]),
    );
    body.payhereMerchantId = String(form.get("payhereMerchantId") ?? "");
    body.payhereMode = String(form.get("payhereMode") ?? "sandbox");
    // An empty box means "leave the saved secret alone", never "erase it" —
    // otherwise every edit to a bank branch would silently turn off cards.
    if (secret) body.payhereMerchantSecret = secret;

    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetchWithSession("/api/teacher/payments/settings", {
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

  function fillTestDetails() {
    const form = formRef.current;
    if (!form) return;
    for (const [name, value] of Object.entries(TEST_DETAILS)) {
      const input = form.elements.namedItem(name);
      if (input instanceof HTMLInputElement) input.value = value;
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-6">
      <Section
        title="Where students deposit"
        note="Shown on the deposit page with one-tap copy."
        fields={BANK_FIELDS}
        settings={settings}
      />

      <Section
        title="What goes on receipts and policy pages"
        note="Also fills the blanks in your terms, privacy and refund pages."
        fields={IDENTITY_FIELDS}
        settings={settings}
      />

      <div>
        <h3 className="text-sm font-bold">Card payments (PayHere)</h3>
        <p className="mt-1 text-xs text-(--color-awaken-ink-soft)">
          {secretFromEnv
            ? "This deployment supplies PayHere credentials through its environment, and those win. Anything entered here is ignored until they are removed."
            : "Sandbox and live are separate accounts with separate credentials — sandbox ones come from sandbox.payhere.lk. Your domain must also be added and approved under Settings → Domains & Credentials in the PayHere portal, or checkout is refused."}
        </p>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">
              Merchant ID
            </span>
            <input
              name="payhereMerchantId"
              defaultValue={settings.payhereMerchantId ?? ""}
              placeholder="1220000"
              maxLength={40}
              disabled={secretFromEnv}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">
              Merchant secret
            </span>
            <input
              name="payhereMerchantSecret"
              type="password"
              autoComplete="off"
              placeholder={hasStoredSecret ? "•••••••• saved — type to replace" : "Paste it here"}
              maxLength={200}
              disabled={secretFromEnv}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-(--color-awaken-ink-soft)">
              Never shown again after saving, and never sent to a browser.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">
              Mode
            </span>
            <select
              name="payhereMode"
              defaultValue={settings.payhereMode ?? "sandbox"}
              disabled={secretFromEnv}
              className={inputClass}
            >
              <option value="sandbox">Sandbox — test cards only</option>
              <option value="live">Live — real cards are charged</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          <Icon name="save" className="!text-base" />
          {busy ? "Saving…" : "Save details"}
        </button>
        <button
          type="button"
          onClick={fillTestDetails}
          className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-awaken-line) px-4 py-2.5 text-sm font-medium hover:border-(--color-awaken-accent)/40"
        >
          <Icon name="rule" className="!text-base" />
          Fill with test details
        </button>
      </div>

      {saved ? (
        <p className="text-sm font-semibold text-(--color-awaken-success)">
          Saved. Students paying by deposit now see these details.
        </p>
      ) : null}
      {error ? <p className="text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </form>
  );
}

function Section({
  title,
  note,
  fields,
  settings,
}: {
  title: string;
  note: string;
  fields: Array<{ name: FieldName; label: string; hint?: string; required?: boolean }>;
  settings: Omit<PaymentSettings, "payhereMerchantSecret">;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="mt-1 text-xs text-(--color-awaken-ink-soft)">{note}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="block">
            <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">
              {field.label}
              {field.required ? <span className="text-(--color-awaken-danger)"> *</span> : null}
            </span>
            <input
              name={field.name}
              defaultValue={(settings[field.name] as string | undefined) ?? ""}
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
    </div>
  );
}
