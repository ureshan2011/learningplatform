import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { col } from "@/lib/firebase/admin";
import { listEnrollments, listSubjects } from "@/lib/queries";
import { formatDate, formatLKR } from "@/lib/format";
import { formatLocal } from "@/lib/phone";
import { publicEnv } from "@/lib/env";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import { ParentLinkPanel } from "@/components/account/ParentLinkPanel";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { MAX_DEVICES_PER_USER, type Payment, type User } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  teacher: "Teacher — full access",
  admin: "Admin — full access",
  parent: "Parent",
};

export default async function AccountPage() {
  const session = await requirePageUser("/account");

  const [snap, enrollments, subjects, payments] = await Promise.all([
    col.users().doc(session.uid).get(),
    listEnrollments(session.uid),
    listSubjects(),
    // The student's own payment history. One equality filter, narrowed and
    // sorted in memory — same index-free rule as the rest of lib/queries.ts.
    col
      .payments()
      .where("uid", "==", session.uid)
      .limit(100)
      .get()
      .then((s) =>
        (s.docs.map((d) => d.data() as Payment) as Payment[])
          .filter((p) => p.status === "paid" || p.status === "refunded" || p.status === "pending")
          .sort((a, b) => (b.paidAt ?? b.createdAt) - (a.paidAt ?? a.createdAt))
          .slice(0, 24),
      )
      .catch(() => [] as Payment[]),
  ]);
  const user = snap.data() as User;
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--color-awaken-accent-soft) text-lg font-bold text-(--color-awaken-accent)">
          {initial}
        </span>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-(--color-awaken-ink-soft)">{ROLE_LABEL[user.role] ?? user.role}</p>
        </div>
      </div>

      <dl className="mt-6 space-y-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-sm">
        <Row label="Phone" value={formatLocal(user.phone)} />
        {user.school ? <Row label="School" value={user.school} /> : null}
        <Row label="Referral code" value={user.referralCode} />
      </dl>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="auto_stories" className="text-(--color-awaken-accent)" />
          Subscriptions
        </h2>
        {enrollments.length === 0 ? (
          <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">No subscriptions yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {enrollments.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-3"
              >
                <span>{subjectById.get(e.subjectId)?.name ?? e.subjectId}</span>
                <StatusPill tone={e.status === "active" ? "success" : "neutral"}>
                  {e.status === "active" ? `until ${formatDate(e.currentPeriodEnd)}` : e.status}
                </StatusPill>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="receipt_long" className="text-(--color-awaken-accent)" />
          Payments &amp; receipts
        </h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">No payments yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <span className="min-w-0">
                  <span className="block font-medium">
                    {subjectById.get(p.subjectId)?.name ?? p.subjectId} · {formatLKR(p.amountLKR)}
                  </span>
                  <span className="block text-xs text-(--color-awaken-ink-soft)">
                    {formatDate(p.paidAt ?? p.createdAt)}
                    {p.receiptNo ? ` · ${p.receiptNo}` : ""}
                  </span>
                </span>
                {p.status === "pending" ? (
                  <StatusPill tone="neutral">waiting for approval</StatusPill>
                ) : p.status === "refunded" ? (
                  <StatusPill tone="neutral">refunded</StatusPill>
                ) : (
                  <Link
                    href={`/receipt/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-(--color-awaken-deep) underline"
                  >
                    <Icon name="receipt_long" className="!text-sm" />
                    Receipt
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="group" className="text-(--color-awaken-accent)" />
          Invite a friend
        </h2>
        <div className="mt-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 text-sm">
          <p className="text-(--color-awaken-ink-soft)">
            Share your code — when your friend subscribes, <strong>you both get 3 free days</strong>.
          </p>
          <p className="mt-3 truncate rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) px-3 py-2 font-mono text-xs text-(--color-awaken-ink-soft)">
            {`${publicEnv.appUrl}/signin?ref=${user.referralCode}`}
          </p>
          <div className="mt-3">
            <WhatsAppShareButton
              text={`Join me on ICT Campus for A/L ICT tuition — sign up with my code and we both get 3 free days!\n${publicEnv.appUrl}/signin?ref=${user.referralCode}`}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="family_restroom" className="text-(--color-awaken-accent)" />
          Parent view
        </h2>
        <ParentLinkPanel />
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="smartphone" className="text-(--color-awaken-accent)" />
          Devices
        </h2>
        <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
          Your account works on up to {MAX_DEVICES_PER_USER} devices. To swap one, ask
          your teacher to remove an old device.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {(user.devices ?? []).map((device) => (
            <li
              key={device.deviceHash}
              className="flex items-center justify-between rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-3"
            >
              <span className="flex items-center gap-2">
                <Icon name="smartphone" className="!text-base text-(--color-awaken-ink-soft)" />
                {device.label}
              </span>
              <span className="text-(--color-awaken-ink-soft)">last used {formatDate(device.lastSeenAt)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <SignOutButton className="flex w-full items-center justify-center gap-2 rounded-lg border border-(--color-awaken-line) px-4 py-3 text-sm font-medium hover:border-(--color-awaken-danger)/40 hover:text-(--color-awaken-danger)" />
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-(--color-awaken-ink-soft)">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
