import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/session";
import { formatLKR } from "@/lib/format";
import { getPayHereConfig } from "@/lib/payments/records";
import { EXAM_PACK, EXAM_PACK_SLOTS, PAPER_IDS } from "@/lib/exam-pack/config";
import { getExamPack } from "@/lib/exam-pack/ensure";
import { getExamPackSettings } from "@/lib/exam-pack/settings";
import { hostLives, pastLives } from "@/lib/exam-pack/lives";
import { consoleConsultations, listOpenSlots, unbookedBuyers } from "@/lib/exam-pack/consultations";
import { examPackSales, filledSlots, sittingCounts } from "@/lib/exam-pack/console";
import { getPaper } from "@/lib/exam-pack/papers";
import { COLOMBO_TZ, NZ_TZ, colomboParts, formatInZone } from "@/lib/exam-pack/time";
import { googleRedirectUri, googleStatus } from "@/lib/google/settings";
import { TEST_ACCESS_DAYS, listTesters } from "@/lib/exam-pack/testers";
import { formatDate } from "@/lib/format";
import {
  ActionButton,
  CopyText,
  GoogleClientForm,
  ManualLinkForm,
  PriceForm,
  ScheduleForm,
  SlotsForm,
  TesterGrantForm,
} from "@/components/teacher/exam-pack/controls";
import { Icon } from "@/components/ui/Icon";
import { Badge, Card, Eyebrow, Notice, PageHeader, SectionBar, StatCard, StatusChip, StatusDot } from "@/components/ds";

export const dynamic = "force-dynamic";

/** Runs one panel's read, falling back if it throws — one broken query blanks its own panel, not the page. */
async function section<T>(name: string, read: () => Promise<T>, empty: T): Promise<T> {
  try {
    return await read();
  } catch (err) {
    console.error(`[teacher/exam-pack] "${name}" failed to load`, err);
    return empty;
  }
}

const GOOGLE_OUTCOME: Record<string, { tone: "success" | "warning" | "danger"; text: string }> = {
  connected: { tone: "success", text: "Google is connected. Meet links are now created automatically." },
  declined: { tone: "warning", text: "The connection was cancelled on Google's page. Press Connect Google to try again." },
  state_mismatch: { tone: "warning", text: "That connection link had expired. Press Connect Google again." },
  no_client: { tone: "warning", text: "Save the OAuth client below first, then press Connect Google." },
  no_calendar_scope: {
    tone: "danger",
    text: "Calendar permission was not ticked on Google's page. Connect again and allow calendar access.",
  },
  exchange_failed: {
    tone: "danger",
    text: "Google refused the connection. Check that the redirect URI saved in Google matches the one below exactly.",
  },
  not_signed_in: { tone: "warning", text: "Sign in as the teacher, then connect Google again." },
};

/**
 * The Exam Pack console — everything the owner does for the flagship, on one
 * screen, in the order it is needed: is it on sale, what has sold, the weekly
 * live, the consultations, the Google connection behind both, and the files.
 *
 * Sri Lanka time is the time of record (it is what students read); New Zealand
 * time is printed beside it, because that is the clock the owner lives by.
 */
