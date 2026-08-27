import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";

export default async function PaymentCancelledPage() {
  const user = await getSessionUser().catch(() => null);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto flex min-h-[calc(100dvh-73px)] max-w-md flex-col justify-center px-5 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-(--color-awaken-bg) text-(--color-awaken-ink-soft)">
          <Icon name="cancel" className="!text-3xl" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Payment cancelled</h1>
        <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">
          Nothing was charged. You can try again, or send a bank deposit slip instead.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-6 py-3 font-semibold text-white"
          >
            <Icon name="home" className="!text-base" />
            Back to dashboard
          </Link>
          <Link
            href="/pay/slip"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-(--color-awaken-line) px-6 py-3 hover:border-(--color-awaken-accent)/40"
          >
            <Icon name="cloud_upload" className="!text-base" />
            Upload a bank slip
          </Link>
        </div>
      </main>
    </>
  );
}
