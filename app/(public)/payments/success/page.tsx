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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 text-center">
      <h1 className="text-2xl font-bold text-[--color-success]">Payment received</h1>
      <p className="mt-3 text-sm text-white/65">
        Your class is being unlocked now. This usually takes a few seconds — open your
        dashboard and it will be ready.
      </p>
      {order ? <p className="mt-2 text-xs text-white/35">Reference: {order}</p> : null}
      <Link
        href="/dashboard"
        className="mt-8 rounded-lg bg-[--color-brand] px-6 py-3 font-semibold text-black"
      >
        Go to my dashboard
      </Link>
      <p className="mt-4 text-xs text-white/40">
        If it is still locked after a minute, contact your teacher with the reference above.
      </p>
    </main>
  );
}
