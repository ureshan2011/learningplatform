import Link from "next/link";
import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/auth/session";
import { adminPhones } from "@/lib/env";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { UserDirectory } from "@/components/teacher/UserDirectory";
import { Icon } from "@/components/ui/Icon";

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
  const adminsConfigured = adminPhones().length > 0;

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">People</h1>
            <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
              Everyone who has signed in, what they pay for, and the devices they use.
            </p>
          </div>
          <Link
            href="/teacher"
            className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-awaken-line) px-4 py-2 text-sm font-medium hover:border-(--color-awaken-accent)/40"
          >
            <Icon name="chevron_left" className="!text-base" />
            Console
          </Link>
        </div>

        {user.role === "admin" ? null : (
          <p className="mt-5 flex gap-2 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 text-sm">
            <Icon name="info" className="!text-base shrink-0 text-(--color-awaken-ink-soft)" />
            <span>
              You are signed in as a <strong>teacher</strong>. You can free devices and sign people
              out. Changing someone&apos;s role or switching an account off is admin-only.
              {adminsConfigured ? null : (
                <span className="mt-1 block text-(--color-awaken-ink-soft)">
                  No admin has been set up yet. Add your phone number to the{" "}
                  <code className="rounded bg-(--color-awaken-bg) px-1">ADMIN_PHONES</code> variable
                  in the Firebase App Hosting console, then sign in again — see SETUP.md.
                </span>
              )}
            </span>
          </p>
        )}

        <div className="mt-6">
          <UserDirectory viewerRole={user.role} viewerUid={user.uid} />
        </div>
      </main>
    </>
  );
}
