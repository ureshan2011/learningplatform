import type { PaymentSettings } from "@/lib/types";

/** Every field a teacher can type into Teacher → Payments — bank details plus receipt/policy identity. */
export type SettableField = keyof Omit<
  PaymentSettings,
  "tenantId" | "updatedAt" | "updatedBy" | "payhereMerchantSecret" | "payhereMode"
>;

/**
 * The exact strings the "Fill with test details" button writes into the
 * form, for rehearsing the PayHere sandbox notification flow
 * (`/api/teacher/payments/simulate`) without a real bank account on file.
 *
 * Deliberately not just documentation: `lib/payments/records.ts` compares
 * a saved settings document against these values so that if this button
 * was ever clicked and "Save details" pressed for real — which happened at
 * least once — the public policy pages, receipts and the deposit page fall
 * back to the real identity below instead of quietly printing "071 000
 * 0000" and "test@example.com" as if they were genuine.
 */
export const SANDBOX_TEST_VALUES: Partial<Record<SettableField, string>> = {
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

/** True if any of the given settings' fields still hold a sandbox test value, e.g. because "Fill with test details" was saved for real. */
export function looksLikeSandboxTestData(settings: Partial<Record<SettableField, string>>): boolean {
  return (Object.keys(SANDBOX_TEST_VALUES) as SettableField[]).some(
    (field) => settings[field] !== undefined && settings[field] === SANDBOX_TEST_VALUES[field],
  );
}
