import Link from "next/link";
import { adminDb, col } from "@/lib/firebase/admin";
import { requireStaffPage } from "@/lib/auth/session";
import { listSellableSubjects } from "@/lib/queries";
import { payableLKR } from "@/lib/payments/pricing";
import { publicEnv } from "@/lib/env";
import { formatLKR, formatSessionTime } from "@/lib/format";
import { getLedger, type Ledger } from "@/lib/payments/ledger";
import { paymentsPaused } from "@/lib/payments/launch";
import {
  bankDetailsReady,
  emptyPaymentSettings,
  getPayHereConfig,
  getPaymentSettings,
  listPaymentEvents,
} from "@/lib/payments/records";
import { PaymentLedger } from "@/components/teacher/PaymentLedger";
import { ManualPaymentForm } from "@/components/teacher/ManualPaymentForm";
import { PaymentSettingsForm } from "@/components/teacher/PaymentSettingsForm";
import { SlipReviewList, type PendingSlip } from "@/components/teacher/SlipReviewList";
import { SandboxTestPanel } from "@/components/teacher/SandboxTestPanel";
import { ActivityBell } from "@/components/teacher/ActivityBell";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "@/components/ds";
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
  // Gate only — the app shell renders who is signed in.
  await requireStaffPage("/teacher/payments");

  const subjects = await section("subjects", () => listSellableSubjects(), [] as Subject[]);

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
  const payhere = await getPayHereConfig();
  const cardsOn = payhere.configured;
  const sandbox = payhere.mode === "sandbox";
  const notifyUrl = `${publicEnv.appUrl}/api/payments/payhere/notify`;
  const bankReady = bankDetailsReady(settings);
  // The secret never leaves the server — the form only learns that one exists.
  const { payhereMerchantSecret, ...settingsForForm } = settings;

  return (
      <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-1 text-sm text-ict-fg-soft underline"
        >
          <Icon name="arrow_back" className="!text-base" />
          Teacher console
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payments &amp; accounts</h1>
            <p className="mt-1 text-sm text-ict-fg-soft">
              Every rupee in, who paid it, and the file your accountant needs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ActivityBell />
            <a
              href="/api/teacher/payments/export"
              className="inline-flex items-center gap-1.5 rounded-full bg-ict-orange-500 hover:bg-ict-orange-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Icon name="download" className="!text-base" />
              Download CSV
            </a>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon="payments" label="This month" value={formatLKR(totals.collectedThisMonthLKR)} tone="brand" />
          <StatCard icon="calendar_month" label="Last month" value={formatLKR(totals.collectedLastMonthLKR)} />
          <StatCard
            icon="receipt_long"
            label="Waiting"
            value={formatLKR(totals.pendingLKR)}
            tone={totals.pendingCount > 0 ? "warning" : "neutral"}
          />
          <StatCard icon="account_balance" label="All time" value={formatLKR(totals.collectedAllTimeLKR)} tone="success" />
        </div>

        {/* Trial-only launch. Said here because this screen is where the owner
            would otherwise wonder why no card payment has come in for a week —
            and because manual entry and slip approval below still work, so the
            difference is not obvious from the ledger alone. */}
        {paymentsPaused() ? (
          <div className="mt-6 rounded-ict-md border border-ict-line p-5">
            <p className="flex items-center gap-2 font-semibold">
              <Icon name="info" className="!text-lg" />
              Student payments are switched off for launch
            </p>
            <p className="mt-1.5 text-sm text-ict-fg-soft">
              Students are being offered the free trial instead, and every card and bank-slip
              route is refused. You can still record a cash payment by hand below, and any
              PayHere notification that arrives is still honoured. To take payments again, set{" "}
              <code>TRIAL_ONLY_LAUNCH</code> to <code>false</code> in{" "}
              <code>lib/payments/launch.ts</code> and push to <code>main</code>.
            </p>
          </div>
        ) : null}

        {!bankReady ? (
          <div className="mt-6 rounded-ict-md border border-ict-amber-500/40 bg-ict-amber-500/15 p-5">
            <p className="flex items-center gap-2 font-semibold text-ict-amber-500">
              <Icon name="priority_high" className="!text-lg" />
              Students have nowhere to deposit money yet
            </p>
            <p className="mt-1 text-sm text-ict-fg-soft">
              Fill in your bank details at the bottom of this page. Until you do, the deposit-slip
              page cannot show an account number, and bank payment is how most parents pay.
            </p>
          </div>
        ) : null}

        {/* ---- slips waiting -------------------------------------------- */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="rule" className="text-ict-accent-fg" />
            Slips waiting for you ({slips.length})
          </h2>
          <p className="mt-1 text-sm text-ict-fg-soft">
            Check the amount against the slip photo before approving. Approving unlocks the class
            immediately and issues a receipt.
          </p>
          <SlipReviewList slips={slips} />
        </section>

        {/* ---- the ledger ------------------------------------------------ */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="receipt_long" className="text-ict-accent-fg" />
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
              <Icon name="insights" className="text-ict-accent-fg" />
              Month by month
            </h2>
            <div className="mt-3 overflow-x-auto rounded-ict-md border border-ict-line bg-ict-surface-card">
              <table className="w-full min-w-[30rem] text-sm">
                <thead className="border-b border-ict-line text-left text-xs text-ict-fg-soft uppercase">
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
                    <tr key={month.month} className="border-b border-ict-line last:border-0">
                      <td className="px-4 py-3 font-medium">{month.label}</td>
                      <td className="px-4 py-3 text-ict-fg-soft">{month.count}</td>
                      <td className="px-4 py-3 text-right">{formatLKR(month.collectedLKR)}</td>
                      <td className="px-4 py-3 text-right text-ict-fg-soft">
                        {month.refundedLKR > 0 ? `-${formatLKR(month.refundedLKR)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{formatLKR(month.netLKR)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-ict-fg-soft">
              Amounts are what students paid. PayHere&apos;s own fee is deducted before the money
              reaches your bank, so your statement will show slightly less — reconcile against
              PayHere&apos;s settlement report, not against this total.
            </p>
          </section>
        ) : null}

        {/* ---- record a payment ------------------------------------------ */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="add_task" className="text-ict-accent-fg" />
            Record a payment you received
          </h2>
          <p className="mt-1 text-sm text-ict-fg-soft">
            Cash after class, a direct transfer, a parent who paid at the counter. It unlocks the
            class and lands in the ledger with a receipt, tagged &quot;Cash / direct&quot;.
          </p>
          <div className="mt-4 rounded-ict-md border border-ict-line bg-ict-surface-card p-5">
            <ManualPaymentForm
              subjects={subjects.map((s) => ({ id: s.id, name: s.name, priceLKR: payableLKR(s) }))}
            />
          </div>
        </section>

        {/* ---- gateway self-test ----------------------------------------- */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="credit_card" className="text-ict-accent-fg" />
            Card payments (PayHere)
          </h2>
          <div className="mt-3 space-y-2 rounded-ict-md border border-ict-line bg-ict-surface-card p-5 text-sm">
            <CheckRow
              ok={cardsOn}
              label="Merchant credentials"
              value={
                cardsOn
                  ? `Merchant ${payhere.merchantId} · from ${payhere.source === "env" ? "this deployment's environment" : "the form below"}`
                  : "Not set — enter them at the bottom of this page. Students can still pay by bank slip."
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
                  className="flex flex-wrap items-center justify-between gap-2 rounded-ict-md border border-ict-line bg-ict-surface-card px-4 py-2.5 text-xs"
                >
                  <span className="font-mono">{event.orderId || "—"}</span>
                  <span className="text-ict-fg-soft">
                    {formatSessionTime(event.receivedAt)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-bold ${
                      event.outcome === "accepted"
                        ? "bg-ict-green-500/15 text-ict-green-500"
                        : event.outcome === "duplicate"
                          ? "bg-ict-surface text-ict-fg-soft"
                          : "bg-ict-red-500/15 text-ict-danger-fg"
                    }`}
                  >
                    {event.outcome}
                  </span>
                  <span className="text-ict-fg-soft">
                    {event.amount ? `${event.currency ?? ""} ${event.amount}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {sandbox && cardsOn ? (
            <div className="mt-4 rounded-ict-md border border-ict-orange-500/30 bg-ict-surface-raised p-5">
              <p className="flex items-center gap-2 font-semibold text-ict-accent-fg">
                <Icon name="rule" className="!text-lg" />
                Rehearse a payment without PayHere
              </p>
              <p className="mt-1 mb-4 text-sm text-ict-fg-soft">
                Runs one notification through the real handler — signature check, ledger, receipt,
                unlock and notification — so you can prove this side works before PayHere can reach
                you. Sandbox only; it refuses in live mode.
              </p>
              <SandboxTestPanel subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} />
            </div>
          ) : null}

          <details className="mt-3 rounded-ict-md border border-ict-line bg-ict-surface-card p-5 text-sm">
            <summary className="cursor-pointer font-semibold">
              Testing a real sandbox card, step by step
            </summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-ict-fg-soft">
              <li>
                Create a <strong>sandbox account at sandbox.payhere.lk</strong>. Its merchant id and
                secret are different from your live ones — live credentials never work in sandbox.
              </li>
              <li>
                In the PayHere portal, add this site&apos;s domain under
                <strong> Settings → Domains &amp; Credentials</strong> and wait for it to be
                approved. Until then checkout is refused before a card is ever entered.
              </li>
              <li>
                Enter the merchant id and secret at the bottom of this page, mode
                <strong> sandbox</strong>, and save.
              </li>
              <li>
                Press <strong>Run a sandbox test payment</strong> above. If that works, everything on
                our side is correct and anything still failing is at PayHere&apos;s end.
              </li>
              <li>
                Now the real thing: sign in as a student on another phone number, in a different
                browser, and press <strong>Pay monthly</strong>. Pay with PayHere&apos;s published
                sandbox test card — no real card is ever charged in sandbox.
              </li>
              <li>
                Watch this page. The payment appears as <strong>Paid</strong> with a receipt number,
                the notification is listed as <strong>accepted</strong>, and the Activity bell
                counts it within twenty seconds.
              </li>
              <li>
                Stuck on <strong>Pending</strong> with no notification listed? PayHere could not
                reach the notify URL above. Check the URL is your real https domain and that the
                domain is approved — nothing else can cause it.
              </li>
            </ol>
          </details>
        </section>

        {/* ---- settings --------------------------------------------------- */}
        <section className="mt-10 pb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon name="account_balance" className="text-ict-accent-fg" />
            Bank details &amp; receipt identity
          </h2>
          <p className="mt-1 text-sm text-ict-fg-soft">
            Shown to students paying by deposit, and printed on every receipt.
          </p>
          <div className="mt-4 rounded-ict-md border border-ict-line bg-ict-surface-card p-5">
            <PaymentSettingsForm
              settings={settingsForForm}
              hasStoredSecret={Boolean(payhereMerchantSecret)}
              secretFromEnv={payhere.source === "env"}
            />
          </div>
        </section>
      </main>
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
    ? "text-ict-amber-500"
    : ok
      ? "text-ict-green-500"
      : "text-ict-danger-fg";
  return (
    <div className="flex items-start gap-2 border-b border-ict-line pb-2 last:border-0 last:pb-0">
      <span className={tone}>
        <Icon name={warn ? "priority_high" : ok ? "check_circle" : "cancel"} className="!text-base" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="block break-all text-ict-fg-soft">{value}</span>
        {hint ? <span className="mt-0.5 block text-xs text-ict-fg-soft">{hint}</span> : null}
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
