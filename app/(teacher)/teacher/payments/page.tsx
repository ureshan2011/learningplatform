import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb, col } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { listSubjects } from "@/lib/queries";
import { publicEnv } from "@/lib/env";
import { payhereConfigured } from "@/lib/features";
import { formatLKR, formatSessionTime } from "@/lib/format";
import { getLedger, type Ledger } from "@/lib/payments/ledger";
import {
  bankDetailsReady,
  emptyPaymentSettings,
  getPaymentSettings,
  listPaymentEvents,
} from "@/lib/payments/records";
import { PaymentLedger } from "@/components/teacher/PaymentLedger";
import { ManualPaymentForm } from "@/components/teacher/ManualPaymentForm";
import { PaymentSettingsForm } from "@/components/teacher/PaymentSettingsForm";
import { SlipReviewList, type PendingSlip } from "@/components/teacher/SlipReviewList";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { StatTile } from "@/components/ui/StatTile";
import type { Payment, PaymentEvent, PaymentSettings, Subject, User } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Same degradation rule as the rest of the console: one broken read blanks its own card. */
async function section<T>(name: string, read: () => Promise<T>, empty: T): Promise<T> {
  try {
    return await read();
  } catch (err) {
    console.error(`[teacher/payments] "${name}" failed to load`, err);
    return empty;
  }
}

/**
 * Everything to do with money, on one page.
 *
 * Deliberately one page rather than four: a solo teacher doing their own
 * accounting should not have to remember which screen holds the slips, which
 * holds the totals and which holds the bank details. Top to bottom it reads
 * as a month's work — what came in, what is waiting, what to hand an
 * accountant, and the settings behind it.
 */
