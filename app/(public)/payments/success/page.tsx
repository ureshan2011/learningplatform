import { getSessionUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { PaymentStatusWatcher } from "@/components/payments/PaymentStatusWatcher";
import { ButtonLink, Card, IconBadge } from "@/components/ds-cream";

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
      <main className="flex min-h-[calc(100dvh-73px)] flex-col justify-center bg-ict-paper-100 px-5 py-10">
        <div className="mx-auto w-full max-w-md text-center">
          <IconBadge icon="credit_card" tone="soft" size={56} round className="mx-auto" />
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-ink-900">
            Thanks — checking with the bank
          </h1>

          <div className="mt-6">
            {order ? (
              <PaymentStatusWatcher orderId={order} />
            ) : (
              <Card radius="card" className="p-5 text-sm text-ict-ink-400">
                <p>
                  No payment reference was passed back. Open your dashboard — if the class is still
                  locked in a few minutes, message your teacher.
                </p>
                <ButtonLink href="/dashboard" variant="secondary" size="md" arrow="none" className="mt-4 justify-center">
                  Go to my dashboard
                </ButtonLink>
              </Card>
            )}
          </div>

          {order ? (
            <p className="mt-4 text-xs break-all text-ict-ink-400">Reference: {order}</p>
          ) : null}
        </div>
      </main>
    </>
  );
}
