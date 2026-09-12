import "server-only";

import { adminDb, col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { colomboDateString } from "@/lib/format";
import { safeOrderId } from "@/lib/payments/payhere";
import { SANDBOX_TEST_VALUES } from "@/lib/payments/sandbox-test-values";
import type { Payment, PaymentEvent, PaymentSettings } from "@/lib/types";

/**
 * The bookkeeping side of payments: receipt numbers, the settings printed on a
 * receipt, and the raw evidence behind every decision.
 *
 * Kept apart from `entitlements.ts` on purpose. That file answers "may this
 * student into the class"; this one answers "what happened, when, for how
 * much, and can I prove it" — the question an accountant, an auditor or a
 * parent disputing a charge actually asks.
 */

const SETTINGS_DOC = "payments";

/**
 * Issues the next receipt number in this year's series, e.g. "ICT-2026-0007".
 *
 * A transaction, because two students paying in the same second must not be
 * handed the same number: duplicate receipt numbers are the one bookkeeping
 * error that cannot be untangled afterwards. The series restarts each calendar
 * year, which is how Sri Lankan books are normally kept.
 */
export async function nextReceiptNo(at: number = Date.now()): Promise<string> {
  const year = colomboDateString(at).slice(0, 4);
  const ref = col.counters().doc(`receipts-${year}`);

  const value = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const next = ((snap.data()?.next as number | undefined) ?? 0) + 1;
    tx.set(ref, { next, updatedAt: at }, { merge: true });
    return next;
  });

  return `ICT-${year}-${String(value).padStart(4, "0")}`;
}

/**
 * Fields to write when a payment becomes paid, receipt number included.
 *
 * Idempotent by design: a payment that already carries a receipt number keeps
 * it, so a repeated webhook can never issue a second number for one payment.
 */
export async function paidPatch(
  payment: Payment,
  at: number = Date.now(),
): Promise<Partial<Payment>> {
  return {
    status: "paid",
    paidAt: payment.paidAt ?? at,
    receiptNo: payment.receiptNo ?? (await nextReceiptNo(at)),
    updatedAt: at,
  };
}

/**
 * Records one provider notification exactly as it arrived.
 *
 * Never throws into the caller: an audit write failing must not stop a
 * student's class from unlocking. A missing log line is recoverable; a paid
 * student locked out is not.
 */
export async function logPaymentEvent(params: {
  orderId: string;
  outcome: string;
  raw: Record<string, string>;
}): Promise<void> {
  const receivedAt = Date.now();
  // Sanitised at the sink as well as at the caller. The order id reaching here
  // came off an open endpoint, and this is the line that turns it into a
  // document path — see `safeOrderId` for what a slash would otherwise do.
  const orderId = safeOrderId(params.orderId ?? "");
  const id = `${receivedAt}_${orderId || "unknown"}`.slice(0, 200);

  const event: PaymentEvent = {
    id,
    tenantId: publicEnv.tenantId,
    provider: "payhere",
    orderId,
    outcome: params.outcome,
    raw: params.raw,
    receivedAt,
    ...(params.raw.status_code ? { statusCode: params.raw.status_code } : {}),
    ...(params.raw.payhere_amount ? { amount: params.raw.payhere_amount } : {}),
    ...(params.raw.payhere_currency ? { currency: params.raw.payhere_currency } : {}),
    ...(params.raw.payment_id ? { providerRef: params.raw.payment_id } : {}),
  };

  try {
    await col.paymentEvents().doc(id).set(event);
  } catch (err) {
    console.error("[payments] could not write audit event", err);
  }
}

/** The most recent provider notifications, newest first — the console's self-test panel. */
export async function listPaymentEvents(limit = 20): Promise<PaymentEvent[]> {
  const snap = await col.paymentEvents().orderBy("receivedAt", "desc").limit(limit).get();
  return snap.docs
    .map((d) => d.data() as PaymentEvent)
    .filter((e) => e.tenantId === publicEnv.tenantId);
}

/**
 * Default settings, so every screen has something real to render before the
 * teacher has opened Teacher → Payments and saved anything. The identity
 * fields below are the actual details the owner operates under — a sole
 * individual with no registered business, so `businessName` carries his own
 * name rather than a trade name (see the "Name on receipts" field's own
 * hint in `PaymentSettingsForm`). Bank details are left blank on purpose:
 * only the owner should ever type in an account number, and a wrong one
 * here would misdirect real money.
 *
 * These are still overridden field-by-field the moment a real
 * `settings/payments` document exists (see `getPaymentSettings` below), so
 * saving the form once — even unchanged — moves the source of truth from
 * this fallback into Firestore, editable from a phone from then on.
 */
export function emptyPaymentSettings(): PaymentSettings {
  return {
    tenantId: publicEnv.tenantId,
    businessName: "Dr. Yasas Sri Wickramasinghe",
    ownerName: "",
    addressLine: "67/5, Ganemulla Road, Ihala Karagahamuna, Kadawatha 11850",
    contactPhone: "0768666603",
    contactEmail: "yasassriofficial@gmail.com",
    bankName: "",
    bankBranch: "",
    accountName: "",
    accountNumber: "",
    bankSlipEnabled: false,
    updatedAt: 0,
  };
}

