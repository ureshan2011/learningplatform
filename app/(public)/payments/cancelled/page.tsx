import { getSessionUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink, IconBadge } from "@/components/ds-cream";

export default async function PaymentCancelledPage() {
  const user = await getSessionUser().catch(() => null);

  return (
    <>
      <SiteHeader user={user} />
      <main className="flex min-h-[calc(100dvh-73px)] flex-col justify-center bg-ict-paper-100 px-5">
        <div className="mx-auto w-full max-w-md text-center">
          <IconBadge icon="cancel" tone="soft" size={56} round className="mx-auto" />
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-ink-900">Payment cancelled</h1>
          <p className="mt-3 text-sm text-ict-ink-400">
            Nothing was charged. You can try again, or send a bank deposit slip instead.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <ButtonLink href="/dashboard" variant="primary" size="lg" arrow="none" className="justify-center">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="home" className="!text-base" />
                Back to dashboard
              </span>
            </ButtonLink>
            <ButtonLink href="/pay/slip" variant="outline" size="lg" arrow="none" className="justify-center">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="cloud_upload" className="!text-base" />
                Upload a bank slip
              </span>
            </ButtonLink>
          </div>
        </div>
      </main>
    </>
  );
}
