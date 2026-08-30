import "server-only";

import { adminDb, col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { colomboDateString } from "@/lib/format";
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
  const id = `${receivedAt}_${params.orderId || "unknown"}`.slice(0, 200);

  const event: PaymentEvent = {
    id,
    tenantId: publicEnv.tenantId,
    provider: "payhere",
    orderId: params.orderId ?? "",
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
 * Blank settings, so every screen has something to render before the teacher
 * has filled anything in. Every consumer treats an empty string as "not set
 * up yet" and says so rather than printing a half-empty receipt.
 */
export function emptyPaymentSettings(): PaymentSettings {
  return {
    tenantId: publicEnv.tenantId,
    businessName: "",
    ownerName: "",
    addressLine: "",
    contactPhone: "",
    contactEmail: "",
    bankName: "",
    bankBranch: "",
    accountName: "",
    accountNumber: "",
    updatedAt: 0,
  };
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
    return { ...emptyPaymentSettings(), ...(snap.data() as PaymentSettings) };
  } catch (err) {
    console.error("[payments] settings unreadable, rendering blanks", err);
    return emptyPaymentSettings();
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