/** True once the teacher has explicitly switched bank-slip payment back on. */
export function isBankSlipEnabled(settings: PaymentSettings): boolean {
  return settings.bankSlipEnabled === true;
}

/**
 * Never throws.
 *
 * The public policy pages print these details and are prerendered at build
 * time, where there are no Firebase credentials at all — and a privacy policy
 * that 500s because a bank account has not been entered yet is worse than one
 * with a blank in it. Blanks are visible on the page, so nothing hides.
 */
export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    const snap = await col.settings().doc(SETTINGS_DOC).get();
    if (!snap.exists) return emptyPaymentSettings();
    return withFallbacksForBlanks(snap.data() as PaymentSettings);
  } catch (err) {
    console.error("[payments] settings unreadable, rendering blanks", err);
    return emptyPaymentSettings();
  }
}

/** Every optional/required text field on PaymentSettings — see withFallbacksForBlanks. */
const TEXT_FIELDS: Array<keyof PaymentSettings> = [
  "businessName",
  "ownerName",
  "addressLine",
  "contactPhone",
  "contactEmail",
  "brNumber",
  "taxId",
  "bankName",
  "bankBranch",
  "accountName",
  "accountNumber",
  "slipInstructions",
];

/**
 * Overlays a saved settings document onto the defaults, field by field,
 * treating a blank *or a leftover sandbox test value* as "not really set"
 * rather than "explicitly typed in". Two real cases this covers:
 *
 * 1. A document exists for some other reason (say, PayHere credentials were
 *    saved once) but has never had, e.g., `addressLine` typed into it — a
 *    blind spread would print that empty string on a public page instead of
 *    the fallback identity below.
 * 2. Someone clicked "Fill with test details" on the Payments console (to
 *    rehearse the PayHere sandbox flow) and then saved the form — which
 *    happened at least once, and put literal strings like "071 000 0000"
 *    and "test@example.com" onto the live Terms, Privacy, Refund and
 *    Contact pages, and onto real receipts. `SANDBOX_TEST_VALUES` is the
 *    exact set of strings that button writes, shared with
 *    `PaymentSettingsForm`, so a value that matches one exactly is treated
 *    the same as blank rather than displayed as if it were real.
 */
function withFallbacksForBlanks(saved: PaymentSettings): PaymentSettings {
  const defaults = emptyPaymentSettings();
  const merged: PaymentSettings = { ...defaults, ...saved };
  for (const field of TEXT_FIELDS) {
    restoreIfBlankOrTestValue(merged, defaults, field);
  }
  return merged;
}

function restoreIfBlankOrTestValue<K extends keyof PaymentSettings>(
  merged: PaymentSettings,
  defaults: PaymentSettings,
  field: K,
): void {
  const value = merged[field];
  const sandboxValue = (SANDBOX_TEST_VALUES as Partial<Record<keyof PaymentSettings, string>>)[field];
  if (value === "" || (sandboxValue !== undefined && value === sandboxValue)) {
    merged[field] = defaults[field];
  }
}

export async function savePaymentSettings(
  settings: Omit<PaymentSettings, "tenantId" | "updatedAt">,
  updatedBy: string,
): Promise<void> {
  await col.settings().doc(SETTINGS_DOC).set(
    {
      ...settings,
      tenantId: publicEnv.tenantId,
      updatedAt: Date.now(),
      updatedBy,
    },
    { merge: true },
  );
}

export interface PayHereConfig {
  merchantId: string;
  merchantSecret: string;
  mode: "sandbox" | "live";
  /** Where the credentials came from, so the console can say which it is using. */
  source: "env" | "console" | "none";
  configured: boolean;
}

/**
 * The PayHere credentials in force, from the environment if deployed there and
 * otherwise from the console.
 *
 * Environment wins deliberately: a deployment that has been given a real
 * secret through Secret Manager should not be overridable by anyone who can
 * reach the teacher console.
 */
export async function getPayHereConfig(): Promise<PayHereConfig> {
  const envId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID?.trim();
  const envSecret = process.env.PAYHERE_MERCHANT_SECRET?.trim();
  const envMode = process.env.NEXT_PUBLIC_PAYHERE_MODE === "live" ? "live" : "sandbox";

  if (envId && envSecret) {
    return {
      merchantId: envId,
      merchantSecret: envSecret,
      mode: envMode,
      source: "env",
      configured: true,
    };
  }

  const settings = await getPaymentSettings();
  const id = settings.payhereMerchantId?.trim() ?? "";
  const secret = settings.payhereMerchantSecret?.trim() ?? "";

  return {
    merchantId: id,
    merchantSecret: secret,
    mode: settings.payhereMode === "live" ? "live" : "sandbox",
    source: id && secret ? "console" : "none",
    configured: Boolean(id && secret),
  };
}

/** True once a student could actually deposit money — every bank field is filled in. */
export function bankDetailsReady(settings: PaymentSettings): boolean {
  return Boolean(
    settings.bankName && settings.accountName && settings.accountNumber,
  );
}
