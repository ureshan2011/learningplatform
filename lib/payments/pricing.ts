import type { Subject } from "@/lib/types";

/**
 * What a subject costs, in one place.
 *
 * `Subject.priceLKR` is a *monthly* fee and `Subject.cohort.feeLKR` is a
 * one-off programme fee, so every screen and route that shows or charges a
 * price has to pick the right one. That choice was starting to appear
 * independently in the checkout, the slip route, the deposit screen and the
 * teacher's manual-payment form — four copies of a rule whose failure mode is
 * either billing Rs 0 or billing a Rs 30,000 course every month.
 *
 * Pure and dependency-free on purpose: server routes and client components
 * both need it.
 */

/** The amount to charge or display for this subject. */
export function payableLKR(subject: Subject): number {
  return subject.cohort ? subject.cohort.feeLKR : subject.priceLKR;
}

/**
 * How to describe that amount.
 *
 * A cohort is bought once, so "per month" beside its fee is not a wording
 * slip — it tells a parent they owe Rs 30,000 a month.
 */
export function billingLabel(subject: Subject): "per month" | "one payment" {
  return subject.cohort ? "one payment" : "per month";
}
