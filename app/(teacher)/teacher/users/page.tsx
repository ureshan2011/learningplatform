import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/auth/session";
import { col } from "@/lib/firebase/admin";
import { UserDirectory } from "@/components/teacher/UserDirectory";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ds";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "People",
  robots: { index: false, follow: false },
};

/**
 * Teacher console → People.
 *
 * The roll: every account, searchable, with the full record behind each one and
 * the actions a staff member can take. The console had no such screen — the
 * only way to see a student was to already know their phone number.
 */
export default async function PeoplePage() {
  const user = await requireStaffPage("/teacher/users");

  // Single equality filter, so no composite index — see lib/queries.ts. A read
  // failure must not hide the People screen, so an error is treated as "an
  // admin probably exists" and simply leaves the bootstrap prompt off.
  const noAdminYet = await col
    .users()
    .where("role", "==", "admin")
    .limit(1)
    .get()
    .then((snap) => snap.empty)
    .catch(() => false);

  return (
      <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6">
        <PageHeader
          eyebrow="Teacher console"
          title="People"
          subtitle="Everyone who has signed in, what they pay for, and the devices they use."
        />

        {user.role === "admin" ? null : noAdminYet ? (
          <p className="mt-5 flex gap-2 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-4 text-sm">
            <Icon name="info" className="!text-base shrink-0 text-(--color-awaken-accent)" />
            <span>
              <strong>Nobody is an admin yet.</strong> Find yourself in the list below, open your
              row, and set <strong>Role</strong> to <strong>admin</strong>. You will be signed out
              — sign back in and you will have the full set of controls.
              <span className="mt-1 block text-(--color-awaken-ink-soft)">
                A teacher can only do this while the admin seat is empty. After that, only an admin
                can change roles.
              </span>
            </span>
          </p>
        ) : (
          <p className="mt-5 flex gap-2 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 text-sm">
            <Icon name="info" className="!text-base shrink-0 text-(--color-awaken-ink-soft)" />
            <span>
              You are signed in as a <strong>teacher</strong>. You can free devices and sign people
              out. Changing someone&apos;s role or switching an account off is admin-only.
            </span>
          </p>
        )}

        <div className="mt-6">
          <UserDirectory viewerRole={user.role} viewerUid={user.uid} noAdminYet={noAdminYet} />
        </div>
      </main>
  );
}
