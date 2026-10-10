import type { Metadata } from "next";
import { getPaymentSettings } from "@/lib/payments/records";
import { Blank, Clause, PolicyPage } from "@/components/legal/PolicyPage";
import { FREE_TRIAL_DAYS } from "@/lib/payments/entitlements";
import { MAX_DEVICES_PER_USER } from "@/lib/types";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms you agree to when you use ICT Campus — accounts, fees, the Exam Pack, class recordings, acceptable use and how disputes are handled.",
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
          This platform, ICT Campus (ictcampus.lk), is operated by{" "}
          {who ? <strong>{who}</strong> : <Blank>your name or registered business name</Blank>}
          {settings.brNumber ? <>, business registration number {settings.brNumber}</> : null}, of{" "}
          {settings.addressLine || <Blank>your address</Blank>}. In these terms, &quot;we&quot; and
          &quot;us&quot; mean that person or business, and &quot;you&quot; means the student
          holding the account.
        </p>
        <p>
          This is a fully online tuition service — classes, notes, practice and support are all
          delivered over the internet, and there is no shop or office open to the public at the
          address above.
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
          Each subject is a monthly fee, shown before you pay. Every monthly subject starts with a
          free {FREE_TRIAL_DAYS}-day trial and no card is needed for it. One-off products — the A/L ICT
          Exam Pack, a pack, Campus Match, a Campus Ready intake — are priced on their own pages and
          paid for once.
        </p>
        <p>
          <strong>Nothing renews automatically.</strong> There is no standing charge on your card.
          When a month ends, access stops until you choose to pay again — so cancelling is simply
          not paying.
        </p>
        <p>
          Payment is by card through PayHere. When we have opened the option, it can also be by
          deposit at our bank, or in cash where we have agreed that. The A/L ICT Exam Pack is sold by
          card only. Access begins when the payment is confirmed: within seconds for a card, usually
          the same day for a deposit slip we have to check by eye.
        </p>
      </Clause>

      <Clause heading="5. What we provide">
        <p>
          Live online classes at the times published in the timetable, on Zoom or Google Meet,
          recordings where they are made, notes and past-paper material, quizzes and practice
          tools. We teach the syllabus as
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
          Notes, videos, recordings, question banks, predicted papers and simulations are our
          copyright. You may use them for your own study. You may not record, re-upload, resell, or
          pass them to anyone else, including in group chats.
        </p>
        <p>
          Classes and recordings played inside ICT Campus show your own name and part of your number
          moving across the picture, and every print copy of an Exam Pack paper carries them on each
          page. Anything filmed or copied therefore identifies the account it came from, and if our
          material turns up in a group chat that is how we trace it. Notes and papers are handed out
          as private links that expire within minutes and are tied to your account, never as public
          addresses anyone can pass on.
        </p>
        <p>
          Where we can establish that material was shared from an account, that account is closed
          without a refund.
        </p>
        <p>
          Live classes may be recorded for students who missed them. Your camera and microphone are
          not required, and your name may be visible to classmates in the class chat and
          leaderboard.
        </p>
      </Clause>

      <Clause heading="7. AI-assisted exam-prediction material">
        <p>
          Some material — including any paper labelled a &quot;predicted paper&quot; — is drafted
          with the help of an AI exam-pattern analysis of past papers and the published syllabus,
          reviewed by us before students can see it. It is a study aid built from historical pattern
          and syllabus weighting, not a leaked paper, not sourced from any exam board, and not a
          guarantee of what will appear in a real examination. We do not promise it will improve
          your result, and the Department of Examinations and the National Institute of Education
          have no part in producing it.
        </p>
      </Clause>

      <Clause heading="8. Interruptions">
        <p>
          Classes depend on your internet connection and ours, on Zoom or Google Meet, and on your
          device. If a monthly class is cancelled by us, we reschedule it or extend your access by the
          equivalent time. The Exam Pack&apos;s weekly live is covered in clause 13.
          We are not able to compensate for problems on your side of the connection.
        </p>
      </Clause>

      <Clause heading="9. Suspension">
        <p>
          We may suspend or close an account that shares logins or material, disrupts a live class,
          abuses other students or the teacher, or pays with a card that is not theirs. Where the
          reason is not your fault, we refund the unused part of what you paid for.
        </p>
      </Clause>

      <Clause heading="10. Digital packs">
        <p>
          A pack — such as the Campus Survival Pack — is a set of files and in-app guides bought
          with a single payment, not a subscription. The access period is stated on the pack page
          before you pay, and it runs from the day you buy it.
        </p>
        <p>
          Your licence is personal. You may keep and use the files for your own study and your own
          coursework, including after the access period ends for anything you have already
          downloaded. You may not resell them, upload them anywhere, or pass them to anyone else,
          including in group chats. The account-closure rule in clause 6 applies here in the same
          way.
        </p>
        <p>
          The contents of a pack were drafted with the help of AI and reviewed by us before
          release. A pack is not accredited or recognised by any university, carries no
          certificate, and is not a substitute for your own department&apos;s handbook — where a
          pack and your module handbook disagree, the handbook governs your work.
        </p>
        <p>
          We may add files to a pack or replace a file with a corrected version. We will not remove
          the substance of what you bought during your access period.
        </p>
      </Clause>

      <Clause heading="11. Campus Match">
        <p>
          Campus Match is a report bought with a single payment. It estimates your chance at each
          course from cut-off figures the University Grants Commission has already published, and
          from its Courses of Study handbook. Every figure in it is an estimate, not a promise:
          cut-offs move each year with who applies, and nobody can know the coming round&apos;s
          figures before the UGC publishes them.
        </p>
        <p>
          ICT Campus has no connection to the University Grants Commission or to any university,
          and does not speak for them. Who may apply for a course is decided by the UGC handbook
          and by the UGC&apos;s own admission process — where our summary and the handbook
          disagree, the handbook governs.
        </p>
        <p>
          To build your report we store the answers you give us: your Z-score, district, stream,
          the subjects you say you passed, your application order, and — if you choose to tell us —
          which course you were finally offered. They are used to render your report and to check
          how well our method worked. You can delete them at any time from Account, and clause 14
          applies to this report as it does to everything else.
        </p>
      </Clause>

      <Clause heading="12. Campus Ready">
        <p>
          Campus Ready is a fixed-length online programme bought with a single payment. Everyone in an
          intake starts and finishes together, and access ends on the intake&apos;s last day. It
          needs a laptop — Power BI and Python do not run properly on a phone — and there is no
          personal mentor: work is marked automatically or by structured peer review.
        </p>
        <p>
          The certificate is issued by ICT Campus. It is not accredited or recognised by any
          university or awarding body, and we will not describe it as if it were.
        </p>
      </Clause>

      <Clause heading="13. The A/L ICT Exam Pack">
        <p>
          The Exam Pack is bought with a single card payment. It contains two timed Paper I sittings
          marked by us and ranked, a walkthrough of every question in them, the predicted Paper II
          with its mark scheme, print copies, any files we add to it, one 30-minute one-to-one
          consultation, and the weekly live class until the examination. The price and the access
          period are shown before you pay; access runs from the day you buy.
        </p>
        <p>
          Your first sitting of each paper is ranked against other Exam Pack students. Other students
          see only their own rank and how many have sat the paper — never your name or your score.
        </p>
        <p>
          The consultation is booked from the times we publish and can be moved by you until 12 hours
          before. If you miss it without telling us, it counts as used, though we may agree another
          time. The consultation and the weekly live run on Google Meet: you need a Google account to
          join, and we do not record either. If we cancel a weekly live, we say so in the pack and
          hold it on another day where we can.
        </p>
        <p>
          Your licence to everything in the pack is personal, the same as clauses 6 and 10. Clause 7
          applies to the predicted papers, and the walkthroughs were drafted with the help of AI and
          reviewed by us.
        </p>
      </Clause>

      <Clause heading="14. Liability">
        <p>
          Nothing here limits liability that cannot be limited by Sri Lankan law. Beyond that, our
          liability for any claim is limited to the fees you paid us in the three months before it
          arose.
        </p>
      </Clause>

      <Clause heading="15. Changes and governing law">
        <p>
          We may update these terms; the date at the top shows when. Material changes are announced
          in class and on the site before they take effect. These terms are governed by the laws of
          Sri Lanka, and the courts of Sri Lanka have jurisdiction.
        </p>
      </Clause>

      <Clause heading="16. Contact">
        <p>
          Questions about these terms: {settings.contactPhone || <Blank>your phone</Blank>}
          {settings.contactEmail ? `, ${settings.contactEmail}` : null}.
        </p>
      </Clause>
    </PolicyPage>
  );
}
