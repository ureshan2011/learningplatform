import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/nav/SiteHeader";

/**
 * Where PayHere returns the student's browser after payment.
 *
 * This page grants nothing. Access is activated only by the server-to-server
 * notification in /api/payments/payhere/notify — a student can navigate here
 * directly, so treating it as proof of payment would give the class away.
 */
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const user = await getSessionUser().catch(() => null);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto flex min-h-[calc(100dvh-73px)] max-w-md flex-col justify-center px-5 text-center">
        <h1 className="text-2xl font-bold text-(--color-awaken-success)">Payment received</h1>
        <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">
          Your class is being unlocked now. This usually takes a few seconds — open your
          dashboard and it will be ready.
        </p>
        {order ? <p className="mt-2 text-xs text-(--color-awaken-ink-soft)">Reference: {order}</p> : null}
        <Link
          href="/dashboard"
          className="mt-8 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-6 py-3 font-semibold text-white"
        >
          Go to my dashboard
        </Link>
        <p className="mt-4 text-xs text-(--color-awaken-ink-soft)">
          If it is still locked after a minute, contact your teacher with the reference above.
        </p>
      </main>
    </>
  );
}