export default async function TeacherExamPackPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  await requireStaffPage("/teacher/exam-pack");
  const { google: googleOutcome } = await searchParams;

  const [subject, settings, payhere, google] = await Promise.all([
    getExamPack(),
    getExamPackSettings(),
    getPayHereConfig(),
    googleStatus(),
  ]);

  const [sales, lives, past, consult, openSlots, files, sittings] = await Promise.all([
    section("sales", () => examPackSales(), { activeBuyers: 0, activeBuyerUids: [] as string[], paidCount: 0, revenueLKR: 0 }),
    section("lives", () => hostLives(settings), []),
    section("pastLives", () => pastLives(), []),
    section("consultations", () => consoleConsultations(), { upcoming: [], recent: [] }),
    section("openSlots", () => listOpenSlots(), []),
    section("files", () => filledSlots(), new Set<string>()),
    section("sittings", () => sittingCounts(), {} as Record<string, number>),
  ]);
  const [unbooked, testers] = await Promise.all([
    section("unbooked", () => unbookedBuyers(sales.activeBuyerUids), 0),
    section("testers", () => listTesters(), []),
  ]);

  const feeLKR = subject?.product?.feeLKR ?? EXAM_PACK.feeLKR;
  const accessDays = subject?.product?.accessDays ?? EXAM_PACK.accessDays;
  // eslint-disable-next-line react-hooks/purity -- server component, one render per request
  const today = colomboParts(Date.now()).date;
  const outcome = googleOutcome ? GOOGLE_OUTCOME[googleOutcome] : undefined;
  const toNeedMarking = consult.recent.filter((b) => b.status === "booked");

  return (
    <main className="mx-auto max-w-[980px] px-4 py-5 sm:px-6 sm:py-6">
      <Link href="/teacher" className="inline-flex items-center gap-1 text-sm text-ict-fg-soft underline">
        <Icon name="arrow_back" className="!text-base" />
        Teacher console
      </Link>

      <div className="mt-4">
        <PageHeader
          eyebrow="Flagship product"
          title={EXAM_PACK.name}
          subtitle={`${formatLKR(feeLKR)}, one payment, card only · ${accessDays} days of access · a ${EXAM_PACK.consultMinutes}-minute consultation and the weekly live with every purchase`}
          actions={
            <StatusChip tone={settings.enabled ? "success" : "neutral"}>
              {settings.enabled ? "On sale" : "Not on sale"}
            </StatusChip>
          }
        />
      </div>

      {outcome ? (
        <Notice tone={outcome.tone} className="mt-4">
          {outcome.text}
        </Notice>
      ) : null}

      <div className="mt-6 space-y-8">
        {/* ---------------------------------------------------------------- */}
        {/* On sale                                                           */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionBar title="On sale" hint="Off until you turn it on. Turning it off never touches what people already bought." />
          <Card variant="feature" radius="panel" className="p-6">
            <Eyebrow>{settings.enabled ? "Students can buy this now" : "Hidden from students"}</Eyebrow>
            <ul className="mt-4 space-y-2.5 text-sm">
              <Check ok={payhere.configured} label="Card payment (PayHere) is connected" hint={payhere.configured ? undefined : "Teacher → Payments. This pack is card only, so it cannot go on sale without it."} />
              {payhere.configured && payhere.mode === "sandbox" ? (
                <Check ok={false} label="PayHere is in sandbox mode" hint="Test cards only. Switch PayHere to live in Teacher → Payments before you sell to students." />
              ) : null}
              <Check ok={google.connected} label="Google is connected for Meet links" hint={google.connected ? google.accountEmail : "Optional, but without it you paste every Meet link by hand. See Google Meet below."} />
              <Check ok={openSlots.length > 0} label={`${openSlots.length} consultation time${openSlots.length === 1 ? "" : "s"} open for booking`} hint={openSlots.length > 0 ? undefined : "Publish some below, so a buyer can book the moment they pay."} />
              <Check ok={files.size === EXAM_PACK_SLOTS.length} label={`${files.size} of ${EXAM_PACK_SLOTS.length} of your files uploaded`} hint={files.size === EXAM_PACK_SLOTS.length ? undefined : "Optional. Empty slots say “Coming soon” on the pack page."} />
              <Check ok={null} label="You have read both walkthroughs and the predicted papers" hint="They were drafted with AI. Open the pack below and read a paper's review before selling." />
            </ul>
            <div className="mt-5 flex flex-wrap items-start gap-3">
              {settings.enabled ? (
                <ActionButton
                  endpoint="/api/teacher/exam-pack"
                  body={{ action: "disable" }}
                  label="Take it off sale"
                  confirm="Tap again to take it off sale"
                  variant="secondary"
                />
              ) : (
                <ActionButton
                  endpoint="/api/teacher/exam-pack"
                  body={{ action: "enable" }}
                  label="Put it on sale"
                  confirm="Tap again — students will see it"
                  variant="primary"
                />
              )}
            </div>
            <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
              <Link href={EXAM_PACK.appPath} className="underline">
                Open the pack (everything unlocked for you)
              </Link>
              <Link href={`${EXAM_PACK.appPath}?view=buyer`} className="underline">
                See it as a student before buying
              </Link>
              <Link href={EXAM_PACK.publicPath} className="underline">
                {settings.enabled
                  ? "Public sales page — share this link"
                  : "Public sales page (takes a waitlist until it is on sale)"}
              </Link>
            </p>
          </Card>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Test as a student                                                 */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionBar
            title="Test as a student"
            hint="Use the pack exactly as a buyer would, before anyone can buy it. Nothing is paid, and test accounts are never ranked against students or counted as sales."
          />
          <Card radius="card" className="p-5">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ict-fg-soft">
              <li>
                On another phone or another browser, sign in to ictcampus.lk with a second number — a second SIM or a
                family member&rsquo;s. Your own number is a teacher account and sees everything already.
              </li>
              <li>Type that number below and press Give test access ({TEST_ACCESS_DAYS} days).</li>
              <li>
                On the test phone, open Exam Pack in the menu. Sit a paper, print a copy, book a consultation, and press
                Join during the live.
              </li>
              <li>Press Reset to go through the papers and the booking again from the start.</li>
            </ol>
            <div className="mt-4">
              <TesterGrantForm />
            </div>
            {testers.length > 0 ? (
              <ul className="mt-4 divide-y divide-ict-line rounded-ict-md border border-ict-line">
                {testers.map((t) => (
                  <li key={t.uid} className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                    <span className="min-w-0 text-sm">
                      <span className="font-semibold text-ict-fg">{t.name}</span>{" "}
                      <span className="text-ict-fg-soft">· {t.phone}</span>
                      <span className="block text-xs text-ict-fg-soft">
                        {t.active ? `Test access until ${formatDate(t.until)}` : "Test access ended"}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-2">
                      <ActionButton
                        endpoint="/api/teacher/exam-pack/testers"
                        body={{ action: "reset", uid: t.uid }}
                        label="Reset papers and booking"
                        confirm="Tap again to reset"
                        done="Reset."
                      />
                      {t.active ? (
                        <ActionButton
                          endpoint="/api/teacher/exam-pack/testers"
                          body={{ action: "remove", uid: t.uid }}
                          label="Remove access"
                          confirm="Tap again to remove"
                        />
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ict-fg-soft">
              <span>Sat a paper on this teacher account?</span>
              <ActionButton
                endpoint="/api/teacher/exam-pack/testers"
                body={{ action: "reset_me" }}
                label="Reset my own papers and booking"
                confirm="Tap again to reset"
                done="Reset."
              />
            </div>
            <p className="mt-4 text-xs text-ict-fg-soft">
              To rehearse paying as well: switch PayHere to sandbox in Teacher → Payments, open{" "}
              <Link href={`${EXAM_PACK.appPath}?view=buyer`} className="underline">
                the pack as a buyer
              </Link>{" "}
              on this teacher account and pay with a PayHere test card. That works only in sandbox, so no real money can
              move while the pack is off sale. Switch PayHere back to live afterwards.
            </p>
          </Card>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Sales                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionBar title="Sales" />
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatCard icon="group" label="Buyers" value={sales.activeBuyers} hint="With access today" />
            <StatCard icon="payments" label="Revenue" value={formatLKR(sales.revenueLKR)} hint={`${sales.paidCount} payment${sales.paidCount === 1 ? "" : "s"}`} />
            <StatCard
              icon="co_present"
              label="Not booked yet"
              value={unbooked}
              hint="Buyers still to book a consultation"
              tone={unbooked > 0 && openSlots.length === 0 ? "warning" : "neutral"}
            />
            <StatCard
              icon="quiz"
              label="Papers sat"
              value={PAPER_IDS.reduce((sum, id) => sum + (sittings[id] ?? 0), 0)}
              hint={PAPER_IDS.map((id) => `${getPaper(id).year}: ${sittings[id] ?? 0}`).join(" · ")}
            />
          </div>
          <Card radius="card" className="mt-3 p-5">
            <p className="text-sm font-semibold text-ict-fg">Price</p>
            <div className="mt-3">
              <PriceForm feeLKR={feeLKR} accessDays={accessDays} />
            </div>
          </Card>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Saturday live                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionBar
            title="The weekly live"
            hint="Each week's Google Meet is created by itself — when a buyer opens the pack, or when you press Prepare. A new link every week."
          />
          <Card radius="card" className="p-5">
            <ScheduleForm live={settings.live} />
          </Card>

          <div className="mt-3 space-y-2">
            {lives.length === 0 ? (
              <Notice tone="info">The weekly live is switched off.</Notice>
            ) : (
              lives.map((live) => (
                <Card key={live.id} radius="card" className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ict-fg">{formatInZone(live.startsAt, COLOMBO_TZ)} Sri Lanka</p>
                      <p className="text-sm text-ict-fg-soft">{formatInZone(live.startsAt, NZ_TZ)} New Zealand · {live.durationMinutes} min</p>
                    </div>
                    <StatusChip tone={live.status === "cancelled" ? "neutral" : live.joinUrl ? "success" : "warning"}>
                      {live.status === "cancelled"
                        ? "Cancelled"
                        : live.status === "planned"
                          ? "Not prepared yet"
                          : live.joinUrl
                            ? `Link ready · ${live.joins} opened it`
                            : "No link yet"}
                    </StatusChip>
                  </div>
                  {live.joinUrl ? (
                    <a
                      href={live.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ict-accent-fg"
                    >
                      <Icon name="videocam" className="!text-base" />
                      Open the Meet as host
                    </a>
                  ) : null}
                  {live.meetError ? <p className="mt-2 text-xs text-ict-danger-fg">{live.meetError}</p> : null}
                  {live.status !== "planned" ? (
                    <div className="mt-4 flex flex-wrap items-start gap-2">
                      {live.status === "cancelled" ? (
                        <ActionButton endpoint="/api/teacher/exam-pack/lives" body={{ action: "restore", id: live.id }} label="Bring this week back" />
                      ) : (
                        <>
                          <ActionButton
                            endpoint="/api/teacher/exam-pack/lives"
                            body={{ action: "cancel", id: live.id }}
                            label="Cancel this week"
                            confirm="Tap again to cancel"
                          />
                          {google.connected ? (
                            <ActionButton
                              endpoint="/api/teacher/exam-pack/lives"
                              body={{ action: "reset", id: live.id }}
                              label="Make a new Meet link"
                              confirm="Tap again — the old link stops working"
                            />
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}
                  {live.status !== "cancelled" ? (
                    <div className="mt-4">
                      <p className="mb-1.5 text-xs text-ict-fg-soft">Or paste a Meet link by hand — it wins over Google&rsquo;s:</p>
                      <ManualLinkForm endpoint="/api/teacher/exam-pack/lives" body={{ action: "link", id: live.id }} current={live.manualUrl} />
                    </div>
                  ) : null}
                </Card>
              ))
            )}
          </div>
          <div className="mt-3">
            <ActionButton
              endpoint="/api/teacher/exam-pack/lives"
              body={{ action: "prepare" }}
              label="Prepare the next two weeks now"
              done="Prepared."
            />
          </div>

          {past.length > 0 ? (
            <Card radius="card" className="mt-3 p-5">
              <p className="text-sm font-semibold text-ict-fg">Recent lives</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ict-fg-soft">
                {past.map((l) => (
                  <li key={l.id} className="flex justify-between gap-3">
                    <span>{formatInZone(l.startsAt, COLOMBO_TZ)}{l.status === "cancelled" ? " · cancelled" : ""}</span>
                    <span className="tabular-nums">{l.joins} opened the link</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Consultations                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionBar
            title="Consultations"
            hint={`Every buyer gets one ${EXAM_PACK.consultMinutes}-minute call. Publish times you are free; students book them, at least 3 hours ahead.`}
          />
          <Card radius="card" className="p-5">
            <SlotsForm minDate={today} />
          </Card>

          {toNeedMarking.length > 0 ? (
            <Card radius="card" className="mt-3 p-5">
              <p className="text-sm font-semibold text-ict-fg">Mark these</p>
              <p className="mt-0.5 text-xs text-ict-fg-soft">Calls that have happened. A no-show can be given back with Cancel.</p>
              <ul className="mt-3 space-y-3">
                {toNeedMarking.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-ict-fg">
                      {b.studentName} · {formatInZone(b.startsAt, COLOMBO_TZ)}
                    </span>
                    <span className="flex flex-wrap gap-2">
                      <ActionButton endpoint="/api/teacher/exam-pack/consultations" body={{ action: "mark", bookingId: b.id, status: "completed" }} label="Done" />
                      <ActionButton endpoint="/api/teacher/exam-pack/consultations" body={{ action: "mark", bookingId: b.id, status: "no_show" }} label="No-show" />
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <div className="mt-3 space-y-2">
            {consult.upcoming.length === 0 ? (
              <Notice tone="info">No times published yet.</Notice>
            ) : (
              consult.upcoming.map((slot) => (
                <Card key={slot.id} radius="card" className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ict-fg">{formatInZone(slot.startsAt, COLOMBO_TZ)} Sri Lanka</p>
                      <p className="text-sm text-ict-fg-soft">{formatInZone(slot.startsAt, NZ_TZ)} New Zealand</p>
                    </div>
                    {slot.booking ? (
                      <StatusChip tone={slot.booking.status === "booked" ? "success" : "neutral"}>
                        {slot.booking.status === "booked" ? "Booked" : slot.booking.status === "completed" ? "Done" : "No-show"}
                      </StatusChip>
                    ) : (
                      <ActionButton
                        endpoint="/api/teacher/exam-pack/consultations"
                        body={{ action: "delete_slot", slotId: slot.id }}
                        label="Withdraw"
                      />
                    )}
                  </div>
                  {slot.booking ? (
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="text-ict-fg">
                        {slot.booking.studentName} · <span className="text-ict-fg-soft">{slot.booking.studentPhone}</span>
                      </p>
                      {slot.booking.note ? (
                        <p className="rounded-ict-md border border-ict-line bg-ict-surface-raised p-3 whitespace-pre-line text-ict-fg">
                          {slot.booking.note}
                        </p>
                      ) : null}
                      {slot.booking.manualUrl || slot.booking.meetUrl ? (
                        <a
                          href={slot.booking.manualUrl || slot.booking.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-semibold text-ict-accent-fg"
                        >
                          <Icon name="videocam" className="!text-base" />
                          Open the Meet as host
                        </a>
                      ) : (
                        <p className="text-xs text-ict-fg-soft">No Meet link yet{slot.booking.meetError ? ` — ${slot.booking.meetError}` : "."}</p>
                      )}
                      {slot.booking.status === "booked" ? (
                        <div className="flex flex-wrap items-start gap-2 pt-1">
                          <ActionButton
                            endpoint="/api/teacher/exam-pack/consultations"
                            body={{ action: "cancel_booking", bookingId: slot.booking.id }}
                            label="Cancel — they book again"
                            confirm="Tap again to cancel"
                          />
                          {google.connected && !slot.booking.meetUrl ? (
                            <ActionButton
                              endpoint="/api/teacher/exam-pack/consultations"
                              body={{ action: "retry_meet", bookingId: slot.booking.id }}
                              label="Try the Meet link again"
                            />
                          ) : null}
                        </div>
                      ) : null}
                      {slot.booking.status === "booked" ? (
                        <ManualLinkForm
                          endpoint="/api/teacher/exam-pack/consultations"
                          body={{ action: "link", bookingId: slot.booking.id }}
                          current={slot.booking.manualUrl}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              ))
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Google Meet                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionBar
            title="Google Meet"
            hint="Connect once, and every live and every consultation gets its own Meet link in your Google Calendar, with Google's reminders."
          />
          <Card radius="card" className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-ict-fg">
                <StatusDot tone={google.connected ? "success" : "warning"} />
                {google.connected
                  ? `Connected${google.accountEmail ? ` as ${google.accountEmail}` : ""}`
                  : google.clientReady
                    ? "OAuth client saved — not connected yet"
                    : "Not set up"}
              </p>
              <div className="flex flex-wrap items-start gap-2">
                {google.clientReady ? (
                  <a
                    href="/api/teacher/google/connect"
                    className="ict-press inline-flex h-8 items-center rounded-full bg-ict-orange-500 px-4 text-sm font-semibold text-white hover:bg-ict-orange-600"
                  >
                    {google.connected ? "Reconnect Google" : "Connect Google"}
                  </a>
                ) : null}
                {google.connected ? (
                  <>
                    <ActionButton endpoint="/api/teacher/google/check" label="Check the connection" done="Google answered — the connection works." />
                    <ActionButton endpoint="/api/teacher/google" method="DELETE" label="Disconnect" confirm="Tap again to disconnect" />
                  </>
                ) : null}
              </div>
            </div>
            {google.lastError ? (
              <p className="mt-3 text-xs text-ict-danger-fg">Last problem: {google.lastError}</p>
            ) : null}

            <details className="mt-5 rounded-ict-md border border-ict-line p-4" open={!google.clientReady}>
              <summary className="cursor-pointer text-sm font-semibold text-ict-fg">Set it up — about ten minutes, in a browser</summary>
              <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-sm text-ict-fg-soft">
                <li>
                  Open <span className="text-ict-fg">console.cloud.google.com</span>, signed in as the Google account whose
                  calendar should hold the classes. Pick the project <span className="text-ict-fg">srizone-1fc76</span>.
                </li>
                <li>
                  APIs &amp; Services → Library → search <span className="text-ict-fg">Google Calendar API</span> → Enable.
                </li>
                <li>
                  APIs &amp; Services → OAuth consent screen: user type <span className="text-ict-fg">External</span>, app name
                  &ldquo;ICT Campus&rdquo;, your email. Add the scope <span className="text-ict-fg">…/auth/calendar.events</span>.
                  Then set Publishing status to <span className="text-ict-fg">In production</span> — in Testing, Google
                  disconnects you every seven days.
                </li>
                <li>
                  APIs &amp; Services → Credentials → Create credentials → OAuth client ID → type{" "}
                  <span className="text-ict-fg">Web application</span>. Under Authorised redirect URIs add exactly:
                  <div className="mt-1.5">
                    <CopyText text={googleRedirectUri()} />
                  </div>
                </li>
                <li>Copy the Client ID and Client secret Google shows you into the form below, and save.</li>
                <li>
                  Press <span className="text-ict-fg">Connect Google</span>. Google will say the app is not verified —
                  that is expected for your own app: Advanced → Go to ICT Campus → allow calendar access.
                </li>
              </ol>
            </details>

            <div className="mt-5">
              {google.clientSource === "env" ? (
                <Notice tone="info">The OAuth client comes from the environment variables, so it is not editable here.</Notice>
              ) : (
                <GoogleClientForm hasClient={google.clientReady} />
              )}
            </div>

            <p className="mt-5 text-xs text-ict-fg-soft">
              A free Google account ends a group call at 60 minutes and takes up to 100 people. Google One Premium or
              Google Workspace lifts both. Students need a Google account on their phone to join — almost every Android
              phone has one — and wait in the waiting room until you let them in (Admit all).
            </p>
          </Card>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Files                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionBar title="Your files" hint="Upload from Content: choose Pack file, the Exam Pack, then the slot. A newer upload replaces the old one." href="/teacher/content" linkLabel="Open Content" />
          <Card radius="card" className="divide-y divide-ict-line p-1">
            {EXAM_PACK_SLOTS.map((slot) => (
              <div key={slot.key} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                <span className="min-w-0 text-ict-fg">{slot.title.en}</span>
                {files.has(slot.key) ? <Badge tone="success">Uploaded</Badge> : <Badge tone="neutral">Coming soon</Badge>}
              </div>
            ))}
          </Card>
        </section>

      </div>
    </main>
  );
}

/** A checklist line. `ok: null` is a manual check the console cannot verify. */
function Check({ ok, label, hint }: { ok: boolean | null; label: string; hint?: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <StatusDot tone={ok === null ? "info" : ok ? "success" : "warning"} className="mt-[7px]" />
      <span>
        <span className="font-semibold">{label}</span>
        {hint ? <span className="block opacity-80">{hint}</span> : null}
      </span>
    </li>
  );
}
