import Link from "next/link";

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

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <div className="rise-in flex flex-col items-center">
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-success)/15 text-(--color-success)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-7 w-7">
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="text-display mt-5 text-2xl text-(--color-success)">Payment received</h1>
        <p className="mt-3 text-sm text-(--color-text-muted)">
          Your class is being unlocked now. This usually takes a few seconds — open your
          dashboard and it will be ready.
        </p>
        {order ? <p className="mt-2 text-xs text-(--color-text-faint)">Reference: {order}</p> : null}
        <Link href="/dashboard" className="btn btn-primary mt-8">
          Go to my dashboard
        </Link>
        <p className="mt-4 text-xs text-(--color-text-faint)">
          If it is still locked after a minute, contact your teacher with the reference above.
        </p>
      </div>
    </main>
  );
}
