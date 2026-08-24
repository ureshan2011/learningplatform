import Link from "next/link";

export default function PaymentCancelledPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 text-center">
      <h1 className="text-2xl font-bold">Payment cancelled</h1>
      <p className="mt-3 text-sm text-white/65">
        Nothing was charged. You can try again, or send a bank deposit slip instead.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-[--color-brand] px-6 py-3 font-semibold text-black"
        >
          Back to dashboard
        </Link>
        <Link href="/pay/slip" className="rounded-lg border border-white/20 px-6 py-3">
          Upload a bank slip
        </Link>
      </div>
    </main>
  );
}
