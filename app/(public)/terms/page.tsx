import type { Metadata } from "next";
import { getPaymentSettings } from "@/lib/payments/records";
import { Blank, Clause, PolicyPage } from "@/components/legal/PolicyPage";
import { FREE_TRIAL_DAYS } from "@/lib/payments/entitlements";
import { MAX_DEVICES_PER_USER } from "@/lib/types";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms you agree to when you use ICT Campus — accounts, fees, class recordings, acceptable use and how disputes are handled.",
  alternates: { canonical: "/terms" },
};

export const revalidate = 300;

export default async function TermsPage() {
  const settings = await getPaymentSettings();
  const who = settings.businessName || settings.ownerName;

  return (
    <PolicyPage
      title="Terms of service"
      intro="Please read these before you subscribe. They describe what the class includes, what it costs, and what is expected of you."
    >
      <Clause heading="1. Who you are dealing with">
        <p>
          This platform is operated by {who ? <strong>{who}</strong> : <Blank>your name or registered business name</Blank>}
          {settings.brNumber ? <>, business registration number {settings.brNumber}</> : null}, of{" "}
          {settings.addressLine || <Blank>your address</Blank>}. In these terms, &quot;we&quot; and
          &quot;us&quot; mean that person or business, and &quot;you&quot; means the student
          holding the account.
        </p>
      </Clause>

      <Clause heading="2. Who may use it">
        <p>
          The classes are for students following the Sri Lankan G.C.E. Advanced Level ICT syllabus.
          Most of you are under 18. If you are, a parent or guardian must read and agree to these
          terms with you, and they are responsible for any fees paid from their account.
        </p>
      </Clause>

      <Clause heading="3. Your account">
        <p>
          Accounts are created with a Sri Lankan mobile number and a one-time SMS code. One number
          is one account, and one account is one student.
        </p>
        <p>
          An account may be used on up to {MAX_DEVICES_PER_USER} devices. Sharing an account, or
          your login code, with anyone else is the one thing that will get it suspended without a
          refund — it is how a paid class becomes a free one for people who did not pay.
        </p>
      </Clause>

      <Clause heading="4. Fees, the free trial and renewal">
        <p>
          Each subject is a monthly fee, shown before you pay. Every subject starts with a free
          {" "}{FREE_TRIAL_DAYS}-day trial and no card is needed for it.
        </p>
        <p>
          <strong>Nothing renews automatically.</strong> There is no standing charge on your card.
          When a month ends, access stops until you choose to pay again — so cancelling is simply
          not paying.
        </p>
        <p>
          Payment is by card through PayHere, by deposit at our bank, or in cash where we have
          agreed that. Access begins when the payment is confirmed: within seconds for a card,
          usually the same day for a deposit slip we have to check by eye.
        </p>
      </Clause>

      <Clause heading="5. What we provide">
        <p>
          Live online classes at the times published in the timetable, recordings where they are
          made, notes and past-paper material, quizzes and practice tools. We teach the syllabus as
          published by the National Institute of Education; we are not affiliated with the NIE, the
          Department of Examinations or any school.
        </p>
        <p>
          We do not promise a grade. What you get is teaching, materials and practice — the result
          also depends on your work.
        </p>
      </Clause>

      <Clause heading="6. Class recordings and materials">
        <p>
          Notes, videos, recordings, question banks and simulations are our copyright. You may use
          them for your own study. You may not record, re-upload, resell, or pass them to anyone
          else, including in group chats.
        </p>
        <p>
          Downloaded material carries a watermark identifying the account it was issued to. If our
          material appears somewhere it should not, that watermark is how we identify the source,
          and the account is closed without a refund.
        </p>
        <p>
          Live classes may be recorded for students who missed them. Your camera and microphone are
          not required, and your name may be visible to classmates in the class chat and
          leaderboard.
        </p>
      </Clause>

      <Clause heading="7. Interruptions">
        <p>
          Classes depend on your internet connection and ours, on Zoom, and on your device. If a
          class is cancelled by us, we reschedule it or extend your access by the equivalent time.
          We are not able to compensate for problems on your side of the connection.
        </p>
      </Clause>

      <Clause heading="8. Suspension">
        <p>
          We may suspend or close an account that shares logins or material, disrupts a live class,
          abuses other students or the teacher, or pays with a card that is not theirs. Where the
          reason is not your fault, we refund the unused part of the month.
        </p>
      </Clause>

      <Clause heading="9. Liability">
        <p>
          Nothing here limits liability that cannot be limited by Sri Lankan law. Beyond that, our
          liability for any claim is limited to the fees you paid us in the three months before it
          arose.
        </p>
      </Clause>

      <Clause heading="10. Changes and governing law">
        <p>
          We may update these terms; the date at the top shows when. Material changes are announced
          in class and on the site before they take effect. These terms are governed by the laws of
          Sri Lanka, and the courts of Sri Lanka have jurisdiction.
        </p>
      </Clause>

      <Clause heading="11. Contact">
        <p>
          Questions about these terms: {settings.contactPhone || <Blank>your phone</Blank>}
          {settings.contactEmail ? `, ${settings.contactEmail}` : null}.
        </p>
      </Clause>
    </PolicyPage>
  );
}
