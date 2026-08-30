import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { PaymentStatusWatcher } from "@/components/payments/PaymentStatusWatcher";
import { Icon } from "@/components/ui/Icon";

/**
 * Where PayHere returns the student's browser after payment.
 *
 * This page grants nothing. Access is activated only by the server-to-server
 * notification in /api/payments/payhere/notify — a student can navigate here
 * directly, so treating it as proof of payment would give the class away.
 *
 * What it can do is watch: the component below asks the server whether the
 * payment has actually landed and only then says the class is open.
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
      <main className="mx-auto flex min-h-[calc(100dvh-73px)] max-w-md flex-col justify-center px-5 py-10 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)">
          <Icon name="credit_card" className="!text-3xl" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Thanks — checking with the bank</h1>

        <div className="mt-6">
          {order ? (
            <PaymentStatusWatcher orderId={order} />
          ) : (
            <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 text-sm text-(--color-awaken-ink-soft)">
              <p>
                No payment reference was passed back. Open your dashboard — if the class is still
                locked in a few minutes, message your teacher.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-(--color-awaken-deep) px-6 py-3 font-semibold text-white"
              >
                Go to my dashboard
              </Link>
            </div>
          )}
        </div>

        {order ? (
          <p className="mt-4 text-xs break-all text-(--color-awaken-ink-soft)">Reference: {order}</p>
        ) : null}
      </main>
    </>
  );
}
