import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { col } from "@/lib/firebase/admin";
import { listEnrollments, listSubjects } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { formatLocal } from "@/lib/phone";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { MAX_DEVICES_PER_USER, type User } from "@/lib/types";

export const dynamic = "force-dynamic";

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
    <main className="mx-auto max-w-lg px-5 py-8">
      <Link href="/dashboard" className="text-sm text-white/50 underline">
        ← Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Account</h1>

      <dl className="mt-6 space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm">
        <Row label="Name" value={user.name} />
        <Row label="Phone" value={formatLocal(user.phone)} />
        {user.school ? <Row label="School" value={user.school} /> : null}
        <Row label="Referral code" value={user.referralCode} />
      </dl>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Subscriptions</h2>
        {enrollments.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">No subscriptions yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {enrollments.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3"
              >
                <span>{subjectById.get(e.subjectId)?.name ?? e.subjectId}</span>
                <span className={e.status === "active" ? "text-[--color-success]" : "text-white/45"}>
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
        <h2 className="text-lg font-semibold">Devices</h2>
        <p className="mt-1 text-sm text-white/50">
          Your account works on up to {MAX_DEVICES_PER_USER} devices. To swap one, ask
          your teacher to remove an old device.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {(user.devices ?? []).map((device) => (
            <li
              key={device.deviceHash}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3"
            >
              <span>{device.label}</span>
              <span className="text-white/45">last used {formatDate(device.lastSeenAt)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <SignOutButton />
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-white/55">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
