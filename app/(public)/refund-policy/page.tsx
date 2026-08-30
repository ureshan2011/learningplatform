import type { Metadata } from "next";
import { getPaymentSettings } from "@/lib/payments/records";
import { Blank, Clause, PolicyPage } from "@/components/legal/PolicyPage";
import { FREE_TRIAL_DAYS } from "@/lib/payments/entitlements";

export const metadata: Metadata = {
  title: "Refund & cancellation policy",
  description:
    "When ICT Campus refunds a class fee, how to ask for one, how long it takes, and how cancelling works — there is no automatic renewal.",
};

export const revalidate = 300;

export default async function RefundPolicyPage() {
  const settings = await getPaymentSettings();

  return (
    <PolicyPage
      title="Refund & cancellation policy"
      intro="Short version: nothing renews by itself, the first week is free, and if you paid by mistake or could not attend at all, ask and you get your money back."
    >
      <Clause heading="Cancelling">
        <p>
          There is no subscription running in the background and no standing charge on your card.
          Each month is paid for on its own, so <strong>cancelling is simply not paying again</strong>.
          Access continues to the end of the month you already paid for.
        </p>
      </Clause>

      <Clause heading="The free trial">
        <p>
          Every subject starts with a free {FREE_TRIAL_DAYS}-day trial, with no card details taken.
          Use it to sit in on a real class before paying anything. Nothing to cancel and nothing to
          refund.
        </p>
      </Clause>

      <Clause heading="When we refund in full">
        <ul className="list-disc space-y-1 pl-5">
          <li>You were charged twice for the same month.</li>
          <li>You were charged and the class never unlocked, and we could not fix it.</li>
          <li>You paid for a subject or a month you did not mean to, and ask within 7 days.</li>
          <li>We cancelled classes and could not reschedule them.</li>
        </ul>
      </Clause>

      <Clause heading="When we refund part of the fee">
        <p>
          If you have attended some of the month and cannot continue — illness, a family
          emergency, moving away — tell us and we refund the unused part of the month, counted in
          whole weeks.
        </p>
      </Clause>

      <Clause heading="When we do not refund">
        <ul className="list-disc space-y-1 pl-5">
          <li>The month is over and you attended the classes.</li>
          <li>You did not attend, but the classes ran and the material was available to you.</li>
          <li>
            The account was closed for sharing a login or redistributing our material. That is the
            one case with no refund at all.
          </li>
        </ul>
      </Clause>

      <Clause heading="How to ask">
        <p>
          Message {settings.contactPhone || <Blank>your phone</Blank>}
          {settings.contactEmail ? ` or email ${settings.contactEmail}` : null} with the receipt
          number from your account page, and one line saying what happened. Every payment on your
          account page has a receipt you can open.
        </p>
      </Clause>

      <Clause heading="How long it takes">
        <p>
          We reply within 2 working days. Card refunds go back through PayHere to the card you paid
          with — the bank usually takes 5 to 14 working days after we approve it. Bank deposits and
          cash are refunded by bank transfer to an account in the payer&apos;s name.
        </p>
      </Clause>

      <Clause heading="Before you contact your bank">
        <p>
          Please ask us first. A chargeback raised with the bank freezes the money for weeks and
          costs us a fee even when we agree with you — and we can usually settle it the same day
          directly. An account whose payment is charged back loses access until it is resolved.
        </p>
      </Clause>
    </PolicyPage>
  );
}
