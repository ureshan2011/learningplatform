import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { col } from "@/lib/firebase/admin";
import { listEnrollments, listSubjects } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { formatLocal } from "@/lib/phone";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { TopBar } from "@/components/ui/TopBar";
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
    <main className="min-h-dvh">
      <TopBar back={{ href: "/dashboard", label: "Dashboard" }} maxWidth="lg" />

      <div className="mx-auto max-w-lg px-5 py-8">
        <h1 className="text-display rise-in text-2xl">Account</h1>

        <dl className="surface mt-6 space-y-3 p-5 text-sm">
          <Row label="Name" value={user.name} />
          {/* Shown so "why can't I see the teacher console?" is answerable at a glance. */}
          <Row label="Role" value={ROLE_LABEL[user.role] ?? user.role} />
          <Row label="Phone" value={formatLocal(user.phone)} />
          {user.school ? <Row label="School" value={user.school} /> : null}
          <Row label="Referral code" value={user.referralCode} />
        </dl>

        <section className="mt-8">
          <h2 className="text-title text-lg">Subscriptions</h2>
          {enrollments.length === 0 ? (
            <p className="mt-3 text-sm text-(--color-text-faint)">No subscriptions yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {enrollments.map((e) => (
                <li key={e.id} className="surface flex items-center justify-between p-3">
                  <span>{subjectById.get(e.subjectId)?.name ?? e.subjectId}</span>
                  <span className={e.status === "active" ? "text-(--color-success)" : "text-(--color-text-faint)"}>
                    {e.status === "active" ? `until ${formatDate(e.currentPeriodEnd)}` : e.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-title text-lg">Devices</h2>
          <p className="mt-1 text-sm text-(--color-text-faint)">
            Your account works on up to {MAX_DEVICES_PER_USER} devices. To swap one, ask your
            teacher to remove an old device.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {(user.devices ?? []).map((device) => (
              <li key={device.deviceHash} className="surface flex items-center justify-between p-3">
                <span>{device.label}</span>
                <span className="text-(--color-text-faint)">last used {formatDate(device.lastSeenAt)}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-(--color-text-muted)">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
