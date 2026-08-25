import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { col } from "@/lib/firebase/admin";
import { listEnrollments, listSubjects } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { formatLocal } from "@/lib/phone";
import { publicEnv } from "@/lib/env";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import { ParentLinkPanel } from "@/components/account/ParentLinkPanel";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { MAX_DEVICES_PER_USER, type User } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  teacher: "Teacher — full access",
  admin: "Admin — full access",
  parent: "Parent",
};

export default async function AccountPage() {
  const session = await getSessionUser();
  if (!session) redirect("/signin");

  const [snap, enrollments, subjects] = await Promise.all([
    col.users().doc(session.uid).get(),
    listEnrollments(session.uid),
    listSubjects(),
  ]);
  const user = snap.data() as User;
  const subjectById = new Map(subjects.map((s) => [s.id, s]));

  return (
    <>
      <SiteHeader user={session} />
      <main className="mx-auto max-w-lg px-5 py-8">
      <h1 className="mt-4 text-2xl font-bold">Account</h1>

      <dl className="mt-6 space-y-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-sm">
        <Row label="Name" value={user.name} />
        {/* Shown so "why can't I see the teacher console?" is answerable at a glance. */}
        <Row label="Role" value={ROLE_LABEL[user.role] ?? user.role} />
        <Row label="Phone" value={formatLocal(user.phone)} />
        {user.school ? <Row label="School" value={user.school} /> : null}
        <Row label="Referral code" value={user.referralCode} />
      </dl>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Subscriptions</h2>
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
                <span className={e.status === "active" ? "text-(--color-awaken-success)" : "text-(--color-awaken-ink-soft)"}>
                  {e.status === "active"
                    ? `until ${formatDate(e.currentPeriodEnd)}`
                    : e.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Invite a friend</h2>
        <div className="mt-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 text-sm">
          <p className="text-(--color-awaken-ink-soft)">
            Share your code — when your friend subscribes, <strong>you both get 3 free days</strong>.
          </p>
          <p className="mt-3 truncate rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) px-3 py-2 font-mono text-xs text-(--color-awaken-ink-soft)">
            {`${publicEnv.appUrl}/signin?ref=${user.referralCode}`}
          </p>
          <div className="mt-3">
            <WhatsAppShareButton
              text={`Join me on ICT Class for O/L and A/L ICT tuition — sign up with my code and we both get 3 free days!\n${publicEnv.appUrl}/signin?ref=${user.referralCode}`}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Parent view</h2>
        <ParentLinkPanel />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Devices</h2>
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
              <span>{device.label}</span>
              <span className="text-(--color-awaken-ink-soft)">last used {formatDate(device.lastSeenAt)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <SignOutButton />
      </div>
      </main>
    </>
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