export default async function TeacherPaymentsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  const subjects = await section("subjects", () => listSubjects(), [] as Subject[]);

  const [ledger, slips, settings, events] = await Promise.all([
    section<Ledger>("ledger", () => getLedger(subjects), {
      rows: [],
      totals: {
        collectedThisMonthLKR: 0,
        collectedLastMonthLKR: 0,
        collectedAllTimeLKR: 0,
        refundedAllTimeLKR: 0,
        pendingLKR: 0,
        pendingCount: 0,
        paidCount: 0,
        byMonth: [],
      },
    }),
    section("slips", () => pendingSlips(subjects), [] as PendingSlip[]),
    section<PaymentSettings>("settings", () => getPaymentSettings(), emptyPaymentSettings()),
    section("events", () => listPaymentEvents(8), [] as PaymentEvent[]),
  ]);

  const { totals } = ledger;
  const cardsOn = payhereConfigured();
  const sandbox = publicEnv.payhere.mode === "sandbox";
  const notifyUrl = `${publicEnv.appUrl}/api/payments/payhere/notify`;
  const bankReady = bankDetailsReady(settings);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-4xl px-5 py-8">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline"
        >
          <Icon name="arrow_back" className="!text-base" />
          Teacher console
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payments &amp; accounts</h1>
            <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
              Every rupee in, who paid it, and the file your accountant needs.
            </p>
          </div>
          <a
            href="/api/teacher/payments/export"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Icon name="download" className="!text-base" />
            Download CSV
          </a>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon="payments" label="This month" value={formatLKR(totals.collectedThisMonthLKR)} tone="accent" />
          <StatTile icon="calendar_month" label="Last month" value={formatLKR(totals.collectedLastMonthLKR)} />
          <StatTile
            icon="receipt_long"
            label="Waiting"
            value={formatLKR(totals.pendingLKR)}
            tone={totals.pendingCount > 0 ? "warn" : "default"}
          />
          <StatTile icon="account_balance" label="All time" value={formatLKR(totals.collectedAllTimeLKR)} tone="success" />
        </div>

        {!bankReady ? (
          <div className="mt-6 rounded-xl border border-(--color-awaken-warn)/40 bg-(--color-awaken-warn-soft) p-5">
            <p className="flex items-center gap-2 font-semibold text-(--color-awaken-warn)">
              <Icon name="priority_high" className="!text-lg" />
              Students have nowhere to deposit money yet
            </p>
            <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
              Fill in your bank details at the bottom of this page. Until you do, the deposit-slip
              page cannot show an account number, and bank payment is how most parents pay.
            </p>
          </div>
        ) : null}

        {/* ---- slips waiting -------------------------------------------- */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="rule" className="text-(--color-awaken-accent)" />
            Slips waiting for you ({slips.length})
          </h2>
          <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
            Check the amount against the slip photo before approving. Approving unlocks the class
            immediately and issues a receipt.
          </p>
          <SlipReviewList slips={slips} />
        </section>

        {/* ---- the ledger ------------------------------------------------ */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="receipt_long" className="text-(--color-awaken-accent)" />
            All payments
          </h2>
          <div className="mt-3">
            <PaymentLedger rows={ledger.rows} />
          </div>
        </section>

        {/* ---- month by month -------------------------------------------- */}
        {totals.byMonth.length > 0 ? (
          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Icon name="insights" className="text-(--color-awaken-accent)" />
              Month by month
            </h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card)">
              <table className="w-full min-w-[30rem] text-sm">
                <thead className="border-b border-(--color-awaken-line) text-left text-xs text-(--color-awaken-ink-soft) uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Month</th>
                    <th className="px-4 py-3 font-semibold">Payments</th>
                    <th className="px-4 py-3 text-right font-semibold">Banked</th>
                    <th className="px-4 py-3 text-right font-semibold">Refunded</th>
                    <th className="px-4 py-3 text-right font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.byMonth.map((month) => (
                    <tr key={month.month} className="border-b border-(--color-awaken-line) last:border-0">
                      <td className="px-4 py-3 font-medium">{month.label}</td>
                      <td className="px-4 py-3 text-(--color-awaken-ink-soft)">{month.count}</td>
                      <td className="px-4 py-3 text-right">{formatLKR(month.collectedLKR)}</td>
                      <td className="px-4 py-3 text-right text-(--color-awaken-ink-soft)">
                        {month.refundedLKR > 0 ? `-${formatLKR(month.refundedLKR)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{formatLKR(month.netLKR)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-(--color-awaken-ink-soft)">
              Amounts are what students paid. PayHere&apos;s own fee is deducted before the money
              reaches your bank, so your statement will show slightly less — reconcile against
              PayHere&apos;s settlement report, not against this total.
            </p>
          </section>
        ) : null}

        {/* ---- record a payment ------------------------------------------ */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="add_task" className="text-(--color-awaken-accent)" />
            Record a payment you received
          </h2>
          <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
            Cash after class, a direct transfer, a parent who paid at the counter. It unlocks the
            class and lands in the ledger with a receipt, tagged &quot;Cash / direct&quot;.
          </p>
          <div className="mt-4 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5">
            <ManualPaymentForm
              subjects={subjects.map((s) => ({ id: s.id, name: s.name, priceLKR: s.priceLKR }))}
            />
          </div>
        </section>

        {/* ---- gateway self-test ----------------------------------------- */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="credit_card" className="text-(--color-awaken-accent)" />
            Card payments (PayHere)
          </h2>
          <div className="mt-3 space-y-2 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 text-sm">
            <CheckRow
              ok={cardsOn}
              label="Merchant credentials"
              value={
                cardsOn
                  ? `Merchant ${publicEnv.payhere.merchantId}`
                  : "Not set — students can still pay by bank slip"
              }
            />
            <CheckRow
              ok
              warn={!sandbox}
              label="Mode"
              value={sandbox ? "Sandbox — test cards only, no real money" : "LIVE — real cards will be charged"}
            />
            <CheckRow
              ok={publicEnv.appUrl.startsWith("https://")}
              label="Notify URL"
              value={notifyUrl}
              hint={
                publicEnv.appUrl.startsWith("https://")
                  ? "PayHere calls this after every payment. It is the only thing that unlocks a class."
                  : "Must be your real https domain before a payment can unlock anything."
              }
            />
            <CheckRow
              ok={events.length > 0}
              label="Notifications received"
              value={
                events.length > 0
                  ? `${events.length} recent — newest ${formatSessionTime(events[0].receivedAt)}`
                  : "None yet. Make one sandbox payment to prove the loop works."
              }
            />
          </div>

          {events.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-4 py-2.5 text-xs"
                >
                  <span className="font-mono">{event.orderId || "—"}</span>
                  <span className="text-(--color-awaken-ink-soft)">
                    {formatSessionTime(event.receivedAt)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-bold ${
                      event.outcome === "accepted"
                        ? "bg-(--color-awaken-success-soft) text-(--color-awaken-success)"
                        : event.outcome === "duplicate"
                          ? "bg-(--color-awaken-bg) text-(--color-awaken-ink-soft)"
                          : "bg-(--color-awaken-danger-soft) text-(--color-awaken-danger)"
                    }`}
                  >
                    {event.outcome}
                  </span>
                  <span className="text-(--color-awaken-ink-soft)">
                    {event.amount ? `${event.currency ?? ""} ${event.amount}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <details className="mt-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 text-sm">
            <summary className="cursor-pointer font-semibold">How to test a card payment safely</summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-(--color-awaken-ink-soft)">
              <li>
                Keep the mode on <strong>sandbox</strong>. Sandbox has its own merchant id and
                secret from sandbox.payhere.lk — the live ones will not work there.
              </li>
              <li>
                Sign in as a student account (a second phone number), open the dashboard and press
                <strong> Pay monthly</strong>.
              </li>
              <li>
                Pay with PayHere&apos;s published sandbox test card. Real cards are never charged in
                sandbox mode.
              </li>
              <li>
                Come back here. The payment should appear as <strong>Paid</strong> with a receipt
                number, and a notification with outcome <strong>accepted</strong> should be listed
                above.
              </li>
              <li>
                If the payment stays <strong>Pending</strong> and no notification arrives, the
                notify URL above is not reachable from the internet — that is the one thing that
                cannot be tested from a laptop.
              </li>
            </ol>
          </details>
        </section>

        {/* ---- settings --------------------------------------------------- */}
        <section className="mt-10 pb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="account_balance" className="text-(--color-awaken-accent)" />
            Bank details &amp; receipt identity
          </h2>
          <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
            Shown to students paying by deposit, and printed on every receipt.
          </p>
          <div className="mt-4 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5">
            <PaymentSettingsForm settings={settings} />
          </div>
        </section>
      </main>
    </>
  );
}

function CheckRow({
  ok,
  warn,
  label,
  value,
  hint,
}: {
  ok: boolean;
  warn?: boolean;
  label: string;
  value: string;
  hint?: string;
}) {
  const tone = warn
    ? "text-(--color-awaken-warn)"
    : ok
      ? "text-(--color-awaken-success)"
      : "text-(--color-awaken-danger)";
  return (
    <div className="flex items-start gap-2 border-b border-(--color-awaken-line) pb-2 last:border-0 last:pb-0">
      <span className={tone}>
        <Icon name={warn ? "priority_high" : ok ? "check_circle" : "cancel"} className="!text-base" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="block break-all text-(--color-awaken-ink-soft)">{value}</span>
        {hint ? <span className="mt-0.5 block text-xs text-(--color-awaken-ink-soft)">{hint}</span> : null}
      </span>
    </div>
  );
}

/** Bank slips still waiting on a decision, newest first. */
async function pendingSlips(subjects: Subject[]): Promise<PendingSlip[]> {
  const snap = await col.payments().where("status", "==", "pending").limit(200).get();

  const payments = snap.docs
    .map((d) => d.data() as Payment)
    .filter((p) => p.tenantId === publicEnv.tenantId && p.provider === "bank_slip")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50);

  if (payments.length === 0) return [];

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const userRefs = [...new Set(payments.map((p) => p.uid))].map((uid) => col.users().doc(uid));
  const userSnaps = await adminDb().getAll(...userRefs);
  const userByUid = new Map(userSnaps.map((s) => [s.id, s.data() as User | undefined]));

  return payments.map((p) => ({
    id: p.id,
    studentName: userByUid.get(p.uid)?.name ?? "Unknown",
    studentPhone: userByUid.get(p.uid)?.phone ?? "",
    subjectName: subjectById.get(p.subjectId)?.name ?? p.subjectId,
    amountLKR: p.amountLKR,
    amount: formatLKR(p.amountLKR),
    slipUrl: p.slipUrl ?? "",
    submittedAt: formatSessionTime(p.createdAt),
  }));
}
