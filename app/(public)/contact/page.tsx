import type { Metadata } from "next";
import { getPaymentSettings } from "@/lib/payments/records";
import { Blank, Clause, PolicyPage } from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "How to reach ICT Campus — phone, WhatsApp and email, who runs it, and where to write about a payment or a refund.",
  alternates: { canonical: "/contact" },
};

export const revalidate = 300;

export default async function ContactPage() {
  const settings = await getPaymentSettings();
  const who = settings.businessName || settings.ownerName;

  return (
    <PolicyPage
      title="Contact us"
      intro="A real person answers these — there is no call centre and no ticket queue."
    >
      <Clause heading="Who runs this">
        <p>
          {who ? <strong>{who}</strong> : <Blank>your name or registered business name</Blank>}
          {settings.ownerName && settings.businessName ? <> ({settings.ownerName})</> : null}
          {settings.brNumber ? <>, business registration {settings.brNumber}</> : null}.
        </p>
        <p>{settings.addressLine || <Blank>your address</Blank>}</p>
      </Clause>

      <Clause heading="How to reach us">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Phone / WhatsApp:</strong> {settings.contactPhone || <Blank>your phone number</Blank>}
          </li>
          <li>
            <strong>Email:</strong> {settings.contactEmail || <Blank>your email address</Blank>}
          </li>
        </ul>
        <p>
          We reply within 2 working days, and faster during exam season. For anything about a
          payment, quote the receipt number shown on your account page — it finds the payment
          instantly.
        </p>
      </Clause>

      <Clause heading="What to write about where">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>A class you paid for did not unlock</strong> — message us with your receipt number.</li>
          <li><strong>A refund</strong> — see the refund policy, then message us.</li>
          <li><strong>Your data, or your child&apos;s data</strong> — see the privacy policy; a parent may ask directly.</li>
          <li><strong>Joining, timetables and syllabus questions</strong> — ask in class or message us any time.</li>
        </ul>
      </Clause>
    </PolicyPage>
  );
}
