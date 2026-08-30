import type { Metadata } from "next";
import { getPaymentSettings } from "@/lib/payments/records";
import { Blank, Clause, PolicyPage } from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What ICT Campus collects about a student, why, who it is shared with, how long it is kept, and how a parent can ask for it to be corrected or deleted.",
};

export const revalidate = 300;

export default async function PrivacyPage() {
  const settings = await getPaymentSettings();
  const who = settings.businessName || settings.ownerName;

  return (
    <PolicyPage
      title="Privacy policy"
      intro="Most of our students are school children, so this is written to be read by a parent as well as a student."
    >
      <Clause heading="Who holds your data">
        <p>
          {who ? <strong>{who}</strong> : <Blank>your name or registered business name</Blank>}, of{" "}
          {settings.addressLine || <Blank>your address</Blank>}, decides what is collected here and
          why. Contact: {settings.contactPhone || <Blank>your phone</Blank>}
          {settings.contactEmail ? `, ${settings.contactEmail}` : null}.
        </p>
      </Clause>

      <Clause heading="What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>To create an account:</strong> mobile number, name, and optionally school,
            district and preferred medium.
          </li>
          <li>
            <strong>To keep the class paid-for:</strong> a coarse device fingerprint (a hash, never
            the raw details) so one account cannot be used on unlimited phones.
          </li>
          <li>
            <strong>From the classes themselves:</strong> attendance, quiz and mock-exam answers,
            scores, XP and streaks.
          </li>
          <li>
            <strong>To take payment:</strong> the amount, date, method and reference of each
            payment, and — if you pay by deposit — the photograph of the slip you upload.
          </li>
        </ul>
        <p>
          <strong>We never see your card number.</strong> Card details are entered on PayHere&apos;s
          own payment page and never reach this platform.
        </p>
      </Clause>

      <Clause heading="Why we collect it">
        <p>
          To let you in to the classes you have paid for, to teach and mark you, to tell you when a
          class is starting, to keep proper payment records as tax law requires, and to stop paid
          material being shared with people who have not paid.
        </p>
        <p>We do not sell your data, and we do not run advertising on this platform.</p>
      </Clause>

      <Clause heading="Who else processes it">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Google Firebase</strong> — sign-in, database and hosting.</li>
          <li><strong>PayHere</strong> — card payments (a licensed Sri Lankan payment gateway).</li>
          <li><strong>Zoom</strong> — the live class itself.</li>
          <li><strong>Cloudflare R2</strong> — storage for notes, papers and recordings.</li>
        </ul>
        <p>
          Each of these is used only to run the service, under their own terms. Some of them store
          data outside Sri Lanka.
        </p>
      </Clause>

      <Clause heading="Children">
        <p>
          If you are under 18, a parent or guardian should agree to this policy with you. A parent
          may ask to see what we hold about their child, to have it corrected, or to have the
          account closed, by contacting us on the number above. We may ask them to confirm their
          identity first — otherwise anyone could ask for a child&apos;s records.
        </p>
        <p>
          Parents can also be given a read-only link showing their child&apos;s attendance and
          progress. That link is issued by the student from their own account.
        </p>
      </Clause>

      <Clause heading="How long we keep it">
        <p>
          Account and progress data for as long as the account exists, and for a year afterwards in
          case it is reopened. Payment records are kept for at least six years, because tax and
          accounting rules require it — that means a closed account still leaves its receipts
          behind, including any deposit slip uploaded as proof of payment.
        </p>
      </Clause>

      <Clause heading="Your rights">
        <p>
          You may ask what we hold about you, ask us to correct it, ask us to delete what we are
          not required to keep, and object to a particular use. Write to the contact above and we
          will answer within 30 days. Sri Lanka&apos;s Personal Data Protection Act No. 9 of 2022
          gives you these rights and a route to complain to the Data Protection Authority if we get
          it wrong.
        </p>
      </Clause>

      <Clause heading="Security">
        <p>
          Sign-in is by one-time SMS code — there is no password to leak. Access to paid material is
          checked on the server on every request. Payment approvals and anything that grants access
          can only be written by our server, never by a browser. Nothing is perfectly secure, but
          nothing here is left to the honesty of the person&apos;s own device either.
        </p>
      </Clause>

      <Clause heading="Cookies">
        <p>
          One cookie: the session that keeps you signed in for five days. No advertising or
          third-party tracking cookies are set by this site.
        </p>
      </Clause>
    </PolicyPage>
  );
}
