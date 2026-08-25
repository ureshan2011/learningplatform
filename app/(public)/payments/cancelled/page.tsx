import Link from "next/link";

export default function PaymentCancelledPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <div className="rise-in flex w-full flex-col items-center">
        <h1 className="text-display text-2xl">Payment cancelled</h1>
        <p className="mt-3 text-sm text-(--color-text-muted)">
          Nothing was charged. You can try again, or send a bank deposit slip instead.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3">
          <Link href="/dashboard" className="btn btn-primary">
            Back to dashboard
          </Link>
          <Link href="/pay/slip" className="btn btn-secondary">
            Upload a bank slip
          </Link>
        </div>
      </div>
    </main>
  );
}
