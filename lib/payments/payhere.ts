import "server-only";

import { createHash } from "node:crypto";
import { publicEnv, requireServerEnv } from "@/lib/env";

/**
 * PayHere integration — one-time monthly checkout.
 *
 * We are deliberately NOT using PayHere's Recurring API yet: it requires their
 * PLUS plan (~Rs 3,990/month) or PREMIUM (~Rs 9,990/month), which is not worth
 * paying before there is monthly revenue to cover it. Until then a student pays
 * once a month from a reminder, and `lib/payments/entitlements.ts` extends the
 * period. Switching to auto-renewal later changes this file and nothing else.
 *
 * Verify current fees and plan tiers before enabling live mode — PayHere
 * changes them.
 */

export const PAYHERE_CHECKOUT_URL = {
  sandbox: "https://sandbox.payhere.lk/pay/checkout",
  live: "https://www.payhere.lk/pay/checkout",
} as const;

export function checkoutUrl(): string {
  return PAYHERE_CHECKOUT_URL[publicEnv.payhere.mode];
}

function md5Upper(value: string): string {
  return createHash("md5").update(value).digest("hex").toUpperCase();
}

/** PayHere hashes the amount exactly as displayed: two decimals, no separators. */
export function formatAmount(amountLKR: number): string {
  return amountLKR.toFixed(2);
}

export interface CheckoutFields {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: "LKR";
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
  custom_1: string;
  custom_2: string;
}

/**
 * Builds the signed field set for the PayHere checkout form.
 *
 * The merchant secret is hashed server-side and never reaches the browser —
 * only the resulting `hash` does, which is why this must stay on the server.
 */
export function buildCheckoutFields(params: {
  orderId: string;
  amountLKR: number;
  itemName: string;
  studentName: string;
  phone: string;
  email?: string;
  /** Echoed back by the webhook — how we tie a payment to a student and subject. */
  uid: string;
  subjectId: string;
}): CheckoutFields {
  const merchantId = requireServerEnv("NEXT_PUBLIC_PAYHERE_MERCHANT_ID");
  const merchantSecret = requireServerEnv("PAYHERE_MERCHANT_SECRET");
  const amount = formatAmount(params.amountLKR);
  const base = publicEnv.appUrl;

  const hash = md5Upper(
    merchantId + params.orderId + amount + "LKR" + md5Upper(merchantSecret),
  );

  const [firstName, ...rest] = params.studentName.trim().split(/\s+/);

  return {
    merchant_id: merchantId,
    return_url: `${base}/payments/success?order=${encodeURIComponent(params.orderId)}`,
    cancel_url: `${base}/payments/cancelled`,
    notify_url: `${base}/api/payments/payhere/notify`,
    order_id: params.orderId,
    items: params.itemName,
    currency: "LKR",
    amount,
    first_name: firstName || "Student",
    last_name: rest.join(" ") || "-",
    // PayHere requires a syntactically valid email. Most A/L students do not
    // have one, so we synthesise a non-routable address from the phone number.
    email: params.email || `${params.phone.replace(/\D/g, "")}@students.invalid`,
    phone: params.phone,
    address: "-",
    city: "Colombo",
    country: "Sri Lanka",
    hash,
    custom_1: params.uid,
    custom_2: params.subjectId,
  };
}

/** PayHere status codes from the server-to-server notification. */
export const PAYHERE_STATUS = {
  SUCCESS: "2",
  PENDING: "0",
  CANCELLED: "-1",
  FAILED: "-2",
  CHARGEDBACK: "-3",
} as const;

export interface NotifyPayload {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  /** "VISA", "MASTER", "AMEX", "EZCASH", ... — recorded for reconciliation. */
  method?: string;
  custom_1?: string;
  custom_2?: string;
}

/**
 * Verifies the notification actually came from PayHere.
 *
 * This is the security boundary for the entire payment system: without it,
 * anyone who can POST to the notify URL could grant themselves a free year.
 * Never trust `status_code` before this returns true.
 */
export function verifyNotification(payload: NotifyPayload): boolean {
  const merchantId = requireServerEnv("NEXT_PUBLIC_PAYHERE_MERCHANT_ID");
  const merchantSecret = requireServerEnv("PAYHERE_MERCHANT_SECRET");

  if (payload.merchant_id !== merchantId) return false;

  const expected = md5Upper(
    payload.merchant_id +
      payload.order_id +
      payload.payhere_amount +
      payload.payhere_currency +
      payload.status_code +
      md5Upper(merchantSecret),
  );

  return timingSafeEqualHex(expected, (payload.md5sig ?? "").toUpperCase());
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * A fresh order id for one checkout attempt.
 *
 * One id per *attempt*, not per month. An earlier version embedded the billing
 * month, which read as neat idempotency and was in fact a way to lose money:
 * a student paying twice in one calendar month — renewing early, or a card
 * that failed and was retried after the first attempt had already succeeded —
 * produced the same id, so the second notification matched an order already
 * marked paid, was dismissed as a duplicate, and bought nothing. They were
 * charged and got no month.
 *
 * Duplicate *notifications* stay harmless without that trick: PayHere sends
 * the same order id when it retries, so the handler still finds a paid order
 * and stops. Each attempt getting its own document is also what an accountant
 * expects — one row per movement of money.
 */
export function buildOrderId(uid: string, subjectId: string, at: number = Date.now()): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${uid.slice(0, 8)}-${subjectId}-${at.toString(36)}${suffix}`;
}
