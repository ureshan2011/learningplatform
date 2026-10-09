import type { Metadata } from "next";
import { getPaymentSettings } from "@/lib/payments/records";
import { Blank, Clause, PolicyPage } from "@/components/legal/PolicyPage";
import { FREE_TRIAL_DAYS } from "@/lib/payments/entitlements";

export const metadata: Metadata = {
  title: "Refund & cancellation policy",
  description:
    "When ICT Campus refunds a class fee, the Exam Pack, a pack or a programme, how to ask, how long it takes, and how cancelling works — nothing renews automatically.",
  alternates: { canonical: "/refund-policy" },
};

export const revalidate = 300;

export default async function RefundPolicyPage() {
  const settings = await getPaymentSettings();

  return (
    <PolicyPage
      title="Refund & cancellation policy"
      intro="Short version: nothing renews by itself, a monthly class starts with a free week, and if you paid by mistake, ask within 7 days and you get your money back. One-off products have their own rules below, and each is shown in full before you pay."
    >
      <Clause heading="Cancelling">
        <p>
          There is no subscription running in the background and no standing charge on your card.
          Each month is paid for on its own, so <strong>cancelling is simply not paying again</strong>.
          Access continues to the end of the month you already paid for. One-off products — the
          A/L ICT Exam Pack, a pack, Campus Match or a Campus Ready intake — are paid once and never
          charge again.
        </p>
      </Clause>

      <Clause heading="The free trial">
        <p>
          Every monthly subject starts with a free {FREE_TRIAL_DAYS}-day trial, with no card details
          taken. Use it to sit in on a real class before paying anything. Nothing to cancel and
          nothing to refund. One-off products have no trial; instead, what they contain is listed in
          full, with free samples, before you pay.
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
            A predicted paper or other AI-assisted study material did not match the real
            examination — every predicted paper says plainly, before you open it, that it is a
            focus list built from pattern and syllabus weighting, not a guarantee.
          </li>
          <li>
            A Campus Match forecast differed from the cut-off the UGC later published. Every screen
            that shows a number says it is an estimate worked out from figures the UGC has already
            published, and cut-offs move with who applies in a given year.
          </li>
          <li>
            The account was closed for sharing a login or redistributing our material. That is the
            one case with no refund at all.
          </li>
        </ul>
      </Clause>

      <Clause heading="The A/L ICT Exam Pack">
        <p>
          The Exam Pack is bought once, by card only. If you ask within 7 days of buying, and you have
          not started a paper or had your consultation, we refund it in full.
        </p>
        <p className="mt-2">
          After that, or once a paper has been started or the consultation has taken place, there is no
          refund — the papers, walkthroughs and print copies cannot be returned once seen. If the pack
          never unlocked after you paid, or we could not offer you a consultation time before your
          access ended, we refund in full.
        </p>
        <p className="mt-2">
          The weekly live class runs most weeks until the examination. If we cancel a week, we say so
          on the pack page and hold it another day where we can; a single cancelled week is not
          refunded on its own, because the price is for the whole pack.
        </p>
      </Clause>

      <Clause heading="Campus Ready">
        <p>
          If you ask before your intake starts, we refund the programme fee in full. After it starts,
          if you cannot continue — illness, a family emergency — tell us and we refund the weeks that
          have not yet run, counted in whole weeks. There is no refund for weeks that have already run,
          or for finding out after enrolling that you do not have a laptop: the sales page says before
          you pay that one is required.
        </p>
      </Clause>

      <Clause heading="Campus Match">
        <p>
          If you ask within 7 days of buying and have not opened your report, we refund it in full.
          Once the report has been opened there is no refund, because what you paid for has been
          delivered. A forecast that differs from the UGC&apos;s later cut-off is covered above.
        </p>
      </Clause>

      <Clause heading="Digital packs">
        <p>
          A pack is a set of files and guides bought once, not a subscription. If you have not
          downloaded or opened anything in it, ask within 7 days and we refund it in full.
        </p>
        <p className="mt-2">
          Once you have downloaded a file, there is no refund. A file cannot be returned — you
          still have it. This is why every item in a pack is listed, with what it contains, on the
          sales page and again on the pack page before you pay. Nothing in a pack is bought
          unseen.
        </p>
        <p className="mt-2">
          If a file will not open, or a download fails, that is not a refund question — tell us and
          we will fix it or replace the file.
        </p>
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
